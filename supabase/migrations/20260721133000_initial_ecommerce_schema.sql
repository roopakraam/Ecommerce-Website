-- Initial e-commerce schema for BOOK MY TEES
-- Run via Supabase CLI or SQL Editor

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  category_id uuid references public.categories (id) on delete set null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  position integer not null default 0
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')
  ),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_fee numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'failed', 'refunded')
  ),
  payment_provider text,
  payment_reference text,
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'super_admin'))
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index categories_slug_idx on public.categories (slug);

create index products_slug_idx on public.products (slug);
create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active) where is_active = true;

create index product_images_product_id_idx on public.product_images (product_id);

create index customers_auth_user_id_idx on public.customers (auth_user_id);

create index addresses_customer_id_idx on public.addresses (customer_id);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create index order_items_order_id_idx on public.order_items (order_id);

create index admin_users_auth_user_id_idx on public.admin_users (auth_user_id);

-- ---------------------------------------------------------------------------
-- Helper functions (used by RLS policies and triggers)
-- ---------------------------------------------------------------------------

create or replace function public.updated_at_trigger()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where auth_user_id = auth.uid()
  );
$$;

create or replace function public.current_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.customers
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger products_updated_at
  before update on public.products
  for each row
  execute function public.updated_at_trigger();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;

-- categories: public read, admin write
create policy "categories_public_read"
  on public.categories
  for select
  to anon, authenticated
  using (true);

create policy "categories_admin_insert"
  on public.categories
  for insert
  to authenticated
  with check (public.is_admin());

create policy "categories_admin_update"
  on public.categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "categories_admin_delete"
  on public.categories
  for delete
  to authenticated
  using (public.is_admin());

-- products: public read, admin write
create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (true);

create policy "products_admin_insert"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

create policy "products_admin_update"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_admin_delete"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

-- product_images: public read, admin write
create policy "product_images_public_read"
  on public.product_images
  for select
  to anon, authenticated
  using (true);

create policy "product_images_admin_insert"
  on public.product_images
  for insert
  to authenticated
  with check (public.is_admin());

create policy "product_images_admin_update"
  on public.product_images
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_images_admin_delete"
  on public.product_images
  for delete
  to authenticated
  using (public.is_admin());

-- customers: own row read/write; admin full access
create policy "customers_select_own_or_admin"
  on public.customers
  for select
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "customers_insert_own"
  on public.customers
  for insert
  to authenticated
  with check (auth_user_id = auth.uid());

create policy "customers_update_own_or_admin"
  on public.customers
  for update
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

create policy "customers_delete_admin"
  on public.customers
  for delete
  to authenticated
  using (public.is_admin());

-- addresses: own read/write; admin full access
create policy "addresses_select_own_or_admin"
  on public.addresses
  for select
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin());

create policy "addresses_insert_own_or_admin"
  on public.addresses
  for insert
  to authenticated
  with check (customer_id = public.current_customer_id() or public.is_admin());

create policy "addresses_update_own_or_admin"
  on public.addresses
  for update
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin())
  with check (customer_id = public.current_customer_id() or public.is_admin());

create policy "addresses_delete_own_or_admin"
  on public.addresses
  for delete
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin());

-- orders: own read/write; admin full access
create policy "orders_select_own_or_admin"
  on public.orders
  for select
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin());

create policy "orders_insert_own_or_admin"
  on public.orders
  for insert
  to authenticated
  with check (customer_id = public.current_customer_id() or public.is_admin());

create policy "orders_update_own_or_admin"
  on public.orders
  for update
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin())
  with check (customer_id = public.current_customer_id() or public.is_admin());

create policy "orders_delete_admin"
  on public.orders
  for delete
  to authenticated
  using (public.is_admin());

-- order_items: readable/writable via own orders; admin full access
create policy "order_items_select_own_or_admin"
  on public.order_items
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = public.current_customer_id()
    )
  );

create policy "order_items_insert_own_or_admin"
  on public.order_items
  for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = public.current_customer_id()
    )
  );

create policy "order_items_update_admin"
  on public.order_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "order_items_delete_admin"
  on public.order_items
  for delete
  to authenticated
  using (public.is_admin());

-- admin_users: admin-only management; users can read their own admin row
create policy "admin_users_select_own_or_admin"
  on public.admin_users
  for select
  to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "admin_users_insert_admin"
  on public.admin_users
  for insert
  to authenticated
  with check (public.is_admin());

create policy "admin_users_update_admin"
  on public.admin_users
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_users_delete_admin"
  on public.admin_users
  for delete
  to authenticated
  using (public.is_admin());
