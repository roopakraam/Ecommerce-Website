-- Phase 0.5 + 0.1: product variants, order item snapshots, inventory reserve/release

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null,
  color text not null,
  sku text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  price_override numeric(10, 2) check (price_override is null or price_override >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_sku_unique unique (sku),
  constraint product_variants_product_size_color_unique unique (product_id, size, color)
);

create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_variants_is_active_idx
  on public.product_variants (is_active)
  where is_active = true;

create trigger product_variants_updated_at
  before update on public.product_variants
  for each row
  execute function public.updated_at_trigger();

-- ---------------------------------------------------------------------------
-- Keep products.stock_quantity as sum of active variant stock (read model)
-- ---------------------------------------------------------------------------

create or replace function public.sync_product_stock_from_variants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product_id uuid;
  total_stock integer;
begin
  target_product_id := coalesce(new.product_id, old.product_id);

  select coalesce(sum(stock_quantity), 0)
  into total_stock
  from public.product_variants
  where product_id = target_product_id
    and is_active = true;

  update public.products
  set stock_quantity = total_stock,
      updated_at = now()
  where id = target_product_id;

  return coalesce(new, old);
end;
$$;

create trigger product_variants_sync_product_stock
  after insert or update or delete on public.product_variants
  for each row
  execute function public.sync_product_stock_from_variants();

-- Backfill one legacy variant per existing product so stock moves to variant level
insert into public.product_variants (
  product_id,
  size,
  color,
  sku,
  stock_quantity,
  price_override,
  is_active
)
select
  p.id,
  'One Size',
  'Default',
  'LEGACY-' || replace(p.id::text, '-', ''),
  p.stock_quantity,
  null,
  true
from public.products p
where not exists (
  select 1
  from public.product_variants pv
  where pv.product_id = p.id
);

-- ---------------------------------------------------------------------------
-- order_items: variant snapshots
-- ---------------------------------------------------------------------------

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete set null,
  add column if not exists size_snapshot text,
  add column if not exists color_snapshot text,
  add column if not exists sku_snapshot text;

create index if not exists order_items_variant_id_idx on public.order_items (variant_id);

-- Link legacy order items to backfilled variants where possible
update public.order_items oi
set
  variant_id = pv.id,
  size_snapshot = coalesce(oi.size_snapshot, pv.size),
  color_snapshot = coalesce(oi.color_snapshot, pv.color),
  sku_snapshot = coalesce(oi.sku_snapshot, pv.sku)
from public.product_variants pv
where oi.product_id = pv.product_id
  and pv.sku like 'LEGACY-%'
  and oi.variant_id is null;

-- ---------------------------------------------------------------------------
-- orders: inventory reservation flag
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists inventory_reserved boolean not null default false;

-- ---------------------------------------------------------------------------
-- RLS for product_variants (public read active; admin write)
-- ---------------------------------------------------------------------------

alter table public.product_variants enable row level security;

create policy "product_variants_public_read"
  on public.product_variants
  for select
  to anon, authenticated
  using (
    is_active = true
    or public.is_admin()
  );

create policy "product_variants_admin_insert"
  on public.product_variants
  for insert
  to authenticated
  with check (public.is_admin());

create policy "product_variants_admin_update"
  on public.product_variants
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_variants_admin_delete"
  on public.product_variants
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Inventory: atomic reserve / release at variant level
-- ---------------------------------------------------------------------------

create or replace function public.reserve_order_inventory(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  updated_id uuid;
  already_reserved boolean;
begin
  select inventory_reserved
  into already_reserved
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if already_reserved then
    return true;
  end if;

  for item in
    select
      oi.variant_id,
      oi.quantity,
      oi.product_name_snapshot
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    if item.variant_id is null then
      raise exception 'Order item missing variant for %', item.product_name_snapshot;
    end if;

    update public.product_variants
    set stock_quantity = stock_quantity - item.quantity
    where id = item.variant_id
      and is_active = true
      and stock_quantity >= item.quantity
    returning id into updated_id;

    if updated_id is null then
      raise exception 'Insufficient stock for %', item.product_name_snapshot;
    end if;
  end loop;

  update public.orders
  set inventory_reserved = true
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.release_order_inventory(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  already_reserved boolean;
begin
  select inventory_reserved
  into already_reserved
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if not already_reserved then
    return true;
  end if;

  for item in
    select oi.variant_id, oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.variant_id is not null
  loop
    update public.product_variants
    set stock_quantity = stock_quantity + item.quantity
    where id = item.variant_id;
  end loop;

  update public.orders
  set inventory_reserved = false
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.reserve_order_inventory(uuid) from public;
revoke all on function public.release_order_inventory(uuid) from public;
grant execute on function public.reserve_order_inventory(uuid) to service_role;
grant execute on function public.release_order_inventory(uuid) to service_role;
