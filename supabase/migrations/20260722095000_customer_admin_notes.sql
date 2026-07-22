-- Staff-only notes on customer profiles.

alter table public.customers
  add column if not exists admin_notes text not null default '';
