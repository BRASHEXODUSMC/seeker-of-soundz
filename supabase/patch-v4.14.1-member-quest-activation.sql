-- Seeker Of SoundZ v4.14.1
-- Member Quest Activation + Active Quest Feed
--
-- Run ONCE in:
-- https://ywwlwkveymypvbvlzccv.supabase.co

create table if not exists public.member_quest_enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_code text not null references public.progression_quests(code) on delete cascade,
  period_key text not null,
  started_at timestamptz not null default now(),
  primary key (user_id, quest_code, period_key)
);

alter table public.member_quest_enrollments enable row level security;

drop policy if exists member_quest_enrollments_own_read
on public.member_quest_enrollments;
create policy member_quest_enrollments_own_read
on public.member_quest_enrollments
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists member_quest_enrollments_own_insert
on public.member_quest_enrollments;
create policy member_quest_enrollments_own_insert
on public.member_quest_enrollments
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists member_quest_enrollments_own_delete
on public.member_quest_enrollments;
create policy member_quest_enrollments_own_delete
on public.member_quest_enrollments
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, delete
on public.member_quest_enrollments
to authenticated;

create or replace function public.start_my_quest(
  quest_code_input text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  quest_row public.progression_quests;
  current_period text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to start a quest.';
  end if;

  select *
  into quest_row
  from public.progression_quests
  where code = quest_code_input
    and is_active
    and (starts_at is null or now() >= starts_at)
    and (ends_at is null or now() < ends_at);

  if quest_row.code is null then
    raise exception 'This quest is not currently available.';
  end if;

  current_period := public.quest_period_key(
    quest_row.quest_type,
    now()
  );

  insert into public.member_quest_enrollments (
    user_id,
    quest_code,
    period_key
  )
  values (
    auth.uid(),
    quest_row.code,
    current_period
  )
  on conflict (user_id, quest_code, period_key)
  do nothing;

  return jsonb_build_object(
    'code', quest_row.code,
    'name', quest_row.name,
    'period_key', current_period,
    'started', true
  );
end;
$$;

revoke all on function public.start_my_quest(text)
from public, anon;

grant execute on function public.start_my_quest(text)
to authenticated;

create or replace function public.stop_my_quest(
  quest_code_input text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  quest_row public.progression_quests;
  current_period text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select *
  into quest_row
  from public.progression_quests
  where code = quest_code_input;

  if quest_row.code is null then
    return;
  end if;

  current_period := public.quest_period_key(
    quest_row.quest_type,
    now()
  );

  delete from public.member_quest_enrollments
  where user_id = auth.uid()
    and quest_code = quest_row.code
    and period_key = current_period;
end;
$$;

revoke all on function public.stop_my_quest(text)
from public, anon;

grant execute on function public.stop_my_quest(text)
to authenticated;

create or replace function public.get_my_active_quests()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    return '[]'::jsonb;
  end if;

  with quest_periods as (
    select
      quest.*,
      case quest.quest_type
        when 'daily' then date_trunc('day', now())
        when 'weekly' then date_trunc('week', now())
        else coalesce(
          quest.starts_at,
          '2000-01-01'::timestamptz
        )
      end as period_start,
      case quest.quest_type
        when 'daily' then date_trunc('day', now()) + interval '1 day'
        when 'weekly' then date_trunc('week', now()) + interval '1 week'
        else coalesce(
          quest.ends_at,
          '2999-01-01'::timestamptz
        )
      end as period_end,
      public.quest_period_key(
        quest.quest_type,
        now()
      ) as period_key
    from public.progression_quests quest
    where quest.is_active
      and (quest.starts_at is null or now() >= quest.starts_at)
      and (quest.ends_at is null or now() < quest.ends_at)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', quest.code,
        'name', quest.name,
        'description', quest.description,
        'type', quest.quest_type,
        'metric', quest.metric,
        'target', quest.target,
        'progress',
          least(
            quest.target,
            public.metric_value(
              quest.metric,
              quest.period_start,
              quest.period_end
            )
          ),
        'xp_reward', quest.xp_reward,
        'title_reward', quest.title_reward,
        'achievement_code', quest.achievement_code,
        'icon', quest.icon,
        'rarity', quest.rarity,
        'period_key', quest.period_key,
        'started',
          enrollment.started_at is not null,
        'started_at', enrollment.started_at,
        'completed',
          public.metric_value(
            quest.metric,
            quest.period_start,
            quest.period_end
          ) >= quest.target,
        'claimed',
          claim.claimed_at is not null
      )
      order by
        quest.sort_order,
        quest.quest_type,
        quest.name
    ),
    '[]'::jsonb
  )
  into result
  from quest_periods quest
  left join public.member_quest_enrollments enrollment
    on enrollment.user_id = auth.uid()
   and enrollment.quest_code = quest.code
   and enrollment.period_key = quest.period_key
  left join public.member_quest_claims claim
    on claim.user_id = auth.uid()
   and claim.quest_code = quest.code
   and claim.period_key = quest.period_key;

  return result;
end;
$$;

revoke all on function public.get_my_active_quests()
from public, anon;

grant execute on function public.get_my_active_quests()
to authenticated;

-- Auto-start the existing starter quests for current members so the
-- Quests tab is populated immediately after this patch.
insert into public.member_quest_enrollments (
  user_id,
  quest_code,
  period_key
)
select
  profile.id,
  quest.code,
  public.quest_period_key(quest.quest_type, now())
from public.profiles profile
cross join public.progression_quests quest
where quest.is_active
  and not profile.is_banned
  and (quest.starts_at is null or now() >= quest.starts_at)
  and (quest.ends_at is null or now() < quest.ends_at)
on conflict (user_id, quest_code, period_key)
do nothing;
