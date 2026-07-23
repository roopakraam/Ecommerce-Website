-- Contact form submissions persisted for reliability when email delivery fails.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (
    status in ('new', 'emailed', 'email_failed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

-- Inserts happen via service role from the contact server action.
-- Admins can read and update status from the dashboard / SQL.

drop policy if exists "contact_messages_select_admin" on public.contact_messages;
create policy "contact_messages_select_admin"
  on public.contact_messages
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "contact_messages_update_admin" on public.contact_messages;
create policy "contact_messages_update_admin"
  on public.contact_messages
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "contact_messages_delete_admin" on public.contact_messages;
create policy "contact_messages_delete_admin"
  on public.contact_messages
  for delete
  to authenticated
  using (public.is_admin());
