-- Seeker Of SoundZ v4.17.0
-- Professional Studio Systems
-- Run ONCE in the correct Supabase project.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  sender_email text not null,
  message_type text not null default 'General',
  subject text not null,
  message text not null,
  wants_collaboration boolean not null default false,
  status text not null default 'new',
  priority text not null default 'normal',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaboration_requests (
  id uuid primary key default gen_random_uuid(),
  contact_message_id uuid references public.contact_messages(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  sender_email text not null,
  message text not null default '',
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.producer_resources (
  id text primary key,
  name text not null,
  vendor text not null default '',
  resource_type text not null default 'Plugin',
  category text not null default 'Utility',
  ecosystem text not null default 'Universal',
  price_type text not null default 'Free',
  version text not null default '',
  formats text[] not null default '{}'::text[],
  platforms text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  description text not null default '',
  thumbnail_url text,
  download_url text,
  website_url text,
  documentation_url text,
  tutorial_url text,
  license text not null default '',
  featured boolean not null default false,
  verified boolean not null default false,
  is_published boolean not null default true,
  version_history jsonb not null default '[]'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  media_type text not null,
  category text not null default 'General',
  storage_bucket text,
  storage_path text,
  public_url text not null,
  tags text[] not null default '{}'::text[],
  alt_text text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaboration_note_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.collaboration_projects(id) on delete cascade,
  version_number integer not null,
  note_body text not null default '',
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(project_id,version_number)
);

alter table public.contact_messages enable row level security;
alter table public.collaboration_requests enable row level security;
alter table public.producer_resources enable row level security;
alter table public.media_library enable row level security;
alter table public.collaboration_note_versions enable row level security;

create policy contact_submit on public.contact_messages
for insert to anon,authenticated
with check (user_id is null or user_id=auth.uid());

create policy contact_admin_read on public.contact_messages
for select to authenticated using (public.is_admin(auth.uid()));

create policy contact_admin_update on public.contact_messages
for update to authenticated using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy collab_request_submit on public.collaboration_requests
for insert to anon,authenticated
with check (user_id is null or user_id=auth.uid());

create policy collab_request_owner_read on public.collaboration_requests
for select to authenticated using (user_id=auth.uid() or public.is_admin(auth.uid()));

create policy collab_request_admin_manage on public.collaboration_requests
for update to authenticated using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy producer_public_read on public.producer_resources
for select to anon,authenticated using (is_published or public.is_admin(auth.uid()));

create policy producer_admin_manage on public.producer_resources
for all to authenticated using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy media_public_read on public.media_library
for select to anon,authenticated using (true);

create policy media_admin_manage on public.media_library
for all to authenticated using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy collab_notes_member_read on public.collaboration_note_versions
for select to authenticated using (
  public.is_admin(auth.uid()) or exists(
    select 1 from public.collaboration_project_members m
    where m.project_id=collaboration_note_versions.project_id and m.user_id=auth.uid()
  )
);

create policy collab_notes_member_insert on public.collaboration_note_versions
for insert to authenticated with check (
  public.is_admin(auth.uid()) or exists(
    select 1 from public.collaboration_project_members m
    where m.project_id=collaboration_note_versions.project_id and m.user_id=auth.uid()
  )
);

grant select,insert on public.contact_messages to anon,authenticated;
grant select,insert on public.collaboration_requests to anon,authenticated;
grant update on public.contact_messages,public.collaboration_requests to authenticated;
grant select on public.producer_resources,public.media_library to anon,authenticated;
grant insert,update,delete on public.producer_resources,public.media_library to authenticated;
grant select,insert on public.collaboration_note_versions to authenticated;

create or replace function public.submit_contact_message(
  p_name text,p_email text,p_type text,p_subject text,p_message text,p_wants_collaboration boolean default false
) returns uuid
language plpgsql security definer set search_path=public as $$
declare new_id uuid;
begin
  insert into public.contact_messages(user_id,sender_name,sender_email,message_type,subject,message,wants_collaboration)
  values(auth.uid(),trim(p_name),lower(trim(p_email)),coalesce(nullif(trim(p_type),''),'General'),trim(p_subject),trim(p_message),coalesce(p_wants_collaboration,false))
  returning id into new_id;
  if p_wants_collaboration then
    insert into public.collaboration_requests(contact_message_id,user_id,sender_name,sender_email,message)
    values(new_id,auth.uid(),trim(p_name),lower(trim(p_email)),trim(p_message));
  end if;
  return new_id;
end $$;
grant execute on function public.submit_contact_message(text,text,text,text,text,boolean) to anon,authenticated;

create or replace function public.admin_contact_inbox()
returns jsonb language sql stable security definer set search_path=public as $$
 select case when public.is_admin(auth.uid()) then jsonb_build_object(
  'messages',coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc) from public.contact_messages m),'[]'::jsonb),
  'requests',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.collaboration_requests r),'[]'::jsonb)
 ) else null end;
$$;
grant execute on function public.admin_contact_inbox() to authenticated;

create or replace function public.admin_update_contact_message(p_id uuid,p_status text,p_priority text,p_admin_note text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin(auth.uid()) then raise exception 'Administrator access is required.'; end if;
 update public.contact_messages set status=p_status,priority=p_priority,admin_note=coalesce(p_admin_note,''),updated_at=now() where id=p_id;
end $$;
grant execute on function public.admin_update_contact_message(uuid,text,text,text) to authenticated;

create or replace function public.admin_review_collaboration_request(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare req public.collaboration_requests;
begin
 if not public.is_admin(auth.uid()) then raise exception 'Administrator access is required.'; end if;
 select * into req from public.collaboration_requests where id=p_id;
 update public.collaboration_requests set status=p_status,reviewed_by=auth.uid(),reviewed_at=now() where id=p_id;
 if p_status='approved' and req.user_id is not null then
   update public.profiles set collaboration_access=true,updated_at=now() where id=req.user_id;
 end if;
end $$;
grant execute on function public.admin_review_collaboration_request(uuid,text) to authenticated;

create or replace function public.save_collaboration_note_version(p_project_id uuid,p_note_body text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare next_version integer; saved public.collaboration_note_versions;
begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 if not public.is_admin(auth.uid()) and not exists(select 1 from public.collaboration_project_members where project_id=p_project_id and user_id=auth.uid()) then
   raise exception 'Project access is required.';
 end if;
 select coalesce(max(version_number),0)+1 into next_version from public.collaboration_note_versions where project_id=p_project_id;
 insert into public.collaboration_note_versions(project_id,version_number,note_body,author_id)
 values(p_project_id,next_version,coalesce(p_note_body,''),auth.uid()) returning * into saved;
 update public.collaboration_projects set notes=coalesce(p_note_body,''),updated_at=now() where id=p_project_id;
 return to_jsonb(saved);
end $$;
grant execute on function public.save_collaboration_note_version(uuid,text) to authenticated;

create or replace function public.get_collaboration_note_history(p_project_id uuid)
returns jsonb language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',v.id,'version',v.version_number,'body',v.note_body,'author_id',v.author_id,'created_at',v.created_at,
  'author',coalesce(p.display_name,p.username,'Member')
 ) order by v.version_number desc),'[]'::jsonb)
 from public.collaboration_note_versions v left join public.profiles p on p.id=v.author_id
 where v.project_id=p_project_id and (
  public.is_admin(auth.uid()) or exists(select 1 from public.collaboration_project_members m where m.project_id=p_project_id and m.user_id=auth.uid())
 );
$$;
grant execute on function public.get_collaboration_note_history(uuid) to authenticated;
