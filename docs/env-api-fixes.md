# Environment/API fixes — 2026-10-09

## Applied

- Firecrawl research client now unwraps `SecretStr` before building its Authorization header. Previously the masked representation was sent instead of the real key.
- Tavily, Firecrawl and DataForSEO sections expose independent Enable/Disable controls. Saving a key does not enable its provider. Existing `RESEARCH_PROVIDERS` selection remains the default until a specific toggle is saved. Enabling requires credentials. The per-request/task configuration snapshot controls provider selection without mutating the process-wide registry. Existing research scheduling/cache policy remains unchanged.
- Admin Access warns when password/PIN still equal built-in defaults. Production startup rejects unchanged defaults, including when `APP_ENV=prod` is used. No password/PIN was invented or changed.
- Platform callback settings reject the wrong platform/path and query/fragment values. Production requires public HTTPS callbacks. Development shows a warning for a callback pointing to a deployed server; it does not silently replace that URL.
- Production startup checks configured Meta, Google Business and LinkedIn callbacks. Local development mode was retained.

## Verification

- **241 backend tests passed**, including **43 settings tests** covering real Firecrawl header serialization, enable/disable selection, snapshot stability, preserving existing selection, required credentials, callback validation, default-credential warnings and valid/invalid production configuration.
- **15 frontend contract tests passed**; TypeScript passed.
- Isolated Next compilation/build passed and generated **54 pages**. As in previous verification, standalone packaging was excluded only in the temporary build configuration; production standalone packaging has not been tested.
- Updated component preview renders separate research controls. Preview screenshot uses sample data, not live credentials.
- Local API restarted and health returned **200**. Read-only configuration inspection confirms the original selection: Tavily enabled, Firecrawl/SEO disabled. Two admin-default warnings and one remote LinkedIn callback warning are available to the panel.
- No matching local Celery worker process was running. Start/restart the worker using the updated code before testing background work. Request/task refresh behavior is covered by automated tests.

## Still requires configuration/live verification

Enter your own admin password/PIN through Admin Access. Select the correct LinkedIn callback host for local or deployed testing and register the identical callback in LinkedIn's developer console. No domain was guessed and no provider-console setting was changed. API keys, the existing encrypted SMTP override, callback values and `.env` were not modified during this work.

Real Firecrawl/DataForSEO calls and live OAuth round trips were not executed; automated tests use fake keys and isolated settings storage. Enable the desired research provider explicitly when ready to use it.
