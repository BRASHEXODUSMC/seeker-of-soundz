-- Seeker Of SoundZ v4.15.4
-- Notification cleanup functions
-- Run ONCE in the correct Supabase project.

create or replace function public.notification_delete_all()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  delete from public.notifications
  where user_id = auth.uid();

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.notification_delete_all()
from public, anon;

grant execute on function public.notification_delete_all()
to authenticated;

create or replace function public.notification_delete_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  delete from public.notifications
  where user_id = auth.uid()
    and read_at is not null;

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.notification_delete_read()
from public, anon;

grant execute on function public.notification_delete_read()
to authenticated;
