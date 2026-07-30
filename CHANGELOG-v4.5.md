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
