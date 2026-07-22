-- Inventory adjustment ledger + coupon codes for admin discounts.

-- ---------------------------------------------------------------------------
-- inventory_adjustments
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  delta integer not null,
  quantity_before integer not null check (quantity_before >= 0),
  quantity_after integer not null check (quantity_after >= 0),
  reason text,
  actor_auth_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_adjustments_delta_check check (delta <> 0)
);

create index if not exists inventory_adjustments_variant_id_idx
  on public.inventory_adjustments (variant_id, created_at desc);

create index if not exists inventory_adjustments_created_at_idx
  on public.inventory_adjustments (created_at desc);

alter table public.inventory_adjustments enable row level security;

drop policy if exists "inventory_adjustments_select_admin" on public.inventory_adjustments;
create policy "inventory_adjustments_select_admin"
  on public.inventory_adjustments
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "inventory_adjustments_insert_admin" on public.inventory_adjustments;
create policy "inventory_adjustments_insert_admin"
  on public.inventory_adjustments
  for insert
  to authenticated
  with check (public.is_admin());

create or replace function public.adjust_variant_inventory(
  p_variant_id uuid,
  p_delta integer,
  p_reason text default null
)
returns public.inventory_adjustments
language plpgsql
security definer
set search_path = public
as $$
declare
  current_qty integer;
  next_qty integer;
  adjustment public.inventory_adjustments;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_delta is null or p_delta = 0 then
    raise exception 'delta must be a non-zero integer';
  end if;

  select stock_quantity
  into current_qty
  from public.product_variants
  where id = p_variant_id
  for update;

  if current_qty is null then
    raise exception 'variant not found';
  end if;

  next_qty := current_qty + p_delta;
  if next_qty < 0 then
    raise exception 'adjustment would make stock negative';
  end if;

  update public.product_variants
  set stock_quantity = next_qty,
      updated_at = now()
  where id = p_variant_id;

  insert into public.inventory_adjustments (
    variant_id,
    delta,
    quantity_before,
    quantity_after,
    reason,
    actor_auth_user_id
  )
  values (
    p_variant_id,
    p_delta,
    current_qty,
    next_qty,
    nullif(trim(p_reason), ''),
    auth.uid()
  )
  returning * into adjustment;

  return adjustment;
end;
$$;

revoke all on function public.adjust_variant_inventory(uuid, integer, text) from public;
grant execute on function public.adjust_variant_inventory(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- coupons
-- ---------------------------------------------------------------------------

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  per_customer_limit integer check (per_customer_limit is null or per_customer_limit > 0),
  min_order_amount numeric(10, 2) check (min_order_amount is null or min_order_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_unique unique (code),
  constraint coupons_percentage_max check (
    discount_type <> 'percentage' or discount_value <= 100
  ),
  constraint coupons_date_range check (
    starts_at is null or ends_at is null or ends_at >= starts_at
  ),
  constraint coupons_usage_count_within_limit check (
    usage_limit is null or usage_count <= usage_limit
  )
);

create index if not exists coupons_is_active_idx
  on public.coupons (is_active)
  where is_active = true;

create index if not exists coupons_starts_ends_idx
  on public.coupons (starts_at, ends_at);

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at
  before update on public.coupons
  for each row
  execute function public.updated_at_trigger();

alter table public.coupons enable row level security;

drop policy if exists "coupons_select_admin" on public.coupons;
create policy "coupons_select_admin"
  on public.coupons
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "coupons_insert_admin" on public.coupons;
create policy "coupons_insert_admin"
  on public.coupons
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "coupons_update_admin" on public.coupons;
create policy "coupons_update_admin"
  on public.coupons
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "coupons_delete_admin" on public.coupons;
create policy "coupons_delete_admin"
  on public.coupons
  for delete
  to authenticated
  using (public.is_admin());
