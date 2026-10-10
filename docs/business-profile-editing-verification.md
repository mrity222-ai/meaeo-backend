# Business profile editing — verification

Implemented on 2026-10-10. Website scraping/autofill was excluded by the user.

## User flow

Open My Profile → Settings (`/profile?tab=settings`). The selected business is loaded from the backend. Edit business details, mandatory mobile number, logo, brand colors/tone, audience and existing posting preferences. Save performs a single database transaction for profile records. Catalogue and connected accounts retain their own management pages.

The business logo is shown as the account/profile avatar. New logos are uploaded through the existing business-scoped asset endpoint. Saving updates the brand reference and reloads avatars; previously generated images and existing assets are preserved. Login email is displayed separately from business contact email.

## Schema and deployment

New Alembic revision: `27a1c72e9d10`, following `f16ff42ae755`. It adds nullable `business_profiles.pincode`, `brand_profiles.accent_color`, and JSON `target_audiences.age_groups`; existing records remain readable. A brand mobile number is required for new brand creation and the profile settings save flow. Legacy missing numbers may be read and completed in Settings. Logo-only brand PATCH-style PUT updates do not require resending phone.

Apply the migration to the deployment database before starting the updated backend; deploy frontend and backend together. For an already versioned database on the previous head, use `python -m alembic upgrade head`.

The local SQLite database was previously unversioned. Only this additive migration was applied locally using Alembic Operations, after a SQLite backup; unrelated historical migrations were not falsely stamped as complete. The backup ends in `.before-business-profile-edit.bak` and is ignored by Git. For an unversioned deployment database, establish its real migration baseline before running historical migrations; do not blindly stamp a head.

## Validation

- 52 backend tests: settings save/reload, replacement logo, business/tenant asset isolation, audience isolation, transactional rollback, required mobile, legacy missing-mobile reads, invalid timezone/time/custom schedule, additive migration repeated safely; existing campaign context and asset mapping checks.
- 49 existing daily-posting and campaign-image-readiness tests.
- 3 frontend contract checks: phone normalization, pinned tenant/business save, no current-profile update after a business switch during a request.
- TypeScript and production build passed, 56 routes.
- Local browser: authenticated isolated test business, edited city/PIN/accent/locations/age groups, saved and reloaded; logo replaced through the file chooser and account avatar changed; invalid mobile rejected; mobile viewport had no horizontal overflow and one shared form across breakpoints.
- Isolated local test account and uploaded test assets removed after verification. No customer business records were edited for the browser test. No emails, external posts or paid generation were triggered.

Screenshots: `business-settings-updated.png` (desktop proof captured before cleanup).
