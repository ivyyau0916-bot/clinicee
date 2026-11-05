-- Ward Notes schema
-- 1. Open the Supabase SQL editor and run this whole script.
-- 2. In the project root, create .env.local with:
--      NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
--      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- 3. Restart `npm run dev`.
--
-- These policies allow the anon key to read and write every row.
-- Add authentication before using this project with real ward data.

create table if not exists public.wards (
  id text primary key,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  ward_id text not null references public.wards (id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  position integer not null default 0
);

create table if not exists public.notes (
  id text primary key,
  category_id text not null references public.categories (id) on delete cascade,
  title text not null default '',
  content text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  callouts jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.note_images (
  id text primary key,
  note_id text not null references public.notes (id) on delete cascade,
  url text not null,
  caption text not null default '',
  storage_path text not null default '',
  position bigint not null default 0
);

create table if not exists public.app_settings (
  id integer primary key check (id = 1),
  active_ward_id text references public.wards (id) on delete set null
);

insert into public.app_settings (id, active_ward_id)
values (1, null)
on conflict (id) do nothing;

create index if not exists categories_ward_position_idx on public.categories (ward_id, position);
create index if not exists notes_category_updated_idx on public.notes (category_id, updated_at desc);
create index if not exists note_images_note_position_idx on public.note_images (note_id, position);

alter table public.wards enable row level security;
alter table public.categories enable row level security;
alter table public.notes enable row level security;
alter table public.note_images enable row level security;
alter table public.app_settings enable row level security;

grant select, insert, update, delete on public.wards to anon, authenticated;
grant select, insert, update, delete on public.categories to anon, authenticated;
grant select, insert, update, delete on public.notes to anon, authenticated;
grant select, insert, update, delete on public.note_images to anon, authenticated;
grant select, insert, update, delete on public.app_settings to anon, authenticated;

drop policy if exists "wards_anon_all" on public.wards;
create policy "wards_anon_all" on public.wards
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "categories_anon_all" on public.categories;
create policy "categories_anon_all" on public.categories
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "notes_anon_all" on public.notes;
create policy "notes_anon_all" on public.notes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "note_images_anon_all" on public.note_images;
create policy "note_images_anon_all" on public.note_images
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "app_settings_anon_all" on public.app_settings;
create policy "app_settings_anon_all" on public.app_settings
  for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('ward-images', 'ward-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "ward_images_public_read" on storage.objects;
create policy "ward_images_public_read" on storage.objects
  for select to public
  using (bucket_id = 'ward-images');

drop policy if exists "ward_images_insert" on storage.objects;
create policy "ward_images_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'ward-images');

drop policy if exists "ward_images_update" on storage.objects;
create policy "ward_images_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'ward-images')
  with check (bucket_id = 'ward-images');

drop policy if exists "ward_images_delete" on storage.objects;
create policy "ward_images_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'ward-images');
