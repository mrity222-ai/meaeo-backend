# Public landing page updates — 9 October 2026

Applied following the user's approval. No production deployment or real publishing was performed.

## Changes

- Responsive hero headline, shorter description and three feature badges. Two primary actions; unavailable app-store badges removed.
- Correct demo target, unique section IDs, native cross-page hash links, sticky-header scroll offset and a real About section. Generic social profile links removed rather than inventing account URLs.
- Pricing uses active backend plans, native billing currency and actual campaign/brand limits. Premium messaging is ₹999/month. Loading, timeout, error and retry replace silently fabricated fallback plans.
- Static examples are clearly labelled. Gallery totals are derived from the 20 available examples; incorrect categories corrected. Keyboard opening, focus trap, Escape, focus restoration and a scrollable mobile modal added.
- Unverified customer quotes replaced with business use cases. Unsupported trial, Stripe, guaranteed rankings, video-generation and timed execution claims removed from marketing copy.
- Contact enquiries persist in `storage_documents` with a receipt reference. Admin Support has a protected Website enquiries section. Newsletter saves consent and deduplicated opt-ins; it does not deliver email campaigns.
- Public forms validate inputs, include a honeypot, consent and a database-backed submission throttle. Submission success means a database record was committed, not an email was sent.
- Deletion lookup uses the configured API origin. Unknown codes return 404; network/API errors show UNVERIFIED. Meta callbacks record PROCESSING and disable matching channels. Full token/media cleanup is not automatically certified; request records must not be marked COMPLETED without verified cleanup.
- Page metadata, canonical URLs, Open Graph/Twitter previews, sitemap and robots added. Set frontend `SITE_URL` to the actual public production origin before building; default is localhost for development.
- Hero entrance, section reveals, sample crossfade, FAQ transitions and card hover effects added. Platform marquee can pause; duplicate logos are hidden from screen readers. Reduced-motion preferences preserve visible content. Public styles are scoped to `.marketing-site`.

## Verification

- Full backend suite: **250 passed** (before adding two additional regression tests).
- Final public-marketing/deletion regression suite: **11 passed** (includes those two additional tests).
- Frontend production build: **56 routes generated**, successful.
- Final TypeScript check: passed.
- Local API health 200; unauthenticated enquiries endpoint 401; unknown deletion code 404.
- Browser: desktop 1280px, mobile 390px/320px headline wrapping; no duplicate homepage IDs or broken homepage anchors. Mobile menu, gallery keyboard/Escape/focus restoration, category preview, FAQ and deletion error verified.
- Features, Contact, Privacy, Terms and Refund pages: one H1, canonical and Open Graph metadata verified on mobile.
- Screenshots: `landing-updated-desktop.png`, `landing-updated-mobile.png`.

## Remaining operational checks

- Set the production `SITE_URL` and rebuild/redeploy frontend and updated backend together.
- Real store/profile URLs and verified customer proof can be added when available.
- Automatic newsletter delivery and complete deletion cleanup remain separate workflows, not functionality implied by these landing-page fixes.
- Admin enquiry rendering was type-checked; authenticated live admin browsing was not performed. The backend protected route and saved-record retrieval have regression coverage.

The isolated build output uses `NEXT_BUILD_DIR=.next-marketing-verify` and is ignored by Git; the normal development output remains `.next`.
