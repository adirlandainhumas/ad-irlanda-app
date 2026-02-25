-- Estrutura e segurança da área de membros
-- Execute no SQL Editor do Supabase.

create table if not exists public.member_details (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  gender text not null,
  birth_date date not null,
  marital_status text not null,
  address_street text not null,
  address_block text not null,
  address_lot text,
  address_sector text not null,
  address_city text not null,
  address_state text not null,
  postal_code text not null default '',
  phone text not null,
  email text not null,
  church_role_info text not null default '',
  church_entry_date date not null,
  baptism_date date not null,
  church_function text not null,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_details add column if not exists postal_code text not null default '';
alter table public.member_details add column if not exists photo_path text;
alter table public.member_details enable row level security;

create or replace function public.set_updated_at_member_details()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_member_details_updated_at on public.member_details;
create trigger trg_member_details_updated_at
before update on public.member_details
for each row
execute function public.set_updated_at_member_details();

drop policy if exists "member_details_select_own" on public.member_details;
create policy "member_details_select_own"
on public.member_details
for select
using (auth.uid() = user_id);

drop policy if exists "member_details_insert_own" on public.member_details;
create policy "member_details_insert_own"
on public.member_details
for insert
with check (auth.uid() = user_id);

drop policy if exists "member_details_update_own" on public.member_details;
create policy "member_details_update_own"
on public.member_details
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "member_details_delete_own" on public.member_details;
create policy "member_details_delete_own"
on public.member_details
for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', false)
on conflict (id) do nothing;

-- Apenas o dono do arquivo consegue subir/listar/ver/remover
-- Cada usuário usa o prefixo <auth.uid()>/arquivo.ext

drop policy if exists "member_photos_select_own" on storage.objects;
create policy "member_photos_select_own"
on storage.objects
for select
to authenticated
using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "member_photos_insert_own" on storage.objects;
create policy "member_photos_insert_own"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "member_photos_update_own" on storage.objects;
create policy "member_photos_update_own"
on storage.objects
for update
to authenticated
using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "member_photos_delete_own" on storage.objects;
create policy "member_photos_delete_own"
on storage.objects
for delete
to authenticated
using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);
