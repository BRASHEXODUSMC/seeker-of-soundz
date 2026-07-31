-- Seeker Of SoundZ v4.13.25 notification and online-presence patch
alter table public.profiles add column if not exists activity_status text not null default 'Exploring the frequency';
grant update (activity_status,last_seen_at,updated_at) on public.profiles to authenticated;
grant insert (activity_status) on public.profiles to authenticated;

create or replace function public.notification_get_feed(feed_limit integer default 60)
returns table(id uuid,user_id uuid,actor_id uuid,type public.notification_type,title text,body text,link_url text,read_at timestamptz,created_at timestamptz,actor_name text,actor_username text,actor_avatar text)
language sql stable security definer set search_path=public as $$
select n.id,n.user_id,n.actor_id,n.type,n.title,n.body,n.link_url,n.read_at,n.created_at,coalesce(p.display_name,p.username,'A member'),p.username,p.avatar_url
from public.notifications n left join public.profiles p on p.id=n.actor_id
where n.user_id=auth.uid() order by n.created_at desc limit greatest(1,least(coalesce(feed_limit,60),100));
$$;
create or replace function public.notification_get_one(notification_id_input uuid)
returns table(id uuid,user_id uuid,actor_id uuid,type public.notification_type,title text,body text,link_url text,read_at timestamptz,created_at timestamptz,actor_name text,actor_username text,actor_avatar text)
language sql stable security definer set search_path=public as $$
select n.id,n.user_id,n.actor_id,n.type,n.title,n.body,n.link_url,n.read_at,n.created_at,coalesce(p.display_name,p.username,'A member'),p.username,p.avatar_url
from public.notifications n left join public.profiles p on p.id=n.actor_id where n.id=notification_id_input and n.user_id=auth.uid();
$$;
create or replace function public.notification_mark_read(notification_id_input uuid) returns void language sql security definer set search_path=public as $$ update public.notifications set read_at=coalesce(read_at,now()) where id=notification_id_input and user_id=auth.uid(); $$;
create or replace function public.notification_mark_all_read() returns void language sql security definer set search_path=public as $$ update public.notifications set read_at=coalesce(read_at,now()) where user_id=auth.uid() and read_at is null; $$;
grant execute on function public.notification_get_feed(integer) to authenticated;
grant execute on function public.notification_get_one(uuid) to authenticated;
grant execute on function public.notification_mark_read(uuid) to authenticated;
grant execute on function public.notification_mark_all_read() to authenticated;

create or replace function public.notify_collaboration_message() returns trigger language plpgsql security definer set search_path=public as $$
declare sender_name text;
begin
 select coalesce(display_name,username,'A collaborator') into sender_name from public.profiles where id=new.sender_id;
 insert into public.notifications(user_id,actor_id,type,title,body,link_url)
 select distinct m.user_id,new.sender_id,'system'::public.notification_type,'New collaboration message',
 sender_name||' sent a message in '||coalesce(p.title,'a collaboration project')||'.','collaboration.html?project='||new.project_id::text
 from public.collaboration_project_members m join public.collaboration_projects p on p.id=new.project_id
 where m.project_id=new.project_id and m.user_id<>new.sender_id;
 return new;
end $$;
drop trigger if exists collaboration_message_notification on public.collaboration_messages;
create trigger collaboration_message_notification after insert on public.collaboration_messages for each row execute function public.notify_collaboration_message();

create or replace function public.create_forum_mention_notifications() returns trigger language plpgsql security definer set search_path=public as $$
declare source_text text; destination text; actor_name text;
begin
 source_text:=coalesce(new.body,'');
 select coalesce(display_name,username,'A member') into actor_name from public.profiles where id=new.author_id;
 if tg_table_name='forum_topics' then source_text:=coalesce(new.title,'')||' '||source_text;destination:='forums.html?topic='||new.id::text;
 else destination:='forums.html?topic='||new.topic_id::text||'&reply='||new.id::text; end if;
 insert into public.notifications(user_id,actor_id,type,title,body,link_url)
 select distinct p.id,new.author_id,'mention'::public.notification_type,'You were mentioned',actor_name||' mentioned you in the forums.',destination
 from regexp_matches(source_text,'@([A-Za-z0-9_]{3,24})','g') as rm(found)
 join public.profiles p on lower(p.username)=lower(rm.found[1])
 where p.id<>new.author_id and not p.is_banned;
 return new;
end $$;
drop trigger if exists forum_topic_mention_notification on public.forum_topics;
create trigger forum_topic_mention_notification after insert on public.forum_topics for each row execute function public.create_forum_mention_notifications();
drop trigger if exists forum_reply_mention_notification on public.forum_replies;
create trigger forum_reply_mention_notification after insert on public.forum_replies for each row execute function public.create_forum_mention_notifications();

create or replace function public.forum_get_feed() returns jsonb language sql stable security definer set search_path=public as $$
with visible_topics as(select t.* from public.forum_topics t where t.is_hidden=false),
visible_replies as(select r.* from public.forum_replies r join visible_topics t on t.id=r.topic_id where r.is_hidden=false),
relevant_profile_ids as(select author_id id from visible_topics union select author_id id from visible_replies)
select jsonb_build_object(
'topics',coalesce((select jsonb_agg(to_jsonb(t) order by t.is_pinned desc,t.last_activity_at desc,t.created_at desc) from visible_topics t),'[]'::jsonb),
'replies',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at) from visible_replies r),'[]'::jsonb),
'reactions',coalesce((select jsonb_agg(to_jsonb(fr)) from public.forum_reactions fr join visible_topics t on t.id=fr.topic_id),'[]'::jsonb),
'profiles',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'username',p.username,'display_name',p.display_name,'avatar_url',p.avatar_url,'role',p.role,'rank_name',p.rank_name,'reputation',p.reputation,'biography',p.biography,'location',p.location,'is_banned',p.is_banned,'created_at',p.created_at,'last_seen_at',p.last_seen_at,'activity_status',p.activity_status)) from public.profiles p join relevant_profile_ids ids on ids.id=p.id),'[]'::jsonb));
$$;
grant execute on function public.forum_get_feed() to anon,authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then execute 'alter publication supabase_realtime add table public.notifications'; end if;
end $$;