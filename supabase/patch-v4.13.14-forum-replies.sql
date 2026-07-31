-- Seeker Of SoundZ v4.13.14 forum reply creation patch
-- Run once after the earlier forum patches.

alter table public.forum_replies enable row level security;

drop policy if exists "replies authenticated create" on public.forum_replies;
create policy "replies authenticated create" on public.forum_replies
for insert to authenticated
with check (
  author_id = auth.uid()
  and public.can_participate(auth.uid())
  and exists (
    select 1
    from public.forum_topics t
    where t.id = topic_id
      and not t.is_hidden
      and (not t.is_locked or public.is_staff(auth.uid()))
  )
);

grant select, insert, update, delete on public.forum_replies to authenticated;
grant select on public.forum_replies to anon;

create or replace function public.forum_create_reply(
  target_topic uuid,
  reply_body text,
  parent_reply uuid default null,
  quoted_reply uuid default null
) returns public.forum_replies
language plpgsql
security definer
set search_path = public
as $$
declare
  new_reply public.forum_replies;
  target_locked boolean;
  target_hidden boolean;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to reply.';
  end if;
  if not public.can_participate(auth.uid()) then
    raise exception 'Your account cannot participate right now.';
  end if;
  if nullif(trim(reply_body), '') is null then
    raise exception 'Reply text is required.';
  end if;

  select is_locked, is_hidden
    into target_locked, target_hidden
  from public.forum_topics
  where id = target_topic;

  if not found or target_hidden then
    raise exception 'This discussion is not available.';
  end if;
  if target_locked and not public.is_staff(auth.uid()) then
    raise exception 'This discussion is locked.';
  end if;
  if parent_reply is not null and not exists (
    select 1 from public.forum_replies
    where id = parent_reply and topic_id = target_topic and not is_hidden
  ) then
    raise exception 'The parent reply is not available.';
  end if;
  if quoted_reply is not null and not exists (
    select 1 from public.forum_replies
    where id = quoted_reply and topic_id = target_topic and not is_hidden
  ) then
    raise exception 'The quoted reply is not available.';
  end if;

  insert into public.forum_replies(topic_id, author_id, parent_reply_id, quoted_reply_id, body)
  values(target_topic, auth.uid(), parent_reply, quoted_reply, left(trim(reply_body), 30000))
  returning * into new_reply;

  update public.forum_topics
  set last_activity_at = now(), updated_at = now()
  where id = target_topic;

  return new_reply;
end;
$$;

grant execute on function public.forum_create_reply(uuid,text,uuid,uuid) to authenticated;
