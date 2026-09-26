from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.campaign.campaign_context import (
    CampaignContextBuilder,
)
from app.campaign.onboarding_context import (
    OnboardingContextService,
)
from app.database.session import get_db
from app.graph.runner import GraphRunner
from app.schemas.campaign_api import (
    CampaignRunRequest,
    CampaignRunResponse,
)
from app.security.dependencies import (
    get_current_tenant,
)
from app.security.tenant import TenantContext


router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"],
)


def build_graph_runner() -> GraphRunner:

    return GraphRunner()


@router.post(
    "/run",
    response_model=CampaignRunResponse,
)
def run_campaign(
    request: CampaignRunRequest,
    tenant: TenantContext = Depends(
        get_current_tenant
    ),
    db: Session = Depends(get_db),
):

    try:

        onboarding = (
            OnboardingContextService(db).load(
                tenant,
                request.business_account_id,
            )
        )

        campaign_context = (
            CampaignContextBuilder.build(
                onboarding
            )
        )

        state = {
            "tenant_id": tenant.tenant_id,

            "business_account_id": (
                request.business_account_id
            ),

            "user_input": request.user_input,

            "brand_name": request.brand_name,

            "campaign_context": (
                campaign_context
            ),

            "status": "running",

            "errors": [],

            "warnings": [],
        }

        if campaign_context.brand is not None:

            state["brand_profile"] = (
                campaign_context.brand
            )

        runner = build_graph_runner()

        result = runner.run(state)

    except ValueError as exc:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Campaign execution failed.",
        ) from exc

    campaign_bundle = result.get(
        "campaign_bundle"
    )

    campaign_name = None

    if campaign_bundle is not None:

        campaign = getattr(
            campaign_bundle,
            "campaign",
            None,
        )

        if campaign is not None:

            campaign_name = getattr(
                campaign,
                "campaign_name",
                None,
            )

    return CampaignRunResponse(
        status=result.get(
            "status",
            "failed",
        ),
        tenant_id=tenant.tenant_id,
        business_account_id=(
            request.business_account_id
        ),
        campaign_name=campaign_name,
        campaign_bundle=(
            campaign_bundle.model_dump(
                mode="json"
            )
            if campaign_bundle is not None
            else None
        ),
        errors=result.get(
            "errors",
            [],
        ),
        warnings=result.get(
            "warnings",
            [],
        ),
    )