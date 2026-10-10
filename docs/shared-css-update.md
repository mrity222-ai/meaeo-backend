# Shared CSS update — 2026-10-09

Approved scope: replace conflicting presentation styles with a shared app design. No backend, API, AI-agent or payment/publishing handler changes were made in this task.

## Changes

- Replaced old gradient/3D/navigation override rules with shared `ui-card`, `ui-button-primary`, `ui-button-secondary`, `ui-nav-active`, `ui-badge-neutral` and `ui-metric` styles.
- Kept Tailwind, responsive layout, animations used by marketing content and reduced-motion support. Removed decorative `!important` overrides; accessibility reduced-motion overrides remain intentional.
- Moved base/reset declarations into the CSS base layer so they do not override Tailwind utility text colours/font sizes.
- Unified app/admin neutral text and border classes and primary/secondary action styling. Platform logo assets and semantic warning/error/success colours are retained.
- Shared light/dark variables are aligned with explicit `.dark` variants. Previously OS-driven `dark:text-white` could apply while cards still used light variables. KPI text now also uses the theme foreground directly.
- Missing-metric badges no longer unconditionally say “Available data”. Data calculations and API values are unchanged.

## Verification and limits

- Shared CSS compiles through the project's Tailwind/PostCSS pipeline.
- A standalone preview uses the same compiled CSS, without authentication or real business data. Example metric text and primary button colours were checked in the browser in both light and dark modes. Mobile preview was checked at 390px for horizontal overflow.
- Existing frontend contract suite: 15 passed.
- TypeScript check: passed.
- The first in-place build failed with missing page output while a local dev server was also running. The isolated production compilation/build passed, generating all 54 pages without changing or stopping that server. Standalone packaging was excluded from this temporary verification configuration because its node_modules junction requires Windows symlink privileges; the actual project configuration is unchanged. Standalone packaging remains unverified.
- Full signed-in page-by-page visual verification remains pending an authenticated test session. Preview checks do not replace that verification.

Preview artifacts are under `docs/shared-style-preview*.html`, CSS and PNG; they are not product routes and contain no connected account data.
