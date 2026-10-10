import json
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import pytest
from cryptography.fernet import Fernet, InvalidToken
from pydantic import ValidationError
from app.models.config import ModelSettings, settings
from app.repositories.local_credential_repository import LocalCredentialRepository
from app.schemas.credentials import OAuthCredential
from app.security.fernet import FernetEncryptionService
from app.storage.json_storage import JsonStorage


def repository(root, key):
    return LocalCredentialRepository(FernetEncryptionService(key),storage=JsonStorage(),root=root)


def credential(tenant='tenant-a'):
    return OAuthCredential(tenant_id=tenant,platform='google_business',access_token='test-access',refresh_token='test-refresh',page_access_token='test-page')


def test_backend_worker_and_recreated_repository_share_encrypted_files(tmp_path):
    key=Fernet.generate_key().decode()
    backend=repository(tmp_path/'credentials',key)
    backend.save_for_channel(credential(),'tenant-a',1,11)
    path=backend._channel_path('tenant-a',1,11)
    contents=path.read_text()
    assert all(token not in contents for token in ('test-access','test-refresh','test-page'))
    worker=repository(tmp_path/'credentials',key)
    saved=worker.get_for_channel('tenant-a',1,11)
    assert (saved.access_token,saved.refresh_token,saved.page_access_token)==('test-access','test-refresh','test-page')
    del backend,worker
    assert repository(tmp_path/'credentials',key).get_for_channel('tenant-a',1,11).access_token=='test-access'
    assert repository(tmp_path/'credentials',key).get_for_channel('tenant-a',2,11) is None
    assert repository(tmp_path/'credentials',key).get_for_channel('tenant-b',1,11) is None
    if os.name=='posix':assert path.stat().st_mode & 0o777==0o600


def test_wrong_key_cannot_read_saved_credentials(tmp_path):
    repository(tmp_path,Fernet.generate_key().decode()).save(credential())
    with pytest.raises(InvalidToken):repository(tmp_path,Fernet.generate_key().decode()).get('tenant-a','google_business')


def test_existing_credentials_not_overwritten_on_repository_creation(tmp_path):
    key=Fernet.generate_key().decode();first=repository(tmp_path,key);first.save(credential())
    path=first._path('tenant-a','google_business');before=path.read_bytes()
    repository(tmp_path,key)
    assert path.read_bytes()==before


def test_atomic_failure_keeps_previous_file(tmp_path,monkeypatch):
    repo=repository(tmp_path,Fernet.generate_key().decode());repo.save(credential())
    path=repo._path('tenant-a','google_business');before=path.read_bytes()
    def fail(*args):raise OSError('test replacement failure')
    monkeypatch.setattr(os,'replace',fail)
    with pytest.raises(OSError):repo.save(credential())
    assert path.read_bytes()==before
    assert list(path.parent.glob('.credential-*'))==[]


def test_concurrent_reader_never_sees_partial_json(tmp_path):
    key=Fernet.generate_key().decode();writer=repository(tmp_path,key);reader=repository(tmp_path,key)
    writer.save(credential())
    def write():
        for i in range(20):writer.save(credential())
    def read():
        for i in range(40):assert reader.get('tenant-a','google_business').access_token=='test-access'
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures=[pool.submit(write),pool.submit(read)]
        for future in futures:future.result()


@pytest.mark.parametrize('key',['','bad-key'])
def test_invalid_key_fails_configuration_without_leaking_value(key):
    values=settings.model_dump();values['CREDENTIAL_ENCRYPTION_KEY']=key
    with pytest.raises(ValidationError) as error:ModelSettings(_env_file=None,**values)
    assert 'valid Fernet key' in str(error.value)
    assert 'input_value=' not in str(error.value)


def test_blank_root_rejected():
    values=settings.model_dump();values['CREDENTIAL_STORAGE_ROOT']=' '
    with pytest.raises(ValidationError):ModelSettings(_env_file=None,**values)


def test_configured_root_used(tmp_path,monkeypatch):
    monkeypatch.setattr(settings,'CREDENTIAL_STORAGE_ROOT',str(tmp_path))
    repo=LocalCredentialRepository(FernetEncryptionService(Fernet.generate_key().decode()),storage=JsonStorage())
    assert repo.ROOT==tmp_path


def test_compose_shared_mount_and_key_source_and_build_exclusion():
    import yaml
    compose=yaml.safe_load(Path('docker-compose.yml').read_text(encoding='utf-8'))
    for name in ('backend','celery_worker'):
        service=compose['services'][name]
        assert './data/credentials:/app/data/credentials' in service['volumes']
        assert service['env_file']==['.env']
        assert 'CREDENTIAL_STORAGE_ROOT=data/credentials' in service['environment']
        assert any(item.startswith('CREDENTIAL_ENCRYPTION_KEY=${CREDENTIAL_ENCRYPTION_KEY:?') for item in service['environment'])
    for name in ('.dockerignore','.gitignore'):
        assert 'data/credentials/' in Path(name).read_text()
        assert 'data/credential-backups/' in Path(name).read_text()
