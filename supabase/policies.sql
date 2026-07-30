-- Run after schema.sql
alter table public.profiles enable row level security;
alter table public.forum_categories enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_replies enable row level security;
alter table public.forum_reactions enable row level security;
alter table public.attachments enable row level security;
alter table public.gallery_items enable row level security;
alter table public.music_releases enable row level security;
alter table public.announcements enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.notifications enable row level security;

create policy "profiles public read" on public.profiles for select using (not is_banned or id = auth.uid() or public.is_staff());
create policy "profiles own update safe fields" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

create policy "categories public read" on public.forum_categories for select using (is_visible or public.is_staff());
create policy "categories admin manage" on public.forum_categories for all using (public.is_admin()) with check (public.is_admin());

create policy "topics public read" on public.forum_topics for select using (not is_hidden or public.is_staff() or author_id = auth.uid());
create policy "topics authenticated create" on public.forum_topics for insert to authenticated with check (author_id = auth.uid() and public.can_participate());
create policy "topics author update" on public.forum_topics for update using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
create policy "topics author delete" on public.forum_topics for delete using (author_id = auth.uid() or public.is_staff());

create policy "replies public read" on public.forum_replies for select using (not is_hidden or public.is_staff() or author_id = auth.uid());
create policy "replies authenticated create" on public.forum_replies for insert to authenticated with check (author_id = auth.uid() and public.can_participate());
create policy "replies author update" on public.forum_replies for update using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
create policy "replies author delete" on public.forum_replies for delete using (author_id = auth.uid() or public.is_staff());

create policy "reactions public read" on public.forum_reactions for select using (true);
create policy "reactions own create" on public.forum_reactions for insert to authenticated with check (user_id = auth.uid() and public.can_participate());
create policy "reactions own delete" on public.forum_reactions for delete using (user_id = auth.uid() or public.is_staff());

create policy "gallery public read" on public.gallery_items for select using (is_published or owner_id = auth.uid() or public.is_staff());
create policy "gallery own create" on public.gallery_items for insert to authenticated with check (owner_id = auth.uid());
create policy "gallery own update" on public.gallery_items for update using (owner_id = auth.uid() or public.is_staff()) with check (owner_id = auth.uid() or public.is_staff());
create policy "gallery own delete" on public.gallery_items for delete using (owner_id = auth.uid() or public.is_staff());

create policy "music published read" on public.music_releases for select using (is_published or owner_id = auth.uid() or public.is_staff());
create policy "music artist create" on public.music_releases for insert to authenticated with check (owner_id = auth.uid());
create policy "music owner update" on public.music_releases for update using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "music owner delete" on public.music_releases for delete using (owner_id = auth.uid() or public.is_admin());

create policy "announcements audience read" on public.announcements for select using (
  is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
  or public.is_staff()
);
create policy "announcements staff manage" on public.announcements for all using (public.is_staff()) with check (public.is_staff());

create policy "achievements public read" on public.achievements for select using (is_active or public.is_admin());
create policy "achievements admin manage" on public.achievements for all using (public.is_admin()) with check (public.is_admin());
create policy "earned achievements public read" on public.user_achievements for select using (true);
create policy "earned achievements staff grant" on public.user_achievements for insert with check (public.is_staff());
create policy "earned achievements admin revoke" on public.user_achievements for delete using (public.is_admin());

create policy "notifications own read" on public.notifications for select using (user_id = auth.uid());
create policy "notifications own update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications system create" on public.notifications for insert with check (public.is_staff() or actor_id = auth.uid());


-- Prevent members from changing protected account fields through the public browser client.
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, banner_url, biography, location, favorite_genres, social_links, website_links, last_seen_at, updated_at) on public.profiles to authenticated;

-- Staff role and moderation updates should be performed through reviewed SECURITY DEFINER RPC functions
-- added during the Admin integration phase, rather than direct browser table updates.
