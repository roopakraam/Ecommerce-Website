-- Phase 0.2: Customers may SELECT own orders/items; mutations via service role / admin only.

-- ---------------------------------------------------------------------------
-- orders: drop customer insert/update; keep select + admin delete; admin-only write
-- ---------------------------------------------------------------------------

drop policy if exists "orders_insert_own_or_admin" on public.orders;
drop policy if exists "orders_update_own_or_admin" on public.orders;

create policy "orders_admin_insert"
  on public.orders
  for insert
  to authenticated
  with check (public.is_admin());

create policy "orders_admin_update"
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items: drop customer insert; select + admin mutations only
-- ---------------------------------------------------------------------------

drop policy if exists "order_items_insert_own_or_admin" on public.order_items;

create policy "order_items_admin_insert"
  on public.order_items
  for insert
  to authenticated
  with check (public.is_admin());
