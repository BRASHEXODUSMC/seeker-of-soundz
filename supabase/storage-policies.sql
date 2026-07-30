-- Create these PUBLIC buckets in Storage first: avatars, banners, gallery, forum-attachments, music-artwork
-- Recommended size limits are documented in SUPABASE-SETUP.md.

create policy "public media read" on storage.objects for select using (
  bucket_id in ('avatars','banners','gallery','forum-attachments','music-artwork')
);

create policy "users upload own folder" on storage.objects for insert to authenticated with check (
  bucket_id in ('avatars','banners','gallery','forum-attachments','music-artwork')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update own folder" on storage.objects for update to authenticated using (
  (storage.foldername(name))[1] = auth.uid()::text
) with check ((storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own folder" on storage.objects for delete to authenticated using (
  (storage.foldername(name))[1] = auth.uid()::text or public.is_staff()
);
