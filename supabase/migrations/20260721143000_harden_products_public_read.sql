-- Harden public product reads: anon/authenticated see active products only;
-- admins can still read inactive rows via is_admin().

drop policy if exists "products_public_read" on public.products;

create policy "products_public_read_active_or_admin"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true or public.is_admin());
