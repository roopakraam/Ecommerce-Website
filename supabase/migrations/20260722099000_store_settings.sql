-- Store settings singleton, shipping zones, and admin display name.

alter table public.admin_users
  add column if not exists display_name text;

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'BOOK MY TEES',
  currency text not null default 'INR' check (currency in ('INR', 'USD')),
  tax_rate numeric(5, 2) not null default 0
    check (tax_rate >= 0 and tax_rate <= 100),
  support_email text,
  support_phone text,
  notify_email_customer boolean not null default true,
  notify_whatsapp_customer boolean not null default true,
  notify_email_admin boolean not null default true,
  notify_whatsapp_admin boolean not null default false,
  notify_low_stock boolean not null default true,
  admin_notify_email text,
  admin_notify_phone text,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at
  before update on public.store_settings
  for each row
  execute function public.updated_at_trigger();

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  states text[] not null default '{}',
  flat_rate numeric(10, 2) not null default 0 check (flat_rate >= 0),
  free_above numeric(10, 2) check (free_above is null or free_above > 0),
  estimated_days_min integer check (
    estimated_days_min is null or estimated_days_min >= 0
  ),
  estimated_days_max integer check (
    estimated_days_max is null or estimated_days_max >= 0
  ),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_zones_days_order check (
    estimated_days_min is null
    or estimated_days_max is null
    or estimated_days_max >= estimated_days_min
  )
);

create index if not exists shipping_zones_sort_idx
  on public.shipping_zones (sort_order, name);

drop trigger if exists shipping_zones_updated_at on public.shipping_zones;
create trigger shipping_zones_updated_at
  before update on public.shipping_zones
  for each row
  execute function public.updated_at_trigger();

insert into public.shipping_zones (
  name,
  states,
  flat_rate,
  free_above,
  estimated_days_min,
  estimated_days_max,
  is_active,
  sort_order
)
select
  'All India',
  '{}'::text[],
  0,
  999,
  3,
  7,
  true,
  0
where not exists (select 1 from public.shipping_zones);

alter table public.store_settings enable row level security;
alter table public.shipping_zones enable row level security;

drop policy if exists "store_settings_admin_select" on public.store_settings;
create policy "store_settings_admin_select"
  on public.store_settings
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "store_settings_admin_update" on public.store_settings;
create policy "store_settings_admin_update"
  on public.store_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "store_settings_admin_insert" on public.store_settings;
create policy "store_settings_admin_insert"
  on public.store_settings
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "shipping_zones_admin_all" on public.shipping_zones;
create policy "shipping_zones_admin_all"
  on public.shipping_zones
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
