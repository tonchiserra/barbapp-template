insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'images'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can update own images"
  on storage.objects for update
  using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Authenticated users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'images');
