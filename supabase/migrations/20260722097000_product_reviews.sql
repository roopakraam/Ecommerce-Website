-- Product reviews with moderation statuses for admin queue.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  body text not null,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected')
  ),
  reviewer_name text,
  moderated_at timestamptz,
  moderated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id);

create index if not exists product_reviews_status_idx
  on public.product_reviews (status, created_at desc);

create index if not exists product_reviews_customer_id_idx
  on public.product_reviews (customer_id);

drop trigger if exists product_reviews_updated_at on public.product_reviews;
create trigger product_reviews_updated_at
  before update on public.product_reviews
  for each row
  execute function public.updated_at_trigger();

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_public_read_approved" on public.product_reviews;
create policy "product_reviews_public_read_approved"
  on public.product_reviews
  for select
  to anon, authenticated
  using (status = 'approved' or public.is_admin());

drop policy if exists "product_reviews_insert_own" on public.product_reviews;
create policy "product_reviews_insert_own"
  on public.product_reviews
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      customer_id = public.current_customer_id()
      and status = 'pending'
    )
  );

drop policy if exists "product_reviews_update_admin" on public.product_reviews;
create policy "product_reviews_update_admin"
  on public.product_reviews
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "product_reviews_delete_admin" on public.product_reviews;
create policy "product_reviews_delete_admin"
  on public.product_reviews
  for delete
  to authenticated
  using (public.is_admin());
