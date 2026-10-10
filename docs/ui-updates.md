# UI improvements — 2026-10-09

Scope: frontend presentation and accessibility only. No backend/API, publishing, payment verification or AI agent changes were made in this UI task.

- User sidebar and content offsets now share the 768px breakpoint and 230px sidebar width.
- Dashboard, analytics, calendar, content review, Google Business, catalogue, connections and campaign screens have mobile bottom-navigation clearance, including safe-area padding.
- A shared responsive header is used for the dashboard, analytics, calendar, content review, catalogue, connections, Google Business and campaign screens. Existing action handlers were preserved. Google context fields are placed in a wrapping section below the header, making them usable on mobile too.
- Sidebar and mobile navigation retain active state on nested routes and expose the current page to assistive technologies. The nonfunctional workspace dropdown appearance was replaced with an informational label.
- Card backgrounds and page background use theme variables. Card/button shadows and hover movement were reduced. Keyboard focus is visible and reduced-motion preferences are respected.
- Onboarding has a mobile step label, named step controls, named inputs and keyboard-operable tone, logo and plan selection. Logo selection is distinguished from successful color extraction; unsuccessful extraction is no longer labeled successful. Existing extraction calculation and submission/payment APIs remain unchanged.
- Catalogue copy distinguishes product photos from the business logo. Checkout copy describes verified activation.
- Admin header search/notification controls without handlers were removed. The static worker-health claim was replaced with a link to the existing health page.

## Verification

- Frontend TypeScript check: passed.
- Existing frontend contract tests: 15 passed.
- Final production build: passed; all 54 pages generated.
- Browser preview reached the protected-page login redirect. Full visual verification of signed-in dashboard/admin/onboarding screens was not possible without an authenticated test session. Authentication was not bypassed or changed.
- This task did not deploy or restart production services. The temporary localhost dev server used for the preview was stopped.
