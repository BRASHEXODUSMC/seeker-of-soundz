-- Seeker Of SoundZ v4.13.20
-- Supabase Collaboration Studio + Admin collaboration access.
-- Run this patch once.

alter table public.profiles
  add column if not exists collaboration_access boolean not null default false;

update public.profiles
set collaboration_access = true
where role in ('owner','administrator');

create table if not exists public.collaboration_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '',
  stage text not null default 'Idea',
  progress integer not null default 0 check (progress between 0 and 100),
  notes text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaboration_project_members (
  project_id uuid not null references public.collaboration_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'Collaborator',
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.collaboration_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.collaboration_projects(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2500),
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  created_at timestamptz not null default now(),
  check (char_length(trim(body)) > 0 or attachment_path is not null)
);

create index if not exists collab_projects_updated_idx on public.collaboration_projects(updated_at desc);
create index if not exists collab_members_user_idx on public.collaboration_project_members(user_id);
create index if not exists collab_messages_project_idx on public.collaboration_messages(project_id, created_at);

create or replace function public.is_collaboration_member(project uuid, member uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collaboration_project_members m
    where m.project_id = project and m.user_id = member
  ) or exists (
    select 1 from public.profiles p
    where p.id = member and p.role in ('owner','administrator')
  );
$$;

revoke all on function public.is_collaboration_member(uuid, uuid) from public;
grant execute on function public.is_collaboration_member(uuid, uuid) to authenticated;

alter table public.collaboration_projects enable row level security;
alter table public.collaboration_project_members enable row level security;
alter table public.collaboration_messages enable row level security;

drop policy if exists "collaboration projects read" on public.collaboration_projects;
create policy "collaboration projects read" on public.collaboration_projects
for select to authenticated
using (public.is_collaboration_member(id));

drop policy if exists "collaboration projects create" on public.collaboration_projects;
create policy "collaboration projects create" on public.collaboration_projects
for insert to authenticated
with check (
  created_by = auth.uid() and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and not p.is_banned
      and (p.collaboration_access or p.role in ('owner','administrator'))
  )
);

drop policy if exists "collaboration projects update" on public.collaboration_projects;
create policy "collaboration projects update" on public.collaboration_projects
for update to authenticated
using (created_by = auth.uid() or public.is_staff(auth.uid()))
with check (created_by = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "collaboration projects delete" on public.collaboration_projects;
create policy "collaboration projects delete" on public.collaboration_projects
for delete to authenticated
using (created_by = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "collaboration members read" on public.collaboration_project_members;
create policy "collaboration members read" on public.collaboration_project_members
for select to authenticated
using (public.is_collaboration_member(project_id));

drop policy if exists "collaboration members manage" on public.collaboration_project_members;
create policy "collaboration members manage" on public.collaboration_project_members
for all to authenticated
using (
  exists (select 1 from public.collaboration_projects p where p.id = project_id and (p.created_by = auth.uid() or public.is_staff(auth.uid())))
)
with check (
  exists (select 1 from public.collaboration_projects p where p.id = project_id and (p.created_by = auth.uid() or public.is_staff(auth.uid())))
);

drop policy if exists "collaboration messages read" on public.collaboration_messages;
create policy "collaboration messages read" on public.collaboration_messages
for select to authenticated
using (public.is_collaboration_member(project_id));

drop policy if exists "collaboration messages create" on public.collaboration_messages;
create policy "collaboration messages create" on public.collaboration_messages
for insert to authenticated
with check (sender_id = auth.uid() and public.is_collaboration_member(project_id));

drop policy if exists "collaboration messages delete" on public.collaboration_messages;
create policy "collaboration messages delete" on public.collaboration_messages
for delete to authenticated
using (sender_id = auth.uid() or public.is_staff(auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'collaboration-files',
  'collaboration-files',
  false,
  52428800,
  array['audio/mpeg','audio/wav','audio/x-wav','audio/flac','audio/ogg','audio/mp4','audio/aac','audio/x-m4a','audio/opus','audio/midi','audio/x-midi']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "collaboration files read" on storage.objects;
create policy "collaboration files read" on storage.objects
for select to authenticated
using (
  bucket_id = 'collaboration-files'
  and public.is_collaboration_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "collaboration files upload" on storage.objects;
create policy "collaboration files upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'collaboration-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_collaboration_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "collaboration files delete" on storage.objects;
create policy "collaboration files delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'collaboration-files'
  and ((storage.foldername(name))[2] = auth.uid()::text or public.is_staff(auth.uid()))
);

-- Replace the Admin member RPCs so collaboration access is managed alongside roles/ranks.
drop function if exists public.admin_list_members();
create function public.admin_list_members()
returns table (
  id uuid, email text, email_confirmed_at timestamptz, last_sign_in_at timestamptz,
  auth_created_at timestamptz, username text, display_name text, avatar_url text,
  role text, rank_name text, reputation integer, reactions_received integer,
  is_banned boolean, ban_reason text, collaboration_access boolean,
  last_seen_at timestamptz, profile_created_at timestamptz, updated_at timestamptz,
  location text, biography text, topic_count bigint, reply_count bigint
)
language plpgsql security definer set search_path = public, auth
as $$
declare caller_role public.app_role;
begin
  select p.role into caller_role from public.profiles p where p.id = auth.uid();
  if caller_role is null or caller_role not in ('owner','administrator') then
    raise exception 'Administrator access is required.';
  end if;
  return query
  select u.id,u.email::text,u.email_confirmed_at,u.last_sign_in_at,u.created_at,
    p.username,p.display_name,p.avatar_url,p.role::text,p.rank_name,p.reputation,
    p.reactions_received,p.is_banned,p.ban_reason,p.collaboration_access,p.last_seen_at,
    p.created_at,p.updated_at,p.location,p.biography,
    (select count(*) from public.forum_topics t where t.author_id=u.id),
    (select count(*) from public.forum_replies r where r.author_id=u.id)
  from auth.users u left join public.profiles p on p.id=u.id
  order by coalesce(p.last_seen_at,u.last_sign_in_at,u.created_at) desc;
end;$$;
revoke all on function public.admin_list_members() from public;
grant execute on function public.admin_list_members() to authenticated;

drop function if exists public.admin_update_member(uuid,text,text,integer,boolean,text);
create function public.admin_update_member(
  target_user_id uuid, new_role text, new_rank_name text, new_reputation integer,
  new_is_banned boolean, new_ban_reason text, new_collaboration_access boolean
)
returns table (id uuid, role text, rank_name text, reputation integer, is_banned boolean,
  ban_reason text, collaboration_access boolean, updated_at timestamptz)
language plpgsql security definer set search_path = public, auth
as $$
declare caller_role public.app_role; target_role public.app_role; desired_role public.app_role; owner_count integer;
begin
  select p.role into caller_role from public.profiles p where p.id=auth.uid();
  if caller_role is null or caller_role not in ('owner','administrator') then raise exception 'Administrator access is required.'; end if;
  select p.role into target_role from public.profiles p where p.id=target_user_id;
  if target_role is null then raise exception 'That member profile does not exist.'; end if;
  begin desired_role:=new_role::public.app_role; exception when invalid_text_representation then raise exception 'That role is not valid.'; end;
  if caller_role='administrator' and (target_role='owner' or desired_role='owner') then raise exception 'Only an Owner can manage the Owner role.'; end if;
  if target_user_id=auth.uid() and coalesce(new_is_banned,false) then raise exception 'You cannot ban your own account.'; end if;
  if target_role='owner' and desired_role<>'owner' then
    select count(*) into owner_count from public.profiles where role='owner';
    if owner_count<=1 then raise exception 'The final Owner account cannot be demoted.'; end if;
  end if;
  update public.profiles p set
    role=desired_role,
    rank_name=left(coalesce(nullif(trim(new_rank_name),''),'New Listener'),80),
    reputation=greatest(0,least(coalesce(new_reputation,0),100000000)),
    is_banned=coalesce(new_is_banned,false),
    ban_reason=case when coalesce(new_is_banned,false) then nullif(left(trim(coalesce(new_ban_reason,'')),500),'') else null end,
    collaboration_access=case when desired_role in ('owner','administrator') then true else coalesce(new_collaboration_access,false) end,
    updated_at=now()
  where p.id=target_user_id;
  return query select p.id,p.role::text,p.rank_name,p.reputation,p.is_banned,p.ban_reason,p.collaboration_access,p.updated_at
  from public.profiles p where p.id=target_user_id;
end;$$;
revoke all on function public.admin_update_member(uuid,text,text,integer,boolean,text,boolean) from public;
grant execute on function public.admin_update_member(uuid,text,text,integer,boolean,text,boolean) to authenticated;
