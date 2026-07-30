# v4.5 Production Ready Foundation

- Redesigned member dashboard with cleaner hero, status chips, statistics, equal cards and recent activity.
- Added forum Newest, Oldest and Recently Updated sorting.
- Added Collaboration project sorting by updated date, created date and title.
- Added one consistent aesthetic confirmation modal for destructive Admin Hub and collaboration actions.
- Added shared-hosting/VPS deployment documentation.
- Added secure purchase, VIP and song-entitlement architecture documentation.
- Added a Stripe webhook backend starter while preserving manual paid-member controls as a fallback.

Important: the payment code is a secure integration starter, not a preconfigured live merchant account. Connect it to your database and provider credentials before accepting real payments.

## v4.6 Member Command Center
- Complete members dashboard overhaul with access badges, quick actions, activity, achievements and current projects.
- Replaced cramped administrator-only access boxes with clean dashboard modules.

## v4.12.1 - Supabase Avatar Profile Fix
- Fixed avatars uploading to Storage without appearing in the active member profile.
- Added safe profile upsert behavior when a signup profile row is missing.
- Added immediate avatar/session refresh and cache-busting.
- Added compatibility synchronization for older member/forum profile components.
- Added a one-time Supabase SQL patch for profile inserts and avatar Storage policies.

## v4.13.2 — Member Transition Choice & Smooth Default Fix
- Connected the saved member transition selection to actual internal page navigation.
- Prevented the legacy cube handler from overriding member choices.
- Added distinct Stellar, Fade, Aperture, Warp, Scan, Cubes, and Minimal transitions.
- Removed vertical page movement from the normal transition to eliminate jumping.

## v4.13.4 — Original Forum Presets, Live Preview, Transition and Loader Repair
- Restored the v4.10.22 forum category, subcategory, suggested-tag, keyword-tag, custom-tag and draft composer behavior.
- Connected the restored composer to the existing real Supabase forum tables, reactions, replies and Storage uploads.
- Made Experience Studio controls apply instantly as an unsaved page preview; Save persists and Undo restores.
- Replaced overlapping page-transition controllers with one isolated overlay that never transforms page content.
- Restored the stable v4.10.22 loader implementation while preserving later authentication, mobile, profile and Supabase work.
