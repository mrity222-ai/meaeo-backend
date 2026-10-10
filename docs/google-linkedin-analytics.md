# Google Business and LinkedIn analytics

Implemented on 2026-10-09 inside the existing analytics, OAuth, worker, storage and dashboard code. AI agent files were not changed.

## Implemented scope

- Google Business Performance API: per connected location and selected inclusive date range, call-button clicks, website clicks, directions and desktop/mobile Search/Maps impressions. Daily values are retained. Range totals are unavailable when any requested date is missing. Actual zero remains zero.
- Google profile performance has its own dashboard section and location selector for businesses with multiple connected locations. These numbers are not attributed to a campaign or individual post. Website clicks are not website sessions and call clicks are not answered calls.
- LinkedIn Company Page organic statistics for published share/UGC posts: impressions, clicks, likes, comments, shares and engagement when returned. Personal profiles and unsupported identifiers remain unavailable. These are lifetime post statistics, not filtered by the Google date picker. Sponsored advertising statistics are excluded.
- Ownership is checked using tenant/business/channel and publication identity. Responses for the wrong LinkedIn organization or post are rejected.
- Analytics background task is registered every six hours in existing Celery Beat. It collects campaign analytics and a rolling 30-day Google range ending yesterday (UTC). Failed accounts do not stop other accounts. Set `ANALYTICS_SYNC_ENABLED=false` to disable this task independently of the existing agent analytics feature flag.
- Profile snapshots are isolated by tenant, business, channel and range. Repeated collection replaces the same range snapshot; cumulative totals are never added together. Failed sync status is stored separately so verified data is preserved. JSON snapshot writes use atomic replacement.

## Configuration and live prerequisites

Do not replace existing credentials or encryption keys.

1. Google: enable/obtain access to Business Profile Performance API in the OAuth application's Google Cloud project. Connect an authorized business location. The existing Google OAuth scope is `https://www.googleapis.com/auth/business.manage`.
2. LinkedIn: obtain Community Management API access with the reporting permissions supported by the approved application. This implementation uses `rw_organization_admin` for organization share statistics. The authenticated member must have the required organization role.
3. Configure `LINKEDIN_OAUTH_SCOPES` to include approved scopes before reconnecting. For an app approved for these permissions, a possible value is `openid profile email w_member_social w_organization_social rw_organization_admin`. Do not request scopes that LinkedIn has not granted to the app. The default remains the existing personal publishing scopes so an unapproved application is not broken.
4. `LINKEDIN_ANALYTICS_API_VERSION` defaults to `202609`; keep this setting on a supported version. A previously issued token does not acquire new permissions merely by updating configuration: reconnect the Company Page.
5. Run/restart backend, Celery worker and Celery Beat after deploying the code. No running services were restarted as part of implementation.
6. On Analytics, select the Google date range/location and refresh. Confirm metrics against the same platform definitions and range. Google data delays or missing dates produce partial/unavailable results rather than fabricated values.

No live account/API-key verification, payment, advertising setup or live publishing was performed in this implementation.

## API references

- [Google Performance API](https://developers.google.com/my-business/reference/performance/rest/v1/locations/fetchMultiDailyMetricsTimeSeries)
- [LinkedIn organization share statistics](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/share-statistics?view=li-lms-2026-09)

## Verification

- Backend regression suite: **198 passed**.
- Frontend contract suite: **15 passed**.
- Frontend TypeScript check: passed before the final production build.
- Final Next.js production build: **passed** (54 routes/pages generated).
- Changed-code whitespace validation: passed. AI agent diff: empty.
- External-response tests include Google range completeness, zero values, authorization/rate-limit failures, location isolation, LinkedIn post/organization matching, missing permissions and background sync failure isolation.
- Automated tests mock external API responses; they do not prove live app access or platform approval.
