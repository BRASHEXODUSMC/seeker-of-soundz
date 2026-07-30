# Seeker Of SoundZ — Supabase Foundation Setup

This version keeps every existing local/demo feature active. Supabase is added in **fallback mode** and remains inactive until public project credentials are entered.

## 1. Create the project

Create a Supabase project and save the project URL and public anon key. Never place the service-role key or database password in this website.

## 2. Install the database

In Supabase SQL Editor, run these files in order:

1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/storage-policies.sql` after creating the buckets below

## 3. Create Storage buckets

Create public buckets named:

- `avatars` — 5 MB image limit
- `banners` — 10 MB image limit
- `gallery` — 15 MB image limit
- `forum-attachments` — 15 MB limit; restrict accepted MIME types in the upload UI
- `music-artwork` — 10 MB image limit

Use paths beginning with the authenticated user's UUID, for example:

`USER_UUID/gallery/filename.webp`

## 4. Configure authentication

In Authentication → URL Configuration:

- Site URL: your final GitHub Pages URL
- Redirect URLs: add the GitHub Pages root and `members.html`

Enable email confirmation. Configure password recovery email templates before production launch.

## 5. Add browser-safe credentials

Open `js/backend-config.js` and set:

```js
supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
supabaseAnonKey: 'YOUR-PUBLIC-ANON-KEY',
```

These two values are designed for browser use. Security must come from Row Level Security policies.

## 6. Current integration state

The following files are now loaded across all main pages:

- Supabase JavaScript CDN
- `js/supabase/supabase-client.js`
- `js/supabase/supabase-services.js`

No existing localStorage system has been replaced yet. This prevents damage to the working website. The next phase is authentication and profile integration, followed by forums.

## Security notes

- Never trust a role supplied by browser JavaScript.
- Only administrators should change protected role, ban, reputation, and moderation fields.
- Validate file type and size in both the browser and Storage configuration.
- Sanitize forum content before rendering it as HTML.
- Test every RLS policy while logged out, as a regular member, and as staff.
