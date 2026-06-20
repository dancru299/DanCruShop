-- Create the private "products" storage bucket used for digital product files.
--
-- Why this is needed: product files are delivered only to buyers, so unlike the
-- public "media" bucket they live in a PRIVATE bucket. The admin file uploader
-- (uploadProductFile) runs from the browser client with the admin's session, so
-- Storage RLS applies — we add policies that let admins manage objects in this
-- bucket. Downloads/deletes done server-side use the service role and bypass RLS.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run (idempotent).

-- 1. The bucket (private). No per-bucket size limit so large product archives
--    are allowed; tighten if you want a cap.
insert into storage.buckets (id, name, public, file_size_limit)
values ('products', 'products', false, null)
on conflict (id) do update
  set public = excluded.public;

-- 2. Admin-only access to objects in the products bucket. Mirrors the app's
--    admin check: profiles.role = 'admin' for the current user.
drop policy if exists "Admins manage product files" on storage.objects;

create policy "Admins manage product files"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'products'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  bucket_id = 'products'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
