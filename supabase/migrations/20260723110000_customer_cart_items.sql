-- Persisted cart lines for logged-in customers (merged from guest localStorage on login).

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  updated_at timestamptz not null default now(),
  unique (customer_id, variant_id)
);

create index if not exists cart_items_customer_id_idx
  on public.cart_items (customer_id);

create index if not exists cart_items_variant_id_idx
  on public.cart_items (variant_id);

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at
  before update on public.cart_items
  for each row
  execute function public.updated_at_trigger();

alter table public.cart_items enable row level security;

-- Own read/write; admin full access (same pattern as addresses)

drop policy if exists "cart_items_select_own_or_admin" on public.cart_items;
create policy "cart_items_select_own_or_admin"
  on public.cart_items
  for select
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin());

drop policy if exists "cart_items_insert_own_or_admin" on public.cart_items;
create policy "cart_items_insert_own_or_admin"
  on public.cart_items
  for insert
  to authenticated
  with check (customer_id = public.current_customer_id() or public.is_admin());

drop policy if exists "cart_items_update_own_or_admin" on public.cart_items;
create policy "cart_items_update_own_or_admin"
  on public.cart_items
  for update
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin())
  with check (customer_id = public.current_customer_id() or public.is_admin());

drop policy if exists "cart_items_delete_own_or_admin" on public.cart_items;
create policy "cart_items_delete_own_or_admin"
  on public.cart_items
  for delete
  to authenticated
  using (customer_id = public.current_customer_id() or public.is_admin());
