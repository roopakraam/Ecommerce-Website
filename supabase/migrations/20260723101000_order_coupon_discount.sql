-- Persist applied coupon / discount on orders for checkout totals.

alter table public.orders
  add column if not exists discount_amount numeric(10, 2) not null default 0
    check (discount_amount >= 0);

alter table public.orders
  add column if not exists coupon_id uuid references public.coupons (id) on delete set null;

alter table public.orders
  add column if not exists coupon_code text;

create index if not exists orders_coupon_id_idx
  on public.orders (coupon_id)
  where coupon_id is not null;

create index if not exists orders_customer_coupon_idx
  on public.orders (customer_id, coupon_id)
  where coupon_id is not null;
