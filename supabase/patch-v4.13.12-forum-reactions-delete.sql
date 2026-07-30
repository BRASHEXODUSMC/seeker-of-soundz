-- Seeker Of SoundZ v4.13.12 forum reactions + reliable deletion patch
-- Run once after v4.13.11.

alter table public.forum_reactions enable row level security;

drop policy if exists "reactions own create" on public.forum_reactions;
drop policy if exists "reactions own delete" on public.forum_reactions;
create policy "reactions own create" on public.forum_reactions
for insert to authenticated
with check (user_id = auth.uid() and public.can_participate(auth.uid()));
create policy "reactions own delete" on public.forum_reactions
for delete to authenticated
using (user_id = auth.uid() or public.is_staff(auth.uid()));

grant select, insert, delete on public.forum_reactions to authenticated;
grant select on public.forum_reactions to anon;

create or replace function public.forum_toggle_reaction(
  target_topic uuid default null,
  target_reply uuid default null,
  reaction_value text default 'heart'
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in to react.'; end if;
  if not public.can_participate(auth.uid()) then raise exception 'Your account cannot participate right now.'; end if;
  if ((target_topic is not null)::int + (target_reply is not null)::int) <> 1 then
    raise exception 'Choose either a topic or reply reaction target.';
  end if;
  select id into existing_id from public.forum_reactions
  where user_id=auth.uid()
    and topic_id is not distinct from target_topic
    and reply_id is not distinct from target_reply
    and reaction=reaction_value
  limit 1;
  if existing_id is not null then
    delete from public.forum_reactions where id=existing_id;
    return false;
  end if;
  insert into public.forum_reactions(user_id,topic_id,reply_id,reaction)
  values(auth.uid(),target_topic,target_reply,left(coalesce(nullif(trim(reaction_value),''),'heart'),32));
  return true;
end; $$;

grant execute on function public.forum_toggle_reaction(uuid,uuid,text) to authenticated;

create or replace function public.forum_delete_topic(target_topic uuid)
returns void language plpgsql security definer set search_path=public as $$
declare owner_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  select author_id into owner_id from public.forum_topics where id=target_topic;
  if owner_id is null then raise exception 'Discussion not found.'; end if;
  if owner_id <> auth.uid() and not public.is_staff(auth.uid()) then raise exception 'You cannot delete this discussion.'; end if;
  delete from public.forum_topics where id=target_topic;
end; $$;
grant execute on function public.forum_delete_topic(uuid) to authenticated;

create or replace function public.forum_delete_reply(target_reply uuid)
returns void language plpgsql security definer set search_path=public as $$
declare owner_id uuid;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  select author_id into owner_id from public.forum_replies where id=target_reply;
  if owner_id is null then raise exception 'Reply not found.'; end if;
  if owner_id <> auth.uid() and not public.is_staff(auth.uid()) then raise exception 'You cannot delete this reply.'; end if;
  delete from public.forum_replies where id=target_reply;
end; $$;
grant execute on function public.forum_delete_reply(uuid) to authenticated;
