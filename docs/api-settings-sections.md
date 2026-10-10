# Purpose-based API settings — 2026-10-09

## Implemented

Admin Settings now has 11 independent sections: text, image, Tavily, Firecrawl, DataForSEO, Meta, Google Business, LinkedIn, email, Razorpay and admin access. Text/image each select one active provider. Research credentials remain separate because the services do different work. Separate research Enable/Disable controls were subsequently added; existing selection is preserved until a toggle is saved, and scheduling policy remains unchanged. See `env-api-fixes.md` for the latest fixes and verification.

Each section saves only its allowlisted fields. Blank/masked keys preserve configured secrets; removal is explicit. Active text/image keys and active admin credentials cannot be removed without a working replacement. Inactive provider keys can be retained or removed. Text/image credential overrides are independent, including when both use the same vendor. Existing environment credentials remain fallback until a dedicated section override is saved. Removing a legacy fallback key in one section disables that fallback for that section; it does not delete the shared `.env` key used elsewhere.

Text/image activation requires a server-issued connection-test token bound to the section, full candidate configuration and a ten-minute expiry. Changing a field invalidates the browser's test proof. Test/activation failure preserves the previous configuration. Exact configured text provider is selected; the old unknown-provider and synchronous Gemini model fallbacks were removed.

Secrets are encrypted using the existing credential encryption key in `data/settings/runtime.enc`. File locking and atomic replacement prevent partial writes/lost unrelated updates. Per-section revisions reject stale edits. Encrypted audit records contain section, changed field names and time, without secret values. The old bulk `.env` POST endpoint returns 410 to prevent unrelated writes. No `.env` keys were edited during implementation or automated verification.

API requests and Celery tasks load a stable configuration snapshot at their boundary. Concurrent requests/tasks do not share mutable settings overrides. Existing provider credential types are preserved for Meta, DataForSEO and other integrations. Docker API/worker services share a persistent settings bind mount; settings are excluded from Git and image build context. No AI agent prompt or marketing workflow was changed.

## Use

1. Restart the API and Celery worker once to load the new code; rebuild/redeploy images for Docker. The local API runner has reload disabled. Keep the existing credential encryption key.
2. Open Admin → Settings. Choose Text or Image provider and enter its exact model name. Enter a replacement key only when needed.
3. Test connection, then Activate provider. Other sections use their own Save section button.
4. Remove inactive keys explicitly if no longer needed. New requests/tasks use saved settings without another restart.

Frontend Google login client changes need matching frontend environment values and a rebuild. Social OAuth app changes may require reconnecting accounts. Database, storage, JWT/encryption and frontend API URLs remain deployment settings; this page cannot change them.

## Verification

- Backend suite: **229 passed**, including **31 section-settings tests**. Tests use fake credentials, isolated temporary encrypted storage, mocked provider responses and never replace real credentials.
- Coverage includes authentication, field isolation, blank/masked preservation, activation proof binding/expiry, failed activation, key removal, atomic-write failure, concurrent saves, credential-type compatibility, ASGI request snapshots and worker refresh/fail-closed behavior.
- Existing frontend contract tests: **15 passed**.
- Frontend TypeScript check: **passed**.
- Isolated Next production compilation/build: **passed**, 54 pages generated. The temporary build excludes standalone packaging because its dependency junction requires Windows symlink privileges; the project deployment configuration remains unchanged. Final visual-only border/inactive-email-key presentation tweaks were checked with TypeScript and the rendered component preview.
- Actual settings components were rendered using sample data and shared compiled CSS. Desktop and 390px mobile preview checked for layout/overflow. This is not a signed-in live API test.

## Limits

Image connection tests check credentials/model metadata, not image generation or available inference capacity. OpenAI text tests check model access; HF checks token and model visibility. Gemini/Claude text probes use a small generation request. Tavily/Firecrawl tests may consume provider credits. Resend's test reads domains, so a send-only API key may fail that check despite being able to send mail. SMTP verifies login without sending email. Social account permissions and payment webhook delivery require the existing live verification flow.

Real-provider activation was not run with the user's credentials. Docker container recreation/persistence and production standalone packaging were not executed. Keep backups of the encrypted settings file and the existing encryption key together; a changed key or corrupt store fails closed instead of silently using older credentials.

Preview: `api-settings-preview.html`, `api-settings-preview.css`, `api-settings-preview.png` contain only example data and are not product routes.

## Route correction

The section router now uses `/admin/settings/sections`, matching the existing admin prefix and frontend API calls. The earlier `/api/v1/admin/settings/sections` prefix caused the frontend's 404. A regression test compares the actual frontend load/save/test URLs with the routes mounted in the main application. All 32 settings tests pass. The local API was restarted; health returns 200 and the frontend's settings URL now returns 401 without authentication, confirming the route exists and remains protected. Signed-in rendering was not separately verified.
