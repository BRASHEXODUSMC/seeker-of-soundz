-- Seeker Of SoundZ v4.12.1 avatar/profile reliability patch
-- Run once in Supabase SQL Editor after schema.sql and policies.sql.

alter table public.profiles enable row level security;

-- Allow an authenticated member to create only their own profile if the signup
-- trigger did not create it for any reason. Protected role fields use defaults.
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Keep browser writes limited to safe profile columns.
grant insert (id, username, display_name, avatar_url, banner_url, biography, location, favorite_genres, social_links, website_links, last_seen_at, updated_at)
on public.profiles
to authenticated;

grant select on public.profiles to anon, authenticated;

-- Re-apply avatar bucket policies safely.
drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "avatars owner upload" on storage.objects;
drop policy if exists "avatars owner update" on storage.objects;
drop policy if exists "avatars owner delete" on storage.objects;

create policy "avatars public read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "avatars owner upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
