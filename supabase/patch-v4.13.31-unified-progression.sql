-- Seeker Of SoundZ v4.13.31
-- Unified XP, levels, quests, challenges, events, seasons, hidden achievements,
-- profile titles, rarity, rankings, and achievement notifications.
-- Run ONCE after patch-v4.13.30-achievements-username.sql.

alter table public.achievements
  add column if not exists category text not null default 'community',
  add column if not exists rarity text not null default 'common',
  add column if not exists is_hidden boolean not null default false,
  add column if not exists title_reward text,
  add column if not exists season_code text;

alter table public.achievements drop constraint if exists achievements_rarity_check;
alter table public.achievements add constraint achievements_rarity_check
check (rarity in ('common','uncommon','rare','epic','legendary','mythic'));

create table if not exists public.member_progression (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  selected_title text,
  lifetime_xp integer not null default 0,
  daily_streak integer not null default 0,
  last_daily_claim date,
  updated_at timestamptz not null default now()
);

create table if not exists public.member_titles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_code text,
  unlocked_at timestamptz not null default now(),
  primary key(user_id,title)
);

create table if not exists public.progression_seasons (
  code text primary key,
  name text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  accent text not null default 'purple'
);

create table if not exists public.progression_quests (
  code text primary key,
  name text not null,
  description text not null,
  quest_type text not null check(quest_type in ('daily','weekly','community','seasonal')),
  metric text not null,
  target integer not null check(target>0),
  xp_reward integer not null default 25,
  title_reward text,
  achievement_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true
);

create table if not exists public.member_quest_claims (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_code text not null references public.progression_quests(code) on delete cascade,
  period_key text not null,
  progress integer not null default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  primary key(user_id,quest_code,period_key)
);

create table if not exists public.community_events (
  code text primary key,
  name text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  community_target integer not null default 1,
  metric text not null default 'forum_activity',
  xp_reward integer not null default 100,
  achievement_code text,
  is_active boolean not null default true
);

create index if not exists member_progression_xp_idx on public.member_progression(lifetime_xp desc);
create index if not exists member_quest_claims_user_idx on public.member_quest_claims(user_id,claimed_at);
create index if not exists user_achievements_earned_idx on public.user_achievements(user_id,earned_at desc);

alter table public.member_progression enable row level security;
alter table public.member_titles enable row level security;
alter table public.progression_seasons enable row level security;
alter table public.progression_quests enable row level security;
alter table public.member_quest_claims enable row level security;
alter table public.community_events enable row level security;

drop policy if exists progression_read_own on public.member_progression;
create policy progression_read_own on public.member_progression for select to authenticated using(user_id=auth.uid());
drop policy if exists progression_titles_read on public.member_titles;
create policy progression_titles_read on public.member_titles for select to authenticated using(user_id=auth.uid());
drop policy if exists progression_seasons_public on public.progression_seasons;
create policy progression_seasons_public on public.progression_seasons for select to anon,authenticated using(true);
drop policy if exists progression_quests_public on public.progression_quests;
create policy progression_quests_public on public.progression_quests for select to authenticated using(is_active);
drop policy if exists progression_claims_read on public.member_quest_claims;
create policy progression_claims_read on public.member_quest_claims for select to authenticated using(user_id=auth.uid());
drop policy if exists progression_events_public on public.community_events;
create policy progression_events_public on public.community_events for select to anon,authenticated using(true);

insert into public.progression_seasons(code,name,description,starts_at,ends_at,is_active,accent)
values(
 'frequency_genesis_2026','Frequency Genesis','The opening season of the Seeker Of SoundZ community progression system.',
 date_trunc('year',now()),date_trunc('year',now())+interval '1 year',true,'violet'
)
on conflict(code) do update set name=excluded.name,description=excluded.description,is_active=true;

insert into public.achievements(code,name,description,points,category,rarity,is_hidden,title_reward,season_code,is_active)
values
 ('night_owl','Night Owl','Participate in the forums between midnight and 4 AM.',40,'hidden','rare',true,'Midnight Signal',null,true),
 ('frequency_master','Frequency Master','Reach level 25 in the community progression system.',250,'progression','mythic',true,'Frequency Master',null,true),
 ('daily_signal_7','Seven-Day Signal','Complete a daily quest seven days in a row.',100,'quests','epic',false,'Consistent Frequency',null,true),
 ('weekly_champion','Weekly Champion','Complete five weekly challenges.',160,'quests','legendary',false,'Weekly Champion',null,true),
 ('event_participant','Community Event Participant','Contribute to a completed community event.',75,'events','rare',false,'Event Contributor',null,true),
 ('season_genesis','Genesis Frequency','Participate during the Frequency Genesis season.',125,'seasonal','epic',false,'Genesis Seeker','frequency_genesis_2026',true),
 ('level_5','Rising Seeker','Reach community level 5.',60,'progression','uncommon',false,'Rising Seeker',null,true),
 ('level_10','Frequency Adept','Reach community level 10.',120,'progression','rare',false,'Frequency Adept',null,true),
 ('level_20','SoundZ Vanguard','Reach community level 20.',220,'progression','legendary',false,'SoundZ Vanguard',null,true)
on conflict(code) do update set
 name=excluded.name,description=excluded.description,points=excluded.points,
 category=excluded.category,rarity=excluded.rarity,is_hidden=excluded.is_hidden,
 title_reward=excluded.title_reward,season_code=excluded.season_code,is_active=true;

update public.achievements set category='forums',rarity='common' where code in ('first_topic','first_reply','first_reaction');
update public.achievements set category='forums',rarity='uncommon' where code in ('five_topics','ten_replies','ten_reactions');
update public.achievements set category='collaboration',rarity='rare' where code in ('first_collab','three_collabs');
update public.achievements set category='profile',rarity='uncommon' where code='profile_complete';
update public.achievements set category='reputation',rarity='rare' where code in ('reputation_10','reputation_50');
update public.achievements set category='staff',rarity='legendary',title_reward='Community Guardian' where code='staff_frequency';
update public.achievements set title_reward='Signal Starter' where code='first_topic';
update public.achievements set title_reward='Studio Connected' where code='first_collab';

insert into public.progression_quests(code,name,description,quest_type,metric,target,xp_reward,title_reward,achievement_code,is_active)
values
 ('daily_reply','Daily Response','Post one forum reply today.','daily','forum_replies',1,30,null,null,true),
 ('daily_react','Positive Energy','React to three forum posts or replies today.','daily','forum_reactions',3,25,null,null,true),
 ('daily_visit','Tune In','Visit your member profile and synchronize progression.','daily','profile_visits',1,15,null,null,true),
 ('weekly_topics','Start the Conversation','Publish two forum discussions this week.','weekly','forum_topics',2,90,null,null,true),
 ('weekly_replies','Community Voice','Post ten replies this week.','weekly','forum_replies',10,120,null,null,true),
 ('weekly_collab','Studio Momentum','Send five collaboration messages this week.','weekly','collaboration_messages',5,130,null,null,true),
 ('season_genesis_activity','Genesis Participation','Complete 25 forum actions during Frequency Genesis.','seasonal','forum_activity',25,250,'Genesis Seeker','season_genesis',true)
on conflict(code) do update set
 name=excluded.name,description=excluded.description,quest_type=excluded.quest_type,
 metric=excluded.metric,target=excluded.target,xp_reward=excluded.xp_reward,
 title_reward=excluded.title_reward,achievement_code=excluded.achievement_code,is_active=true;

insert into public.community_events(code,name,description,starts_at,ends_at,community_target,metric,xp_reward,achievement_code,is_active)
values(
 'community_first_100','The First 100 Signals','Work together to create 100 forum topics and replies.',
 now()-interval '1 day',now()+interval '90 days',100,'forum_activity',150,'event_participant',true
)
on conflict(code) do update set name=excluded.name,description=excluded.description,ends_at=excluded.ends_at,is_active=true;

create or replace function public.progression_level_from_xp(xp_value integer)
returns integer language sql immutable as $$
 select greatest(1,floor(sqrt(greatest(0,xp_value)::numeric/100))+1)::integer;
$$;

create or replace function public.ensure_my_progression()
returns public.member_progression
language plpgsql security definer set search_path=public as $$
declare row_value public.member_progression;
begin
 if auth.uid() is null then raise exception 'You must be signed in.'; end if;
 insert into public.member_progression(user_id) values(auth.uid()) on conflict(user_id) do nothing;
 select * into row_value from public.member_progression where user_id=auth.uid();
 return row_value;
end $$;
grant execute on function public.ensure_my_progression() to authenticated;

create or replace function public.progression_award_xp(target_user uuid,amount integer,reason text default null)
returns void language plpgsql security definer set search_path=public as $$
declare new_xp integer;new_level integer;old_level integer;
begin
 if target_user is null or amount<=0 then return; end if;
 insert into public.member_progression(user_id,xp,lifetime_xp)
 values(target_user,amount,amount)
 on conflict(user_id) do update set
   xp=member_progression.xp+excluded.xp,
   lifetime_xp=member_progression.lifetime_xp+excluded.lifetime_xp,
   updated_at=now();
 select level,lifetime_xp into old_level,new_xp from public.member_progression where user_id=target_user;
 new_level:=public.progression_level_from_xp(new_xp);
 if new_level<>old_level then
   update public.member_progression set level=new_level,updated_at=now() where user_id=target_user;
   insert into public.notifications(user_id,type,title,body,link_url)
   values(target_user,'achievement','Level Up!','You reached Frequency Level '||new_level||'.','members.html#achievements');
 end if;
end $$;

create or replace function public.on_achievement_earned_progression()
returns trigger language plpgsql security definer set search_path=public as $$
declare a public.achievements;
begin
 select * into a from public.achievements where id=new.achievement_id;
 perform public.progression_award_xp(new.user_id,greatest(10,coalesce(a.points,0)),a.code);
 if nullif(a.title_reward,'') is not null then
   insert into public.member_titles(user_id,title,source_code)
   values(new.user_id,a.title_reward,a.code) on conflict do nothing;
 end if;
 insert into public.notifications(user_id,type,title,body,link_url)
 values(new.user_id,'achievement','Achievement Unlocked: '||a.name,
   case when a.is_hidden then 'You discovered a hidden achievement.' else a.description end,
   'members.html#achievements');
 return new;
end $$;
drop trigger if exists achievement_progression_award on public.user_achievements;
create trigger achievement_progression_award after insert on public.user_achievements
for each row execute function public.on_achievement_earned_progression();

create or replace function public.metric_value(metric_name text,start_time timestamptz,end_time timestamptz)
returns integer language plpgsql stable security definer set search_path=public as $$
declare value_count integer:=0;uid uuid:=auth.uid();
begin
 if metric_name='forum_topics' then
   select count(*) into value_count from public.forum_topics where author_id=uid and created_at>=start_time and created_at<end_time and not is_hidden;
 elsif metric_name='forum_replies' then
   select count(*) into value_count from public.forum_replies where author_id=uid and created_at>=start_time and created_at<end_time and not is_hidden;
 elsif metric_name='forum_reactions' then
   select count(*) into value_count from public.forum_reactions where user_id=uid and created_at>=start_time and created_at<end_time;
 elsif metric_name='forum_activity' then
   select
    (select count(*) from public.forum_topics where author_id=uid and created_at>=start_time and created_at<end_time and not is_hidden)+
    (select count(*) from public.forum_replies where author_id=uid and created_at>=start_time and created_at<end_time and not is_hidden)
   into value_count;
 elsif metric_name='collaboration_messages' then
   select count(*) into value_count from public.collaboration_messages where sender_id=uid and created_at>=start_time and created_at<end_time;
 elsif metric_name='profile_visits' then
   value_count:=1;
 end if;
 return coalesce(value_count,0);
end $$;

create or replace function public.sync_my_progression()
returns void language plpgsql security definer set search_path=public as $$
declare p public.member_progression;now_hour integer;ach record;
begin
 if auth.uid() is null then raise exception 'You must be signed in.'; end if;
 perform public.ensure_my_progression();
 perform public.sync_my_achievements();

 select * into p from public.member_progression where user_id=auth.uid();
 if p.level>=5 then
   insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='level_5' on conflict do nothing;
 end if;
 if p.level>=10 then
   insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='level_10' on conflict do nothing;
 end if;
 if p.level>=20 then
   insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='level_20' on conflict do nothing;
 end if;
 if p.level>=25 then
   insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='frequency_master' on conflict do nothing;
 end if;
 now_hour:=extract(hour from localtime);
 if now_hour between 0 and 3 and exists(
   select 1 from public.forum_topics where author_id=auth.uid() and created_at>now()-interval '6 hours'
   union all select 1 from public.forum_replies where author_id=auth.uid() and created_at>now()-interval '6 hours'
 ) then
   insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='night_owl' on conflict do nothing;
 end if;
 insert into public.user_achievements
 select auth.uid(),a.id,now() from public.achievements a
 where a.code='season_genesis'
 and exists(select 1 from public.progression_seasons s where s.code='frequency_genesis_2026' and now() between s.starts_at and s.ends_at and s.is_active)
 on conflict do nothing;
end $$;
grant execute on function public.sync_my_progression() to authenticated;

create or replace function public.quest_period_key(qtype text,at_time timestamptz default now())
returns text language sql stable as $$
 select case qtype
  when 'daily' then to_char(at_time,'YYYY-MM-DD')
  when 'weekly' then to_char(at_time,'IYYY-"W"IW')
  else 'lifetime'
 end;
$$;

create or replace function public.get_my_progression_hub()
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;p public.member_progression;
begin
 perform public.sync_my_progression();
 select * into p from public.member_progression where user_id=auth.uid();

 with quest_rows as(
  select q.*,
   case q.quest_type
    when 'daily' then date_trunc('day',now())
    when 'weekly' then date_trunc('week',now())
    else coalesce(q.starts_at,'2000-01-01'::timestamptz)
   end as period_start,
   case q.quest_type
    when 'daily' then date_trunc('day',now())+interval '1 day'
    when 'weekly' then date_trunc('week',now())+interval '1 week'
    else coalesce(q.ends_at,'2999-01-01'::timestamptz)
   end as period_end
  from public.progression_quests q
  where q.is_active and (q.starts_at is null or now()>=q.starts_at) and (q.ends_at is null or now()<q.ends_at)
 ),
 quest_data as(
  select q.*,
   least(q.target,public.metric_value(q.metric,q.period_start,q.period_end)) as current_progress,
   public.quest_period_key(q.quest_type,now()) as current_period
  from quest_rows q
 )
 select jsonb_build_object(
  'progression',to_jsonb(p),
  'xp_current_level',p.lifetime_xp-((p.level-1)*(p.level-1)*100),
  'xp_next_level',greatest(100,(p.level*p.level*100)-((p.level-1)*(p.level-1)*100)),
  'titles',coalesce((select jsonb_agg(jsonb_build_object('title',t.title,'source_code',t.source_code,'unlocked_at',t.unlocked_at) order by t.unlocked_at desc) from public.member_titles t where t.user_id=auth.uid()),'[]'::jsonb),
  'quests',coalesce((select jsonb_agg(jsonb_build_object(
    'code',q.code,'name',q.name,'description',q.description,'type',q.quest_type,'target',q.target,
    'progress',q.current_progress,'xp_reward',q.xp_reward,'title_reward',q.title_reward,
    'completed',q.current_progress>=q.target,'claimed',claim.claimed_at is not null,'period_key',q.current_period
  ) order by q.quest_type,q.name)
  from quest_data q left join public.member_quest_claims claim
   on claim.user_id=auth.uid() and claim.quest_code=q.code and claim.period_key=q.current_period),'[]'::jsonb),
  'seasons',coalesce((select jsonb_agg(to_jsonb(s)) from public.progression_seasons s where s.is_active and now() between s.starts_at and s.ends_at),'[]'::jsonb),
  'events',coalesce((select jsonb_agg(jsonb_build_object(
    'code',e.code,'name',e.name,'description',e.description,'target',e.community_target,'metric',e.metric,
    'xp_reward',e.xp_reward,'starts_at',e.starts_at,'ends_at',e.ends_at,
    'progress',case when e.metric='forum_activity' then
      (select count(*) from public.forum_topics where created_at between e.starts_at and e.ends_at and not is_hidden)+
      (select count(*) from public.forum_replies where created_at between e.starts_at and e.ends_at and not is_hidden)
      else 0 end
  )) from public.community_events e where e.is_active and now() between e.starts_at and e.ends_at),'[]'::jsonb),
  'rankings',coalesce((select jsonb_agg(row_data) from(
    select jsonb_build_object(
      'position',row_number() over(order by mp.lifetime_xp desc,p.reputation desc,p.created_at),
      'user_id',p.id,'display_name',coalesce(nullif(p.display_name,''),p.username),
      'username',p.username,'avatar_url',p.avatar_url,'level',mp.level,'xp',mp.lifetime_xp,
      'title',mp.selected_title,'rank_name',p.rank_name
    ) row_data
    from public.member_progression mp join public.profiles p on p.id=mp.user_id
    where not p.is_banned
    order by mp.lifetime_xp desc,p.reputation desc,p.created_at limit 25
  ) leaderboard),'[]'::jsonb)
 ) into result;
 return result;
end $$;
grant execute on function public.get_my_progression_hub() to authenticated;

create or replace function public.claim_my_quest(quest_code_input text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare q public.progression_quests;period_start timestamptz;period_end timestamptz;period text;current_value integer;claim public.member_quest_claims;
begin
 select * into q from public.progression_quests where code=quest_code_input and is_active;
 if q.code is null then raise exception 'Quest is not available.'; end if;
 period_start:=case q.quest_type when 'daily' then date_trunc('day',now()) when 'weekly' then date_trunc('week',now()) else coalesce(q.starts_at,'2000-01-01') end;
 period_end:=case q.quest_type when 'daily' then period_start+interval '1 day' when 'weekly' then period_start+interval '1 week' else coalesce(q.ends_at,'2999-01-01') end;
 period:=public.quest_period_key(q.quest_type,now());
 current_value:=public.metric_value(q.metric,period_start,period_end);
 if current_value<q.target then raise exception 'This quest is not complete yet.'; end if;
 insert into public.member_quest_claims(user_id,quest_code,period_key,progress,completed_at,claimed_at)
 values(auth.uid(),q.code,period,current_value,now(),now())
 on conflict(user_id,quest_code,period_key) do update set progress=excluded.progress,completed_at=coalesce(member_quest_claims.completed_at,now()),claimed_at=coalesce(member_quest_claims.claimed_at,now())
 returning * into claim;
 if claim.claimed_at<now()-interval '2 seconds' then
   return jsonb_build_object('already_claimed',true);
 end if;
 perform public.progression_award_xp(auth.uid(),q.xp_reward,'quest:'||q.code);
 if nullif(q.title_reward,'') is not null then
   insert into public.member_titles(user_id,title,source_code) values(auth.uid(),q.title_reward,q.code) on conflict do nothing;
 end if;
 if nullif(q.achievement_code,'') is not null then
   insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code=q.achievement_code on conflict do nothing;
 end if;
 insert into public.notifications(user_id,type,title,body,link_url)
 values(auth.uid(),'achievement','Quest Complete: '||q.name,'You earned '||q.xp_reward||' XP.','members.html#achievements');
 return jsonb_build_object('claimed',true,'xp_reward',q.xp_reward,'quest',q.name);
end $$;
grant execute on function public.claim_my_quest(text) to authenticated;

create or replace function public.select_my_profile_title(title_input text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if title_input is not null and not exists(select 1 from public.member_titles where user_id=auth.uid() and title=title_input) then
  raise exception 'That title is not unlocked.';
 end if;
 insert into public.member_progression(user_id,selected_title) values(auth.uid(),title_input)
 on conflict(user_id) do update set selected_title=excluded.selected_title,updated_at=now();
end $$;
grant execute on function public.select_my_profile_title(text) to authenticated;


-- Return rarity, hidden, title, category, and seasonal metadata to the existing Achievement Hall.
create or replace function public.get_my_achievement_profile()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'You must be signed in.'; end if;
 perform public.sync_my_progression();

 select jsonb_build_object(
  'total',count(*),
  'unlocked',count(*) filter(where ua.user_id is not null),
  'points',coalesce(sum(a.points) filter(where ua.user_id is not null),0),
  'achievements',coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'code',a.code,'name',a.name,'description',a.description,'points',a.points,
    'category',a.category,'rarity',a.rarity,'is_hidden',a.is_hidden,
    'title_reward',a.title_reward,'season_code',a.season_code,
    'unlocked',ua.user_id is not null,'earned_at',ua.earned_at
  ) order by case when ua.user_id is not null then 0 else 1 end,ua.earned_at desc nulls last,a.points,a.name),'[]'::jsonb)
 ) into result
 from public.achievements a
 left join public.user_achievements ua on ua.achievement_id=a.id and ua.user_id=auth.uid()
 where a.is_active;
 return result;
end $$;
grant execute on function public.get_my_achievement_profile() to authenticated;

-- Backfill existing achievement points into progression without duplicating future awards.
create or replace function public.backfill_my_progression_xp()
returns void language plpgsql security definer set search_path=public as $$
declare earned_points integer;
begin
 if auth.uid() is null then return; end if;
 select coalesce(sum(greatest(10,a.points)),0) into earned_points
 from public.user_achievements ua join public.achievements a on a.id=ua.achievement_id
 where ua.user_id=auth.uid();
 insert into public.member_progression(user_id,xp,lifetime_xp,level)
 values(auth.uid(),earned_points,earned_points,public.progression_level_from_xp(earned_points))
 on conflict(user_id) do update set
  xp=greatest(member_progression.xp,earned_points),
  lifetime_xp=greatest(member_progression.lifetime_xp,earned_points),
  level=greatest(member_progression.level,public.progression_level_from_xp(greatest(member_progression.lifetime_xp,earned_points))),
  updated_at=now();
end $$;
grant execute on function public.backfill_my_progression_xp() to authenticated;

-- Extend progression synchronization with streak, weekly, and community-event awards.
create or replace function public.sync_my_progression()
returns void language plpgsql security definer set search_path=public as $$
declare p public.member_progression;now_hour integer;event_row record;event_progress integer;user_contributed boolean;
begin
 if auth.uid() is null then raise exception 'You must be signed in.'; end if;
 perform public.ensure_my_progression();
 perform public.sync_my_achievements();
 perform public.backfill_my_progression_xp();

 select * into p from public.member_progression where user_id=auth.uid();
 if p.level>=5 then insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='level_5' on conflict do nothing; end if;
 if p.level>=10 then insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='level_10' on conflict do nothing; end if;
 if p.level>=20 then insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='level_20' on conflict do nothing; end if;
 if p.level>=25 then insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='frequency_master' on conflict do nothing; end if;

 now_hour:=extract(hour from localtime);
 if now_hour between 0 and 3 and exists(
   select 1 from public.forum_topics where author_id=auth.uid() and created_at>now()-interval '6 hours'
   union all select 1 from public.forum_replies where author_id=auth.uid() and created_at>now()-interval '6 hours'
 ) then
   insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='night_owl' on conflict do nothing;
 end if;

 insert into public.user_achievements
 select auth.uid(),a.id,now() from public.achievements a
 where a.code='season_genesis'
 and exists(select 1 from public.progression_seasons s where s.code='frequency_genesis_2026' and now() between s.starts_at and s.ends_at and s.is_active)
 on conflict do nothing;

 if (select count(*) from public.member_quest_claims where user_id=auth.uid() and claimed_at is not null and quest_code in(select code from public.progression_quests where quest_type='weekly'))>=5 then
  insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='weekly_champion' on conflict do nothing;
 end if;
 if (select daily_streak from public.member_progression where user_id=auth.uid())>=7 then
  insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code='daily_signal_7' on conflict do nothing;
 end if;

 for event_row in select * from public.community_events where is_active and now() between starts_at and ends_at loop
  if event_row.metric='forum_activity' then
   select
    (select count(*) from public.forum_topics where created_at between event_row.starts_at and event_row.ends_at and not is_hidden)+
    (select count(*) from public.forum_replies where created_at between event_row.starts_at and event_row.ends_at and not is_hidden)
   into event_progress;
   select exists(
    select 1 from public.forum_topics where author_id=auth.uid() and created_at between event_row.starts_at and event_row.ends_at and not is_hidden
    union all
    select 1 from public.forum_replies where author_id=auth.uid() and created_at between event_row.starts_at and event_row.ends_at and not is_hidden
   ) into user_contributed;
   if event_progress>=event_row.community_target and user_contributed and event_row.achievement_code is not null then
    insert into public.user_achievements
    select auth.uid(),id,now() from public.achievements where code=event_row.achievement_code
    on conflict do nothing;
   end if;
  end if;
 end loop;
end $$;
grant execute on function public.sync_my_progression() to authenticated;

create or replace function public.claim_my_quest(quest_code_input text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare q public.progression_quests;period_start timestamptz;period_end timestamptz;period text;current_value integer;existing_claim timestamptz;new_streak integer;
begin
 select * into q from public.progression_quests where code=quest_code_input and is_active;
 if q.code is null then raise exception 'Quest is not available.'; end if;
 period_start:=case q.quest_type when 'daily' then date_trunc('day',now()) when 'weekly' then date_trunc('week',now()) else coalesce(q.starts_at,'2000-01-01') end;
 period_end:=case q.quest_type when 'daily' then period_start+interval '1 day' when 'weekly' then period_start+interval '1 week' else coalesce(q.ends_at,'2999-01-01') end;
 period:=public.quest_period_key(q.quest_type,now());
 current_value:=public.metric_value(q.metric,period_start,period_end);
 if current_value<q.target then raise exception 'This quest is not complete yet.'; end if;

 select claimed_at into existing_claim from public.member_quest_claims where user_id=auth.uid() and quest_code=q.code and period_key=period;
 if existing_claim is not null then return jsonb_build_object('already_claimed',true); end if;

 insert into public.member_quest_claims(user_id,quest_code,period_key,progress,completed_at,claimed_at)
 values(auth.uid(),q.code,period,current_value,now(),now())
 on conflict(user_id,quest_code,period_key) do update set progress=excluded.progress,completed_at=now(),claimed_at=now();

 perform public.progression_award_xp(auth.uid(),q.xp_reward,'quest:'||q.code);
 if nullif(q.title_reward,'') is not null then
  insert into public.member_titles(user_id,title,source_code) values(auth.uid(),q.title_reward,q.code) on conflict do nothing;
 end if;
 if nullif(q.achievement_code,'') is not null then
  insert into public.user_achievements select auth.uid(),id,now() from public.achievements where code=q.achievement_code on conflict do nothing;
 end if;

 if q.quest_type='daily' then
  update public.member_progression set
   daily_streak=case
    when last_daily_claim=current_date-1 then daily_streak+1
    when last_daily_claim=current_date then daily_streak
    else 1 end,
   last_daily_claim=current_date,updated_at=now()
  where user_id=auth.uid()
  returning daily_streak into new_streak;
 end if;

 insert into public.notifications(user_id,type,title,body,link_url)
 values(auth.uid(),'achievement','Quest Complete: '||q.name,'You earned '||q.xp_reward||' XP.','members.html#achievements');
 perform public.sync_my_progression();
 return jsonb_build_object('claimed',true,'xp_reward',q.xp_reward,'quest',q.name,'daily_streak',new_streak);
end $$;
grant execute on function public.claim_my_quest(text) to authenticated;
