-- HOTFIX: execute no SQL Editor do Supabase para normalizar a tabela member_details
-- Resolve erros como:
-- "Could not find the 'church_entry_date' column of 'member_details' in the schema cache"

create table if not exists public.member_details (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  gender text,
  birth_date date,
  marital_status text,
  address_street text,
  address_block text,
  address_lot text,
  address_sector text,
  address_city text,
  address_state text,
  postal_code text default '',
  phone text,
  email text,
  church_role_info text default '',
  church_entry_date date,
  baptism_date date,
  church_function text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_details add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.member_details add column if not exists full_name text;
alter table public.member_details add column if not exists gender text;
alter table public.member_details add column if not exists birth_date date;
alter table public.member_details add column if not exists marital_status text;
alter table public.member_details add column if not exists address_street text;
alter table public.member_details add column if not exists address_block text;
alter table public.member_details add column if not exists address_lot text;
alter table public.member_details add column if not exists address_sector text;
alter table public.member_details add column if not exists address_city text;
alter table public.member_details add column if not exists address_state text;
alter table public.member_details add column if not exists postal_code text not null default '';
alter table public.member_details add column if not exists phone text;
alter table public.member_details add column if not exists email text;
alter table public.member_details add column if not exists church_role_info text not null default '';
alter table public.member_details add column if not exists church_entry_date date;
alter table public.member_details add column if not exists baptism_date date;
alter table public.member_details add column if not exists church_function text;
alter table public.member_details add column if not exists photo_path text;
alter table public.member_details add column if not exists created_at timestamptz not null default now();
alter table public.member_details add column if not exists updated_at timestamptz not null default now();

-- Migra automaticamente de possíveis nomes antigos para os nomes atuais esperados pelo app.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='member_details' and column_name='church_entry'
  ) then
    execute 'update public.member_details set church_entry_date = coalesce(church_entry_date, church_entry::date) where church_entry is not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='member_details' and column_name='baptism'
  ) then
    execute 'update public.member_details set baptism_date = coalesce(baptism_date, baptism::date) where baptism is not null';
  end if;
end $$;

create unique index if not exists idx_member_details_user_id on public.member_details(user_id);

-- Recarrega cache de schema para refletir alterações imediatamente
notify pgrst, 'reload schema';
