from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.models import BusinessAccount, BusinessProfile, BrandProfile, TargetAudience, MarketingPreferences, Asset
from app.schemas.business_settings import BusinessSettingsUpdate, BusinessSettingsResponse
from app.schemas.audience import TargetAudienceResponse
from app.security.tenant import TenantContext
from app.services.asset_service import AssetService


class BusinessSettingsService:
    def __init__(self, db: Session):
        self.db = db

    def account(self, context, business_id):
        account = self.db.scalar(select(BusinessAccount).where(BusinessAccount.id == business_id, BusinessAccount.tenant_id == context.tenant_id, BusinessAccount.status == "active"))
        if account is None:
            raise ValueError("Selected business is unavailable.")
        return account

    def record(self, model, context, business_id):
        return self.db.scalar(select(model).where(model.tenant_id == context.tenant_id, model.business_account_id == business_id))

    def get(self, context: TenantContext, business_id: int):
        self.account(context, business_id)
        brand = self.record(BrandProfile, context, business_id)
        audiences = self.db.scalars(select(TargetAudience).where(TargetAudience.tenant_id == context.tenant_id, TargetAudience.business_account_id == business_id).order_by(TargetAudience.id)).all()
        logo_url = None
        if brand and brand.logo_asset_id:
            asset = self.db.scalar(select(Asset).where(Asset.id == brand.logo_asset_id, Asset.tenant_id == context.tenant_id, Asset.business_account_id == business_id, Asset.status != "deleted"))
            if asset:
                logo_url = AssetService(self.db).build_signed_url(asset=asset)
        normalized = []
        for item in audiences:
            fields = {key: getattr(item, key) for key in TargetAudienceResponse.model_fields}
            for key in ("age_groups", "genders", "locations", "languages", "interests", "pain_points", "needs"):
                fields[key] = fields[key] or []
            normalized.append(TargetAudienceResponse(**fields))
        return BusinessSettingsResponse(business=self.record(BusinessProfile, context, business_id), brand=brand, audiences=normalized, preferences=self.record(MarketingPreferences, context, business_id), logo_url=logo_url)

    def save(self, context: TenantContext, business_id: int, data: BusinessSettingsUpdate):
        account = self.account(context, business_id)
        if data.business.business_name != data.brand.brand_name or data.business.category != data.brand.industry or str(data.business.website or "") != str(data.brand.website or ""):
            raise ValueError("Business and brand name, industry and website must match.")
        if not data.brand.logo_asset_id:
            raise ValueError("Upload a business logo before saving.")
        AssetService(self.db).resolve_owned_image_path(tenant_id=context.tenant_id, business_account_id=business_id, asset_id=data.brand.logo_asset_id)
        audience = None
        if data.audience_id:
            audience = self.db.scalar(select(TargetAudience).where(TargetAudience.id == data.audience_id, TargetAudience.tenant_id == context.tenant_id, TargetAudience.business_account_id == business_id))
            if audience is None:
                raise ValueError("Audience does not belong to the selected business.")
        if data.audience and not data.audience_id and self.record(TargetAudience, context, business_id):
            raise ValueError("Select the audience to update.")
        try:
            for model, payload in ((BusinessProfile, data.business), (BrandProfile, data.brand), (MarketingPreferences, data.preferences)):
                if payload is None:
                    continue
                record = self.record(model, context, business_id)
                if record is None:
                    record = model(tenant_id=context.tenant_id, business_account_id=business_id)
                    self.db.add(record)
                for key, value in payload.model_dump(mode="json").items():
                    setattr(record, key, value)
            if data.audience:
                if audience is None:
                    audience = TargetAudience(tenant_id=context.tenant_id, business_account_id=business_id)
                    self.db.add(audience)
                for key, value in data.audience.model_dump(mode="json").items():
                    setattr(audience, key, value)
                groups = data.audience.age_groups
                if groups:
                    if "All Ages" in groups:
                        audience.age_min, audience.age_max = 13, 120
                    else:
                        audience.age_min = min(int(group.split("-")[0].rstrip("+")) for group in groups)
                        audience.age_max = max(120 if group.endswith("+") else int(group.split("-")[1]) for group in groups)
                else:
                    audience.age_min, audience.age_max = None, None
            account.name = data.business.business_name
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return self.get(context, business_id)
