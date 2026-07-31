# v4.13.23 — Collaboration Feature & Original Loader Restore

- Restored the original cinematic Seeker Of SoundZ loader from the backup build.
- Restored project progression slider, milestones, progress bar, and stage syncing in Collaboration Studio.
- Kept Supabase projects, collaborators, private messages, notes, files, permissions, and admin synchronization.
- Preserved all newer authentication, forums, profiles, mobile, and admin work.

# v4.13.12 — Forum Experience & Frequency Reactor Loader

- Redesigned forum category cards.
- Moved the full emoji opener to the right edge of editor toolbars.
- Added reactions to replies.
- Added secure Supabase reaction toggling for topics and replies.
- Added reliable author/staff topic and reply deletion RPCs.
- Rebuilt the one-time EDM loading screen as the Frequency Reactor.

## v4.13.9 — Forum synchronization RPC fix
- Removed local category ID synchronization failures.
- Added server-resolved topic creation and one-request forum preset loading.

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

## v4.13.6 — Forum Emoji Picker Stability
- Replaced the stacked emoji-picker behavior with one guarded controller.
- Prevented duplicate listeners, observer stacking, and scroll-position recalculation lag.
- Restored reliable quick emoji insertion, category browsing, search, close controls, and mobile behavior.


## v4.13.7
- Supabase-driven forum categories, subcategories, and tag presets.
- Fixed category validation mismatch.
- Restored/upgraded cinematic EDM loader, once per session.

## v4.13.10 — Forum Submit Form Reference Fix
- Fixed `e.currentTarget is null` after asynchronous Supabase topic creation.
- The submit handler now stores the form element before awaiting database and Storage operations.
- Preserves category, subcategory, tags, emoji, attachment, and synchronization behavior.


## v4.13.11 — Forum Feed Visibility Fix
- Added a single Supabase forum feed RPC for topics, replies, reactions, and public author data.
- Newly published topics render immediately and are then reconciled with the database feed.
- The success message now verifies the new discussion can actually be retrieved.

## v4.13.13 — Forum Emoji Side Dock & Reply Reactions
- Moved the full emoji library to a non-blocking right-side dock.
- Restored multi-reaction choices on forum replies.
- Added Supabase-backed counts and active member reaction states.
- Preserved the existing forum feed, categories, subcategories, tags, loader, transitions, and authentication.

## v4.13.14 — Reply Composer Emoji + RLS Fix
- Added the full quick emoji toolbar and side-dock opener to inline reply composers.
- Added secure `forum_create_reply` RPC and corrected reply insert permissions.
- Prevented replies to hidden or locked topics except for staff.


## v4.13.17 — Supabase Admin Member Directory
- Connected Admin Hub member management to real Supabase Auth and profiles.
- Added last sign-in, website presence, account verification, forum activity, roles, ranks, reputation, and ban controls.
- Added secure Owner/Administrator RPC functions and protected role management.


## v4.13.18
- Expanded Admin member ranks and activity details.
- Fixed password recovery sessions and added reset access in Profile Settings.
- Enhanced forum hover profiles and added clickable public member profiles.


## v4.13.22 — Collaboration Member Synchronization
- Confirmed Admin Hub member changes save directly to Supabase.
- Added secure eligible-collaborator directory RPC.
- Collaboration project creator now refreshes approved members before opening.
- Added focus, visibility, and realtime refresh for collaboration access changes.
