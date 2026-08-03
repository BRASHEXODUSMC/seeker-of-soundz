-- Seeker Of SoundZ v4.17.1
-- Developer rank and BRASHEXODUS founder correction
-- Run once after v4.17.0.

update public.profiles
set rank_name = 'Developer',
    updated_at = now()
where lower(email) = 'brashexodus@gmail.com';

-- Keep the authenticated account role unchanged. Developer is a public rank/title.
