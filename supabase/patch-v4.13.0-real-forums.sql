-- Seeker Of SoundZ v4.13.0 real forums patch
-- Run ONCE after the original schema/policies/storage setup.

alter table public.forum_topics add column if not exists subcategory text not null default '';
alter table public.forum_topics add column if not exists media_url text;
alter table public.forum_topics add column if not exists image_url text;

drop policy if exists "attachments public read" on public.attachments;
drop policy if exists "attachments own create" on public.attachments;
drop policy if exists "attachments own delete" on public.attachments;
create policy "attachments public read" on public.attachments for select using (true);
create policy "attachments own create" on public.attachments for insert to authenticated with check (owner_id = auth.uid() and public.can_participate());
create policy "attachments own delete" on public.attachments for delete using (owner_id = auth.uid() or public.is_staff());

revoke update on public.forum_topics from authenticated;
grant select, insert, delete on public.forum_topics to authenticated;
grant update (image_url, last_activity_at) on public.forum_topics to authenticated;
grant select on public.forum_topics to anon;
grant select, insert, update, delete on public.forum_replies to authenticated;
grant select on public.forum_replies to anon;
grant select, insert, delete on public.forum_reactions to authenticated;
grant select on public.forum_reactions to anon;
grant select, insert, delete on public.attachments to authenticated;
grant select on public.attachments to anon;
grant select on public.forum_categories to anon, authenticated;

insert into public.forum_categories(name,slug,description,icon,sort_order,is_visible) values
('General Discussion','general-discussion','Introductions, community news and general conversation.','💬',10,true),
('EDM Community','edm-community','Genres, releases, artists and festival discussion.','🎵',20,true),
('Music Production','music-production','DAWs, mixing, mastering, sound design and works in progress.','🎛️',30,true),
('DJ Tips','dj-tips','Controllers, software, live sets and mixing techniques.','🎧',40,true),
('Events','events','Upcoming events, livestreams and community meetups.','📅',50,true),
('Help & FAQ','help-faq','Account, website, purchase and technical support.','❓',60,true),
('Feedback','feedback','Track feedback, website suggestions and creative reviews.','✨',70,true),
('Off Topic','off-topic','Gaming, random chat and other creative projects.','🌙',80,true)
on conflict (slug) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order,is_visible=true;

create or replace function public.forum_set_topic_moderation(target_topic uuid, pin_value boolean default null, lock_value boolean default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_staff() then raise exception 'Staff permission required'; end if;
  update public.forum_topics set
    is_pinned=coalesce(pin_value,is_pinned),
    is_locked=coalesce(lock_value,is_locked),
    updated_at=now()
  where id=target_topic;
end; $$;
grant execute on function public.forum_set_topic_moderation(uuid,boolean,boolean) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.forum_topics;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.forum_replies;
exception when duplicate_object then null; end $$;
