-- Encrypted third-party integration credentials (Razorpay, Resend, Twilio WhatsApp).
-- Secrets are AES-256-GCM encrypted in the app; only admins can read/write rows.

create table if not exists public.integration_credentials (
  provider text primary key
    check (provider in ('razorpay', 'resend', 'twilio_whatsapp')),
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  secrets_encrypted text,
  secrets_mask jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  last_test_status text
    check (
      last_test_status is null
      or last_test_status in ('success', 'error')
    ),
  last_test_message text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

drop trigger if exists integration_credentials_updated_at
  on public.integration_credentials;
create trigger integration_credentials_updated_at
  before update on public.integration_credentials
  for each row
  execute function public.updated_at_trigger();

alter table public.integration_credentials enable row level security;

drop policy if exists "integration_credentials_admin_select"
  on public.integration_credentials;
create policy "integration_credentials_admin_select"
  on public.integration_credentials
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "integration_credentials_admin_insert"
  on public.integration_credentials;
create policy "integration_credentials_admin_insert"
  on public.integration_credentials
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "integration_credentials_admin_update"
  on public.integration_credentials;
create policy "integration_credentials_admin_update"
  on public.integration_credentials
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "integration_credentials_admin_delete"
  on public.integration_credentials;
create policy "integration_credentials_admin_delete"
  on public.integration_credentials
  for delete
  to authenticated
  using (public.is_admin());
