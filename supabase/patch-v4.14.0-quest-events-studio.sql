-- Seeker Of SoundZ v4.14.0
-- Quest & Progression Studio + Social Events System
-- Run ONCE in the correct Supabase project.

-- ============================================================
-- QUEST ADMINISTRATION
-- ============================================================

alter table public.progression_quests
  add column if not exists icon text not null default '⚡',
  add column if not exists rarity text not null default 'common',
  add column if not exists sort_order integer not null default 0,
  add column if not exists notify_on_publish boolean not null default true,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.progression_quests drop constraint if exists progression_quests_rarity_check;
alter table public.progression_quests add constraint progression_quests_rarity_check
check (rarity in ('common','uncommon','rare','epic','legendary','mythic'));

drop policy if exists progression_quests_admin_insert on public.progression_quests;
create policy progression_quests_admin_insert on public.progression_quests
for insert to authenticated with check (public.is_admin(auth.uid()));

drop policy if exists progression_quests_admin_update on public.progression_quests;
create policy progression_quests_admin_update on public.progression_quests
for update to authenticated using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists progression_quests_admin_delete on public.progression_quests;
create policy progression_quests_admin_delete on public.progression_quests
for delete to authenticated using (public.is_admin(auth.uid()));

grant insert,update,delete on public.progression_quests to authenticated;

create or replace function public.admin_save_quest(
  p_original_code text default null,
  p_code text default null,
  p_name text default null,
  p_description text default '',
  p_quest_type text default 'daily',
  p_metric text default 'forum_replies',
  p_target integer default 1,
  p_xp_reward integer default 25,
  p_title_reward text default null,
  p_achievement_code text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_is_active boolean default true,
  p_icon text default '⚡',
  p_rarity text default 'common',
  p_sort_order integer default 0,
  p_notify_on_publish boolean default true
) returns public.progression_quests
language plpgsql security definer set search_path=public as $$
declare saved public.progression_quests; clean_code text;
begin
 if not public.is_admin(auth.uid()) then raise exception 'Administrator access is required.'; end if;
 clean_code:=lower(regexp_replace(trim(coalesce(p_code,'')),'[^a-zA-Z0-9_]+','_','g'));
 if clean_code='' then raise exception 'Quest code is required.'; end if;
 if p_quest_type not in ('daily','weekly','community','seasonal') then raise exception 'Invalid quest type.'; end if;
 if p_rarity not in ('common','uncommon','rare','epic','legendary','mythic') then raise exception 'Invalid rarity.'; end if;
 if coalesce(p_target,0)<1 then raise exception 'Target must be at least 1.'; end if;
 if p_starts_at is not null and p_ends_at is not null and p_ends_at<=p_starts_at then raise exception 'End date must be after start date.'; end if;

 insert into public.progression_quests(
  code,name,description,quest_type,metric,target,xp_reward,title_reward,achievement_code,
  starts_at,ends_at,is_active,icon,rarity,sort_order,notify_on_publish,created_by,updated_at
 ) values(
  clean_code,trim(p_name),coalesce(p_description,''),p_quest_type,p_metric,p_target,p_xp_reward,
  nullif(trim(coalesce(p_title_reward,'')),''),nullif(trim(coalesce(p_achievement_code,'')),''),
  p_starts_at,p_ends_at,p_is_active,coalesce(nullif(trim(p_icon),''),'⚡'),p_rarity,p_sort_order,
  p_notify_on_publish,auth.uid(),now()
 )
 on conflict(code) do update set
  name=excluded.name,description=excluded.description,quest_type=excluded.quest_type,
  metric=excluded.metric,target=excluded.target,xp_reward=excluded.xp_reward,
  title_reward=excluded.title_reward,achievement_code=excluded.achievement_code,
  starts_at=excluded.starts_at,ends_at=excluded.ends_at,is_active=excluded.is_active,
  icon=excluded.icon,rarity=excluded.rarity,sort_order=excluded.sort_order,
  notify_on_publish=excluded.notify_on_publish,updated_at=now()
 returning * into saved;

 if nullif(trim(coalesce(p_original_code,'')),'') is not null and p_original_code<>clean_code then
   delete from public.progression_quests where code=p_original_code;
 end if;

 if p_notify_on_publish and p_is_active then
   insert into public.notifications(user_id,type,title,body,link_url)
   select id,'system','New quest: '||saved.name,
     saved.description||' • Reward: '||saved.xp_reward||' XP','members.html#achievements'
   from public.profiles where not is_banned
   and not exists(
    select 1 from public.notifications n
    where n.user_id=profiles.id and n.title='New quest: '||saved.name
      and n.created_at>now()-interval '5 minutes'
   );
 end if;
 return saved;
end $$;

grant execute on function public.admin_save_quest(
 text,text,text,text,text,text,integer,integer,text,text,timestamptz,timestamptz,
 boolean,text,text,integer,boolean
) to authenticated;

create or replace function public.admin_delete_quest(p_code text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin(auth.uid()) then raise exception 'Administrator access is required.'; end if;
 delete from public.progression_quests where code=p_code;
end $$;
grant execute on function public.admin_delete_quest(text) to authenticated;

create or replace function public.admin_get_quests()
returns setof public.progression_quests
language sql stable security definer set search_path=public as $$
 select q.* from public.progression_quests q
 where public.is_admin(auth.uid())
 order by q.sort_order,q.quest_type,q.name;
$$;
grant execute on function public.admin_get_quests() to authenticated;

-- ============================================================
-- SOCIAL EVENTS
-- ============================================================

do $$ begin
 create type public.event_visibility as enum ('public','members','private');
exception when duplicate_object then null; end $$;

do $$ begin
 create type public.event_response_status as enum ('going','interested','not_going');
exception when duplicate_object then null; end $$;

create table if not exists public.site_events(
 id uuid primary key default gen_random_uuid(),
 title text not null,
 slug text not null unique,
 event_type text not null default 'Live Show',
 description text not null default '',
 starts_at timestamptz not null,
 ends_at timestamptz,
 timezone text not null default 'America/Chicago',
 venue text not null default '',
 location text not null default '',
 online_url text,
 details_url text,
 ticket_url text,
 cover_image_url text,
 visibility public.event_visibility not null default 'public',
 is_featured boolean not null default false,
 is_published boolean not null default false,
 allow_responses boolean not null default true,
 response_limit integer,
 announcement_sent_at timestamptz,
 reminder_hours integer[] not null default array[24,1],
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (ends_at is null or ends_at>starts_at)
);

create table if not exists public.site_event_media(
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.site_events(id) on delete cascade,
 image_url text not null,
 storage_path text,
 caption text not null default '',
 alt_text text not null default '',
 sort_order integer not null default 0,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now()
);

create table if not exists public.site_event_responses(
 event_id uuid not null references public.site_events(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 status public.event_response_status not null,
 notify_reminders boolean not null default true,
 responded_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(event_id,user_id)
);

create index if not exists site_events_start_idx on public.site_events(starts_at);
create index if not exists site_event_media_event_idx on public.site_event_media(event_id,sort_order);
create index if not exists site_event_responses_event_idx on public.site_event_responses(event_id,status);

alter table public.site_events enable row level security;
alter table public.site_event_media enable row level security;
alter table public.site_event_responses enable row level security;

drop policy if exists site_events_public_read on public.site_events;
create policy site_events_public_read on public.site_events for select to anon,authenticated
using (
 public.is_admin(auth.uid()) or (
  is_published and (
   visibility='public' or
   (visibility='members' and auth.uid() is not null)
  )
 )
);

drop policy if exists site_events_admin_manage on public.site_events;
create policy site_events_admin_manage on public.site_events for all to authenticated
using(public.is_admin(auth.uid())) with check(public.is_admin(auth.uid()));

drop policy if exists site_event_media_public_read on public.site_event_media;
create policy site_event_media_public_read on public.site_event_media for select to anon,authenticated
using(exists(
 select 1 from public.site_events e where e.id=event_id and
 (public.is_admin(auth.uid()) or (e.is_published and (e.visibility='public' or auth.uid() is not null)))
));

drop policy if exists site_event_media_admin_manage on public.site_event_media;
create policy site_event_media_admin_manage on public.site_event_media for all to authenticated
using(public.is_admin(auth.uid())) with check(public.is_admin(auth.uid()));

drop policy if exists site_event_responses_read on public.site_event_responses;
create policy site_event_responses_read on public.site_event_responses for select to authenticated
using(user_id=auth.uid() or public.is_admin(auth.uid()));

drop policy if exists site_event_responses_own_manage on public.site_event_responses;
create policy site_event_responses_own_manage on public.site_event_responses for all to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());

grant select on public.site_events,public.site_event_media to anon,authenticated;
grant insert,update,delete on public.site_events,public.site_event_media to authenticated;
grant select,insert,update,delete on public.site_event_responses to authenticated;

create or replace function public.get_site_events()
returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',e.id,'title',e.title,'slug',e.slug,'event_type',e.event_type,
  'description',e.description,'starts_at',e.starts_at,'ends_at',e.ends_at,
  'timezone',e.timezone,'venue',e.venue,'location',e.location,'online_url',e.online_url,
  'details_url',e.details_url,'ticket_url',e.ticket_url,'cover_image_url',e.cover_image_url,
  'is_featured',e.is_featured,'allow_responses',e.allow_responses,
  'my_response',(select r.status from public.site_event_responses r where r.event_id=e.id and r.user_id=auth.uid()),
  'counts',jsonb_build_object(
    'going',(select count(*) from public.site_event_responses r where r.event_id=e.id and r.status='going'),
    'interested',(select count(*) from public.site_event_responses r where r.event_id=e.id and r.status='interested')
  ),
  'media',coalesce((select jsonb_agg(jsonb_build_object(
    'id',m.id,'image_url',m.image_url,'caption',m.caption,'alt_text',m.alt_text,'sort_order',m.sort_order
  ) order by m.sort_order,m.created_at) from public.site_event_media m where m.event_id=e.id),'[]'::jsonb)
 ) order by e.is_featured desc,e.starts_at)
 from public.site_events e
 where e.is_published and (e.visibility='public' or auth.uid() is not null);
$$;
grant execute on function public.get_site_events() to anon,authenticated;

create or replace function public.respond_to_site_event(p_event_id uuid,p_status text,p_notify boolean default true)
returns jsonb language plpgsql security definer set search_path=public as $$
declare e public.site_events;
begin
 if auth.uid() is null then raise exception 'Sign in to respond to events.'; end if;
 select * into e from public.site_events where id=p_event_id and is_published;
 if e.id is null then raise exception 'Event not found.'; end if;
 if not e.allow_responses then raise exception 'Responses are closed for this event.'; end if;
 if p_status not in ('going','interested','not_going') then raise exception 'Invalid response.'; end if;
 insert into public.site_event_responses(event_id,user_id,status,notify_reminders)
 values(p_event_id,auth.uid(),p_status::public.event_response_status,p_notify)
 on conflict(event_id,user_id) do update set status=excluded.status,
 notify_reminders=excluded.notify_reminders,updated_at=now();
 return jsonb_build_object('status',p_status);
end $$;
grant execute on function public.respond_to_site_event(uuid,text,boolean) to authenticated;

create or replace function public.admin_publish_event_announcement(p_event_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare e public.site_events; inserted integer;
begin
 if not public.is_admin(auth.uid()) then raise exception 'Administrator access is required.'; end if;
 select * into e from public.site_events where id=p_event_id;
 if e.id is null then raise exception 'Event not found.'; end if;
 insert into public.notifications(user_id,type,title,body,link_url)
 select p.id,'announcement','New event: '||e.title,
   'Starts '||to_char(e.starts_at,'Mon DD, YYYY at HH12:MI AM')||
   case when e.location<>'' then ' • '||e.location else '' end,
   'events.html#event-'||e.id
 from public.profiles p where not p.is_banned;
 get diagnostics inserted=row_count;
 update public.site_events set announcement_sent_at=now(),updated_at=now() where id=e.id;
 return inserted;
end $$;
grant execute on function public.admin_publish_event_announcement(uuid) to authenticated;

create or replace function public.admin_event_dashboard()
returns jsonb language sql stable security definer set search_path=public as $$
 select case when public.is_admin(auth.uid()) then jsonb_build_object(
  'events',coalesce((select jsonb_agg(jsonb_build_object(
    'id',e.id,'title',e.title,'slug',e.slug,'event_type',e.event_type,'description',e.description,
    'starts_at',e.starts_at,'ends_at',e.ends_at,'timezone',e.timezone,'venue',e.venue,
    'location',e.location,'online_url',e.online_url,'details_url',e.details_url,'ticket_url',e.ticket_url,
    'cover_image_url',e.cover_image_url,'visibility',e.visibility,'is_featured',e.is_featured,
    'is_published',e.is_published,'allow_responses',e.allow_responses,
    'announcement_sent_at',e.announcement_sent_at,
    'going',(select count(*) from public.site_event_responses r where r.event_id=e.id and r.status='going'),
    'interested',(select count(*) from public.site_event_responses r where r.event_id=e.id and r.status='interested'),
    'media',coalesce((select jsonb_agg(to_jsonb(m) order by m.sort_order,m.created_at) from public.site_event_media m where m.event_id=e.id),'[]'::jsonb)
  ) order by e.starts_at desc) from public.site_events e),'[]'::jsonb)
 ) else null end;
$$;
grant execute on function public.admin_event_dashboard() to authenticated;

-- Realtime
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='site_events')
 then execute 'alter publication supabase_realtime add table public.site_events'; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='site_event_responses')
 then execute 'alter publication supabase_realtime add table public.site_event_responses'; end if;
end $$;


-- Starter quest templates. These are editable in Admin → Quest & Progression Studio.
insert into public.progression_quests(
 code,name,description,quest_type,metric,target,xp_reward,title_reward,achievement_code,
 starts_at,ends_at,is_active,icon,rarity,sort_order,notify_on_publish,created_by,updated_at
) values
 ('daily_tune_in','Tune Into the Frequency','Open your member profile and synchronize progression today.','daily','profile_visits',1,15,null,null,null,null,true,'📡','common',10,false,auth.uid(),now()),
 ('daily_response','Daily Response','Post one forum reply today.','daily','forum_replies',1,30,null,null,null,null,true,'↩','common',20,false,auth.uid(),now()),
 ('daily_positive_energy','Positive Energy','React to three forum posts or replies today.','daily','forum_reactions',3,25,null,null,null,null,true,'💜','uncommon',30,false,auth.uid(),now()),
 ('weekly_voice','Community Voice','Post ten forum replies this week.','weekly','forum_replies',10,120,null,null,null,null,true,'🗣','rare',40,false,auth.uid(),now()),
 ('weekly_broadcaster','Frequency Broadcaster','Create two forum discussions this week.','weekly','forum_topics',2,90,null,null,null,null,true,'📣','rare',50,false,auth.uid(),now()),
 ('weekly_studio','Studio Momentum','Send five messages inside Collaboration Studio this week.','weekly','collaboration_messages',5,130,null,null,null,null,true,'🎚','epic',60,false,auth.uid(),now()),
 ('community_signal','Community Signal Builder','Complete twenty-five forum actions during this community cycle.','community','forum_activity',25,200,'Signal Builder',null,date_trunc('month',now()),date_trunc('month',now())+interval '1 month',true,'⚡','epic',70,false,auth.uid(),now())
on conflict(code) do update set
 name=excluded.name,description=excluded.description,quest_type=excluded.quest_type,
 metric=excluded.metric,target=excluded.target,xp_reward=excluded.xp_reward,
 title_reward=excluded.title_reward,starts_at=excluded.starts_at,ends_at=excluded.ends_at,
 is_active=true,icon=excluded.icon,rarity=excluded.rarity,sort_order=excluded.sort_order,updated_at=now();
