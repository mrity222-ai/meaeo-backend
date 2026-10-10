import asyncio
import hashlib
import hmac
import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.api import payments as p
from app.database.models import PaymentTransaction, SubscriptionPlan, TenantSubscription, Tenant
from app.models.config import settings
from app.security.tenant import TenantContext


@pytest.fixture
def db():
    engine = create_engine('sqlite:///:memory:')
    for model in (Tenant, SubscriptionPlan, PaymentTransaction, TenantSubscription):
        model.__table__.create(engine)
    with Session(engine) as session:
        session.add(Tenant(tenant_id='tenant1', name='Test'))
        session.add(SubscriptionPlan(plan_code='pro', name='Pro', price=999, currency='INR', billing_interval='monthly'))
        session.add(PaymentTransaction(tenant_id='tenant1', order_id='order_123', amount=999,
            currency='INR', provider='razorpay', status='created',
            raw_response={'plan_code': 'pro', 'amount_minor': 99900, 'billing_interval': 'monthly'}))
        session.commit()
        yield session
    engine.dispose()


@pytest.fixture
def remote(monkeypatch):
    payment = dict(id='pay_123', order_id='order_123', amount=99900, currency='INR',
                   status='captured', captured=True)
    order = dict(id='order_123', amount=99900, currency='INR', status='paid', amount_paid=99900, amount_due=0)
    monkeypatch.setattr(p, '_razorpay_request', lambda method, path, **kw: payment if path.startswith('payments/') else order)
    return payment, order


def tx(db):
    return db.scalar(select(PaymentTransaction))


def test_capture_activates_once(db, remote):
    first = p._confirm_payment(db, tx(db), 'pay_123')
    sub = db.scalar(select(TenantSubscription))
    expiry = sub.current_period_end
    second = p._confirm_payment(db, tx(db), 'pay_123')
    assert first['status'] == 'success' and second['already_processed']
    db.refresh(sub)
    assert sub.current_period_end == expiry
    assert len(db.scalars(select(TenantSubscription)).all()) == 1


@pytest.mark.parametrize('target,field,value', [
    ('payment','amount',1), ('payment','currency','USD'), ('payment','order_id','order_other'),
    ('payment','status','authorized'), ('payment','captured',False), ('payment','id','pay_other'),
    ('order','amount',1), ('order','currency','USD'), ('order','status','created'),
    ('order','amount_paid',1), ('order','amount_due',1),
])
def test_mismatch_never_activates(db, remote, target, field, value):
    remote[0 if target == 'payment' else 1][field] = value
    with pytest.raises(HTTPException):
        p._confirm_payment(db, tx(db), 'pay_123')
    assert tx(db).status == 'created'
    assert db.scalar(select(TenantSubscription)) is None


def request(body, signature=None):
    headers = [] if signature is None else [(b'x-razorpay-signature', signature.encode())]
    async def receive():
        return {'type': 'http.request', 'body': body, 'more_body': False}
    return Request({'type': 'http', 'method': 'POST', 'path': '/', 'headers': headers}, receive)


@pytest.mark.parametrize('signature', [None, 'wrong'])
def test_bad_webhook(db, monkeypatch, signature):
    monkeypatch.setattr(p, '_payment_secret', lambda name: 'webhook-secret')
    with pytest.raises(HTTPException) as error:
        asyncio.run(p.payment_webhook(request(b'{}', signature), db))
    assert error.value.status_code == 400
    assert tx(db).status == 'created'


def test_signed_webhook_and_checkout_share_activation(db, remote, monkeypatch):
    monkeypatch.setattr(p, '_payment_secret', lambda name: 'webhook-secret')
    raw = json.dumps({'event': 'payment.captured', 'payload': {'payment': {'entity': remote[0]}}}).encode()
    signature = hmac.new(b'webhook-secret', raw, hashlib.sha256).hexdigest()
    asyncio.run(p.payment_webhook(request(raw, signature), db))
    assert p._confirm_payment(db, tx(db), 'pay_123')['already_processed']


def test_missing_secret(monkeypatch):
    monkeypatch.setattr(settings, 'RAZORPAY_KEY_SECRET', None)
    with pytest.raises(HTTPException) as error:
        p._payment_secret('RAZORPAY_KEY_SECRET')
    assert error.value.status_code == 503


def test_missing_webhook_secret(db, monkeypatch):
    monkeypatch.setattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None)
    with pytest.raises(HTTPException) as error:
        asyncio.run(p.payment_webhook(request(b'{}'), db))
    assert error.value.status_code == 503


def test_wrong_tenant_and_signature(db, monkeypatch):
    monkeypatch.setattr(p, '_razorpay_credentials', lambda: ('test-key', 'secret'))
    body = p.VerifyPaymentRequest(order_id='order_123', payment_id='pay_123', signature='wrong')
    for tenant, expected in [('another',404), ('tenant1',400)]:
        with pytest.raises(HTTPException) as error:
            p.verify_payment(body, TenantContext(tenant), db)
        assert error.value.status_code == expected
    assert tx(db).status == 'created'


def test_database_failure_rolls_back(db, remote, monkeypatch):
    original = db.commit
    monkeypatch.setattr(db, 'commit', lambda: (_ for _ in ()).throw(RuntimeError('db failure')))
    with pytest.raises(RuntimeError):
        p._confirm_payment(db, tx(db), 'pay_123')
    monkeypatch.setattr(db, 'commit', original)
    assert tx(db).status == 'created'
    assert db.scalar(select(TenantSubscription)) is None


def test_missing_plan_not_defaulted(db, remote):
    item = tx(db)
    item.raw_response = {'plan_code': 'missing', 'amount_minor': 99900}
    db.commit()
    with pytest.raises(HTTPException):
        p._confirm_payment(db, item, 'pay_123')
    assert item.status == 'created'


def test_minor_units():
    assert p._minor_amount(999, 'INR') == 99900
    assert p._minor_amount(10.01, 'INR') == 1001
    for value in [0, -1, 1.001, float('nan')]:
        with pytest.raises(HTTPException):
            p._minor_amount(value, 'INR')


def test_production_rejects_test_key(monkeypatch):
    monkeypatch.setattr(settings, 'APP_ENV', 'production')
    monkeypatch.setattr(p, '_payment_secret', lambda name: 'rzp_test_example' if name.endswith('ID') else 'secret')
    with pytest.raises(HTTPException) as error:
        p._razorpay_credentials()
    assert error.value.status_code == 503


def test_gateway_failure_no_order(db, monkeypatch):
    monkeypatch.setattr(p, '_razorpay_credentials', lambda: ('rzp_test_example', 'secret'))
    def fail(*args, **kwargs):
        import httpx
        raise httpx.ConnectError('offline')
    monkeypatch.setattr(p.httpx, 'request', fail)
    with pytest.raises(HTTPException) as error:
        p.create_payment_order(p.CreateOrderRequest(plan_code='pro'),
                               SimpleNamespace(user_id=1), TenantContext('tenant1'), db)
    assert error.value.status_code == 502
    assert len(db.scalars(select(PaymentTransaction)).all()) == 1


def test_order_uses_server_price(db, monkeypatch):
    monkeypatch.setattr(p, '_razorpay_credentials', lambda: ('rzp_test_example', 'secret'))
    def create(method, path, **kwargs):
        data = kwargs['json']
        assert data['amount'] == 99900 and data['currency'] == 'INR'
        return {**data, 'id': 'order_new', 'status': 'created'}
    monkeypatch.setattr(p, '_razorpay_request', create)
    result = p.create_payment_order(p.CreateOrderRequest(plan_code='pro'),
                                   SimpleNamespace(user_id=1), TenantContext('tenant1'), db)
    assert result['order_id'] == 'order_new'
    item = db.scalar(select(PaymentTransaction).where(PaymentTransaction.order_id == 'order_new'))
    assert item.raw_response['amount_minor'] == 99900


def test_invalid_gateway_order_not_saved(db, monkeypatch):
    monkeypatch.setattr(p, '_razorpay_credentials', lambda: ('rzp_test_example', 'secret'))
    monkeypatch.setattr(p, '_razorpay_request', lambda *a, **kw: {'id':'order_fake'})
    with pytest.raises(HTTPException):
        p.create_payment_order(p.CreateOrderRequest(plan_code='pro'),
                               SimpleNamespace(user_id=1), TenantContext('tenant1'), db)
    assert len(db.scalars(select(PaymentTransaction)).all()) == 1


def test_checkout_signature_valid(db, remote, monkeypatch):
    monkeypatch.setattr(p, '_razorpay_credentials', lambda: ('rzp_test_example', 'secret'))
    signature = hmac.new(b'secret', b'order_123|pay_123', hashlib.sha256).hexdigest()
    result = p.verify_payment(p.VerifyPaymentRequest(order_id='order_123', payment_id='pay_123',
                               signature=signature), TenantContext('tenant1'), db)
    assert result['status'] == 'success'
    assert tx(db).status == 'paid'


def test_simultaneous_activation_once(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    engine = create_engine(f"sqlite:///{tmp_path / 'payments.db'}", connect_args={'timeout': 10})
    for model in (Tenant, SubscriptionPlan, PaymentTransaction, TenantSubscription):
        model.__table__.create(engine)
    with Session(engine) as session:
        session.add(Tenant(tenant_id='tenant1', name='Test'))
        session.add(SubscriptionPlan(plan_code='pro', name='Pro', price=999, currency='INR', billing_interval='monthly'))
        session.add(PaymentTransaction(tenant_id='tenant1', order_id='order_123', amount=999,
            currency='INR', provider='razorpay', status='created', raw_response={'plan_code':'pro'}))
        session.commit()
    barrier = Barrier(2)
    def activate():
        with Session(engine) as session:
            item = tx(session)
            barrier.wait(timeout=5)
            return p._activate_payment(session, item, 'pay_123')
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: activate(), range(2)))
        assert sum(bool(result.get('already_processed')) for result in results) == 1
        with Session(engine) as session:
            assert len(session.scalars(select(TenantSubscription)).all()) == 1
            assert tx(session).status == 'paid'
    finally:
        engine.dispose()
