-- Seeker Of SoundZ v4.16.0
-- Homepage Content Studio + Public Gallery Sync
-- Run ONCE in the correct Supabase project.

create table if not exists public.homepage_content_slots (
  slot_key text primary key,
  content_type text not null,
  content_data jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint homepage_slot_key_format
    check (slot_key ~ '^[a-z0-9_]+$')
);

create table if not exists public.public_gallery_items (
  id text primary key,
  title text not null,
  category text not null default 'other',
  description text not null default '',
  credit text not null default '',
  layout text not null default 'standard',
  image_url text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.homepage_content_slots enable row level security;
alter table public.public_gallery_items enable row level security;

drop policy if exists homepage_content_public_read
on public.homepage_content_slots;
create policy homepage_content_public_read
on public.homepage_content_slots
for select
to anon, authenticated
using (is_active or public.is_admin(auth.uid()));

drop policy if exists homepage_content_admin_manage
on public.homepage_content_slots;
create policy homepage_content_admin_manage
on public.homepage_content_slots
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists public_gallery_read
on public.public_gallery_items;
create policy public_gallery_read
on public.public_gallery_items
for select
to anon, authenticated
using (is_published or public.is_admin(auth.uid()));

drop policy if exists public_gallery_admin_manage
on public.public_gallery_items;
create policy public_gallery_admin_manage
on public.public_gallery_items
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select on public.homepage_content_slots, public.public_gallery_items
to anon, authenticated;

grant insert, update, delete
on public.homepage_content_slots, public.public_gallery_items
to authenticated;

create or replace function public.admin_save_homepage_slot(
  p_slot_key text,
  p_content_type text,
  p_content_data jsonb,
  p_is_active boolean default true
)
returns public.homepage_content_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.homepage_content_slots;
  clean_key text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access is required.';
  end if;

  clean_key := lower(regexp_replace(trim(coalesce(p_slot_key,'')), '[^a-zA-Z0-9_]+', '_', 'g'));

  if clean_key = '' then
    raise exception 'Homepage slot key is required.';
  end if;

  insert into public.homepage_content_slots (
    slot_key,
    content_type,
    content_data,
    is_active,
    updated_by,
    updated_at
  )
  values (
    clean_key,
    trim(coalesce(p_content_type,'content')),
    coalesce(p_content_data,'{}'::jsonb),
    coalesce(p_is_active,true),
    auth.uid(),
    now()
  )
  on conflict (slot_key) do update set
    content_type = excluded.content_type,
    content_data = excluded.content_data,
    is_active = excluded.is_active,
    updated_by = auth.uid(),
    updated_at = now()
  returning * into saved;

  return saved;
end;
$$;

revoke all on function public.admin_save_homepage_slot(text,text,jsonb,boolean)
from public, anon;
grant execute on function public.admin_save_homepage_slot(text,text,jsonb,boolean)
to authenticated;

create or replace function public.admin_get_homepage_content()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_admin(auth.uid()) then
      coalesce(
        jsonb_object_agg(
          slot_key,
          jsonb_build_object(
            'type', content_type,
            'active', is_active,
            'data', content_data,
            'updated_at', updated_at
          )
        ),
        '{}'::jsonb
      )
    else '{}'::jsonb
  end
  from public.homepage_content_slots;
$$;

grant execute on function public.admin_get_homepage_content()
to authenticated;

create or replace function public.get_homepage_content()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(
      slot_key,
      jsonb_build_object(
        'type', content_type,
        'active', is_active,
        'data', content_data,
        'updated_at', updated_at
      )
    ),
    '{}'::jsonb
  )
  from public.homepage_content_slots;
$$;

grant execute on function public.get_homepage_content()
to anon, authenticated;

create or replace function public.admin_replace_gallery_items(
  p_items jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  retained_ids text[] := '{}'::text[];
  item_id text;
  position integer := 0;
  changed integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access is required.';
  end if;

  if jsonb_typeof(coalesce(p_items,'[]'::jsonb)) <> 'array' then
    raise exception 'Gallery items must be supplied as an array.';
  end if;

  for item in
    select value
    from jsonb_array_elements(coalesce(p_items,'[]'::jsonb))
  loop
    item_id := coalesce(nullif(trim(item->>'id'),''), gen_random_uuid()::text);
    retained_ids := array_append(retained_ids,item_id);

    insert into public.public_gallery_items (
      id,
      title,
      category,
      description,
      credit,
      layout,
      image_url,
      sort_order,
      is_published,
      updated_by,
      updated_at
    )
    values (
      item_id,
      coalesce(nullif(trim(item->>'title'),''),'Untitled Image'),
      coalesce(nullif(trim(item->>'category'),''),'other'),
      coalesce(item->>'description',''),
      coalesce(item->>'credit',''),
      coalesce(nullif(trim(item->>'layout'),''),'standard'),
      coalesce(nullif(trim(item->>'image'),''),nullif(trim(item->>'image_url'),'')),
      position,
      coalesce((item->>'is_published')::boolean,true),
      auth.uid(),
      now()
    )
    on conflict (id) do update set
      title = excluded.title,
      category = excluded.category,
      description = excluded.description,
      credit = excluded.credit,
      layout = excluded.layout,
      image_url = excluded.image_url,
      sort_order = excluded.sort_order,
      is_published = excluded.is_published,
      updated_by = auth.uid(),
      updated_at = now();

    position := position + 1;
    changed := changed + 1;
  end loop;

  if cardinality(retained_ids) = 0 then
    delete from public.public_gallery_items;
  else
    delete from public.public_gallery_items
    where not (id = any(retained_ids));
  end if;

  return changed;
end;
$$;

revoke all on function public.admin_replace_gallery_items(jsonb)
from public, anon;
grant execute on function public.admin_replace_gallery_items(jsonb)
to authenticated;

create or replace function public.get_public_gallery_items()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'category', category,
        'description', description,
        'credit', credit,
        'layout', layout,
        'image', image_url,
        'sort_order', sort_order
      )
      order by sort_order, created_at
    ),
    '[]'::jsonb
  )
  from public.public_gallery_items
  where is_published;
$$;

grant execute on function public.get_public_gallery_items()
to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='homepage_content_slots'
  ) then
    execute 'alter publication supabase_realtime add table public.homepage_content_slots';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='public_gallery_items'
  ) then
    execute 'alter publication supabase_realtime add table public.public_gallery_items';
  end if;
end
$$;
