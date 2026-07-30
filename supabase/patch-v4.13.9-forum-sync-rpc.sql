-- Seeker Of SoundZ v4.13.9 forum synchronization fix
-- Run ONLY this patch after v4.13.7. It is safe to run more than once.

create or replace function public.forum_get_presets()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'categories', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.sort_order, c.name)
      from public.forum_categories c
      where c.is_visible = true
    ), '[]'::jsonb),
    'subcategories', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.sort_order, s.name)
      from public.forum_subcategories s
      join public.forum_categories c on c.id = s.category_id
      where s.is_visible = true and c.is_visible = true
    ), '[]'::jsonb),
    'tags', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.sort_order, t.tag)
      from public.forum_tag_presets t
      where t.is_visible = true
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.forum_get_presets() to anon, authenticated;

create or replace function public.forum_create_topic(
  category_slug_input text,
  subcategory_name_input text,
  title_input text,
  body_input text,
  tags_input text[] default '{}',
  media_url_input text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_category public.forum_categories%rowtype;
  resolved_subcategory public.forum_subcategories%rowtype;
  new_topic_id uuid;
begin
  if current_user_id is null then
    raise exception 'Please sign in before creating a discussion.';
  end if;
  if not public.can_participate(current_user_id) then
    raise exception 'This account cannot currently participate in the forum.';
  end if;

  select * into resolved_category
  from public.forum_categories
  where is_visible = true
    and lower(slug) = lower(trim(category_slug_input))
  limit 1;

  if resolved_category.id is null then
    raise exception 'That forum category is not available in Supabase.';
  end if;

  if coalesce(trim(subcategory_name_input), '') <> '' then
    select * into resolved_subcategory
    from public.forum_subcategories
    where category_id = resolved_category.id
      and is_visible = true
      and lower(name) = lower(trim(subcategory_name_input))
    limit 1;

    if resolved_subcategory.id is null then
      raise exception 'That subcategory is not available for the selected forum section.';
    end if;
  end if;

  insert into public.forum_topics(
    category_id, author_id, title, body, tags, subcategory,
    media_url, last_activity_at
  ) values (
    resolved_category.id,
    current_user_id,
    trim(title_input),
    trim(body_input),
    coalesce(tags_input, '{}'),
    coalesce(resolved_subcategory.name, ''),
    nullif(trim(media_url_input), ''),
    now()
  ) returning id into new_topic_id;

  return new_topic_id;
end;
$$;

grant execute on function public.forum_create_topic(text,text,text,text,text[],text) to authenticated;
