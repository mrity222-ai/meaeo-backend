import os

os.environ["RESEARCH_PROVIDERS"] = "mock"
os.environ["PUBLISH_MODE"] = "development"

import asyncio

from app.database.models import Tenant
from app.database.session import SessionLocal
from app.graph.marketing import MarketingGraph
from app.repositories.analytics_repository import (
    AnalyticsRepository,
)
from app.repositories.business_account_repository import (
    BusinessAccountRepository,
)
from app.research.registry import ResearchRegistry


TENANT_ID = "tenant_async_graph_test"


ResearchRegistry._providers = {}


async def main():

    print()
    print("========================================")
    print("ASYNC GRAPH PERSISTENCE TEST")
    print("========================================")

    # --------------------------------------------------------
    # Test database context
    # --------------------------------------------------------

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Ensure tenant exists
        # ----------------------------------------------------

        existing_tenant = (
            db.query(Tenant)
            .filter(
                Tenant.tenant_id == TENANT_ID
            )
            .first()
        )

        if existing_tenant is None:

            db.add(
                Tenant(
                    tenant_id=TENANT_ID,
                    name="Async Graph Test Tenant",
                )
            )

            db.commit()

        # ----------------------------------------------------
        # Ensure business account exists
        # ----------------------------------------------------

        business_account_repository = (
            BusinessAccountRepository(db)
        )

        business_accounts = (
            business_account_repository.list_for_tenant(
                TENANT_ID
            )
        )

        if business_accounts:

            business_account = business_accounts[0]

        else:

            business_account = (
                business_account_repository.create(
                    tenant_id=TENANT_ID,
                    name="Async Graph Test Business",
                )
            )

        BUSINESS_ACCOUNT_ID = business_account.id

    finally:

        db.close()

    print(
        f"Tenant: {TENANT_ID}"
    )

    print(
        f"Business Account: {BUSINESS_ACCOUNT_ID}"
    )

    # --------------------------------------------------------
    # Build graph
    # --------------------------------------------------------

    graph = MarketingGraph().build(
        async_mode=True
    )

    # --------------------------------------------------------
    # Initial state
    # --------------------------------------------------------

    state = {

        "tenant_id": TENANT_ID,

        "business_account_id": BUSINESS_ACCOUNT_ID,

        "execution_mode": "autonomous",

        "user_input": (
            "Create a 7-day Instagram campaign "
            "for my dental clinic."
        ),

        "brand_name": None,

        "brand_profile": None,

        "campaign": None,

        "raw_research": None,

        "research": None,

        "strategy": None,

        "content": None,

        "image_plan": None,

        "image_strategy": None,

        "schedule": None,

        "publishing": None,

        "analytics": None,

        "campaign_bundle": None,

        "status": None,

        "errors": [],

        "warnings": [],
    }

    # --------------------------------------------------------
    # Run graph
    # --------------------------------------------------------

    result = await graph.ainvoke(
        state
    )

    # --------------------------------------------------------
    # Basic result validation
    # --------------------------------------------------------

    assert result is not None

    assert (
        result.get("status")
        != "failed"
    ), result.get(
        "errors"
    )

    assert (
        result.get("tenant_id")
        == TENANT_ID
    )

    assert (
        result.get("business_account_id")
        == BUSINESS_ACCOUNT_ID
    )

    # --------------------------------------------------------
    # Campaign
    # --------------------------------------------------------

    assert (
        result.get("campaign")
        is not None
    )

    print(
        "Campaign: PASSED"
    )

    # --------------------------------------------------------
    # Research
    # --------------------------------------------------------

    assert (
        result.get("research")
        is not None
    )

    print(
        "Research: PASSED"
    )

    # --------------------------------------------------------
    # Strategy
    # --------------------------------------------------------

    assert (
        result.get("strategy")
        is not None
    )

    print(
        "Strategy: PASSED"
    )

    # --------------------------------------------------------
    # Content
    # --------------------------------------------------------

    content = result.get(
        "content"
    )

    assert content is not None

    print("CONTENT TYPE:", type(content))
    print("CONTENT POST COUNT:", len(content.posts))

    for i, post in enumerate(content.posts, start=1):
        print(
            f"CONTENT POST {i}: "
            f"day={getattr(post, 'day', None)}, "
            f"title={getattr(post, 'title', None)}"
        )

    assert content is not None

    print(
        "Content: PASSED"
    )

    # --------------------------------------------------------
    # Images
    # --------------------------------------------------------

    image_plan = result.get(
        "image_plan"
    )

    assert image_plan is not None

    assert len(
        image_plan.images
    ) == 7

    print(
        "Images: PASSED"
    )

    # --------------------------------------------------------
    # Schedule
    # --------------------------------------------------------

    schedule = result.get(
        "schedule"
    )

    assert schedule is not None

    assert (
        schedule.tenant_id
        == TENANT_ID
    )

    assert len(
        schedule.posts
    ) == 7

    print(
        "Scheduler tenant propagation: PASSED"
    )

    # --------------------------------------------------------
    # Publishing
    # --------------------------------------------------------

    publishing = result.get(
        "publishing"
    )

    assert publishing is not None

    assert (
        publishing.failed
        == 0
    )

    assert (
        publishing.successful
        == 7
    )

    assert len(
        publishing.posts
    ) == 7

    print(
        "Publishing: PASSED"
    )

    # --------------------------------------------------------
    # Analytics
    # --------------------------------------------------------

    analytics = result.get(
        "analytics"
    )

    assert analytics is not None

    assert (
        analytics.campaign_name
        == result["campaign"].campaign_name
    )

    assert len(
        analytics.posts
    ) == len(
        publishing.posts
    )

    assert (
        analytics.total_impressions
        > 0
    )

    assert (
        analytics.total_reach
        > 0
    )

    print(
        "Analytics generation: PASSED"
    )

    # --------------------------------------------------------
    # Final graph status
    # --------------------------------------------------------

    assert (
        result["status"]
        == "success"
    )

    print(
        "Complete async graph: PASSED"
    )

    # --------------------------------------------------------
    # Analytics persistence
    # --------------------------------------------------------

    repository = AnalyticsRepository()

    campaign_name = (
        analytics.campaign_name
    )

    persisted = repository.latest(
        TENANT_ID,
        campaign_name,
    )

    assert persisted is not None

    assert (
        persisted.campaign_name
        == campaign_name
    )

    assert (
        persisted.total_impressions
        == analytics.total_impressions
    )

    assert (
        persisted.total_reach
        == analytics.total_reach
    )

    assert (
        persisted.total_likes
        == analytics.total_likes
    )

    print(
        "Analytics persistence: PASSED"
    )

    # --------------------------------------------------------
    # Explicit tenant persistence check
    # --------------------------------------------------------

    snapshots = repository.list_snapshots(
        TENANT_ID,
        campaign_name,
    )

    assert snapshots

    latest_snapshot = snapshots[-1]

    persisted_by_date = repository.load(
        TENANT_ID,
        campaign_name,
        latest_snapshot,
    )

    assert (
        persisted_by_date.campaign_name
        == campaign_name
    )

    assert (
        persisted_by_date.total_impressions
        == analytics.total_impressions
    )

    assert (
        persisted_by_date.total_reach
        == analytics.total_reach
    )

    print(
        "Analytics tenant persistence: PASSED"
    )

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    print()
    print("========================================")
    print("ASYNC GRAPH PERSISTENCE TEST: PASSED")
    print("========================================")


if __name__ == "__main__":

    asyncio.run(
        main()
    )