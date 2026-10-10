# Steps 3–9 implementation and verification

Date: 2026-10-09

Scope: Apply the approved readiness fixes through analytics. No new feature modules or AI agent code changes. Step 10 live end-to-end verification was excluded by the user.

| Step | Applied behavior |
| --- | --- |
| 3 — Checkout | Shared Razorpay checkout uses the backend order, checkout key and minor-unit amount. Subscription success requires backend signature verification. Verification retries reuse the saved receipt instead of creating another charge. |
| 4 — Onboarding | Required failures stop onboarding. Retries reuse existing business/profile records. Selected business context is checked before writes and completion. |
| 5 — Image selection | Business-scoped catalogue photos and brand logos have distinct roles. Campaign image policy is enforced outside agent code; catalogue mode requires a product photo. |
| 6 — Image reliability | Provider failures are explicit. Production mock generation is rejected. Unverified cache entries are ignored, and cached output is copied into the scoped output location. |
| 7 — Google Business | Missing credentials cannot produce simulated success. API responses determine published, processing, failed or reconciliation-required status. Review replies and description updates require confirmed responses. |
| 8 — Asset mapping | Catalogue queries exclude brand logos and generated campaign assets. Upload role participates in deduplication. Newly rendered catalogue posters are classified as campaign output. |
| 9 — Analytics | Metrics are scoped to the business/campaign. Unknown values remain unavailable; actual zero remains zero. Published-platform counts use confirmed publications. Only verified API snapshots enter verified history. |

## Verification results

- Backend regression suite: **184 tests passed**.
- Frontend Node contract suite: **14 tests passed**.
- Frontend TypeScript check: **passed**.
- Next.js production build: **passed**.
- Docker Compose configuration validation: **passed**.
- AI agent files: **no changes**.

Tests cover checkout callbacks and retries, onboarding failure/retry behavior, catalogue and logo isolation, image failures/cache handling, Google response states and analytics isolation. External responses are mocked; these results do not establish live account operation.

## Remaining verification and limits

- Step 10 remains pending: real keys and connected test accounts must verify onboarding → catalogue → campaign → approval → publishing → reporting, including real payment verification.
- No deployment or service restart was performed. The earlier Step 2 container recreation/persistence check remains pending because the local Docker daemon did not respond.
- Follow-up implementation: Google call-button/website clicks, directions and Search/Maps impressions, plus LinkedIn Company Page organic post statistics, are now implemented. See [Google/LinkedIn analytics](google-linkedin-analytics.md) for configuration and live verification requirements. Website sessions/answered calls and Facebook reach remain outside the current mapping.
- Ambiguous legacy asset roles were not automatically migrated. Old unverified image cache entries and analytics snapshots are ignored, not deleted.
- Passing a production build does not establish production readiness without live verification.

## API references used

- [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)
- [Google Business local post creation](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts/create)
- [Google Business description update](https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations/patch)
- [Google Business review reply](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/updateReply)
