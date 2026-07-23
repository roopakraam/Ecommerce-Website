# Deployment guide (Vercel + Supabase)

This project is a **Next.js 14 App Router** app. Vercel detects Next.js automatically. A minimal [`vercel.json`](vercel.json) configures the **stale-inventory cron** only — framework settings, builds, and serverless routing stay with the Vercel Next.js runtime.

**No custom domain yet?** Deploy first on the free `*.vercel.app` URL. Use that URL for `NEXT_PUBLIC_SITE_URL`, Supabase Auth redirects, and the Razorpay webhook. Attach a custom domain later and update those three places.

---

## 1. Pre-flight checklist

- [ ] Run SQL migrations in the Supabase SQL editor (or via CLI), in order:
  - `supabase/migrations/20260721133000_initial_ecommerce_schema.sql`
  - `supabase/migrations/20260721140000_product_images_storage.sql`
  - `supabase/migrations/20260721143000_harden_products_public_read.sql`
  - `supabase/migrations/20260722090000_harden_orders_rls.sql`
  - `supabase/migrations/20260722091000_product_variants_and_inventory.sql`
  - `supabase/migrations/20260722093000_admin_dashboard_metrics.sql` (optional — dashboard uses direct queries; RPCs are for SQL-side aggregation later)
  - `supabase/migrations/20260722094000_order_notes_and_audit_logs.sql` (required for admin order notes + audit history)
  - `supabase/migrations/20260722095000_customer_admin_notes.sql` (required for admin customer notes)
  - `supabase/migrations/20260722096000_inventory_adjustments_and_coupons.sql` (required for inventory adjustments + coupons)
  - `supabase/migrations/20260722097000_product_reviews.sql` (required for admin review moderation)
  - `supabase/migrations/20260722098000_admin_analytics.sql` (optional — analytics uses RPC when available, otherwise direct queries)
  - `supabase/migrations/20260722099000_store_settings.sql` (required for admin store/shipping/notification settings + admin display name)
  - `supabase/migrations/20260722100000_integration_credentials.sql` (required for Admin → Integrations encrypted credential storage)
  - `supabase/migrations/20260723093000_contact_messages.sql` (required for contact form)
  - `supabase/migrations/20260723101000_order_coupon_discount.sql` (required for coupon discount columns on orders)
  - `supabase/migrations/20260723110000_customer_cart_items.sql` (required for authenticated cart sync)
- [ ] Create at least one Auth user and insert a matching `admin_users` row (see below)
- [ ] Confirm Razorpay keys (use **test** keys until go-live) — via env **or** Admin → Integrations
- [ ] Set `NEXT_PUBLIC_SITE_URL` — use `https://YOUR_PROJECT.vercel.app` until a custom domain exists (no trailing slash)
- [ ] Set `INTEGRATIONS_ENCRYPTION_KEY` if you will save provider secrets in the Integrations UI (`openssl rand -base64 32`)
- [ ] Set `CRON_SECRET` for the inventory-release cron (`openssl rand -base64 32`)

---

## 2. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com) → **Add New Project** → import the repo.
3. Framework Preset: **Next.js** (auto-detected).
4. Build settings (defaults are fine):
   - **Build Command:** `next build` / `npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** leave empty (Next.js)
5. Add environment variables (section 3) for **Production** (and Preview if you want).
   - At minimum for a successful **build**, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (product SSG fetches at build time).
6. Deploy.

After the first deploy, copy the production URL (e.g. `https://ecommerce-website-xxxx.vercel.app`). Then:

1. Set `NEXT_PUBLIC_SITE_URL` to that URL (no trailing slash) and **redeploy**.
2. Update Supabase Auth Site URL / Redirect URLs (section 5).
3. Create the Razorpay webhook with that URL (section 7).

When you buy a domain later: Project → **Settings → Domains** → attach it, then update `NEXT_PUBLIC_SITE_URL`, Supabase Auth URLs, and the Razorpay webhook URL.

---

## 3. Environment variables (Vercel dashboard)

**Where:** Project → **Settings** → **Environment Variables**

Add each variable below. Prefer scoping secrets to **Production** only; use Preview/Development with test keys where possible.

| Variable | Required | Public? | Example / notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Yes | `https://your-project.vercel.app` or custom domain — sitemap, canonicals, Open Graph. No trailing slash. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | `https://YOUR_REF.supabase.co` — **project URL only**, never append `/rest/v1/` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No** | Supabase → API → `service_role` `secret` key. **Never** prefix with `NEXT_PUBLIC_`. Never commit. |
| `RAZORPAY_KEY_ID` | Yes | No* | Razorpay Dashboard → API Keys. Returned to the browser only via your create-order API. |
| `RAZORPAY_KEY_SECRET` | Yes | **No** | Razorpay secret. Server-only (verify signatures). |
| `RAZORPAY_WEBHOOK_SECRET` | Recommended (prod) | **No** | Created when you add a webhook (section 7). Can deploy first without it; client verify still works. Add before real traffic. |
| `RESEND_API_KEY` | Optional | **No** | Resend API key. If missing, email confirmation uses a stub logger. |
| `RESEND_FROM_EMAIL` | Optional† | No | e.g. `BOOK MY TEES <orders@yourdomain.com>` — must be a verified Resend sender/domain. |
| `TWILIO_ACCOUNT_SID` | Optional | **No** | Twilio Console → Account SID |
| `TWILIO_AUTH_TOKEN` | Optional | **No** | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Optional† | No | e.g. `whatsapp:+14155238886` (sandbox) or your approved WhatsApp sender |
| `INTEGRATIONS_ENCRYPTION_KEY` | Recommended‡ | **No** | 32-byte key, base64 (`openssl rand -base64 32`). Encrypts secrets saved in Admin → Integrations. Env provider vars remain a fallback when DB credentials are absent. |
| `CRON_SECRET` | Yes (prod) | **No** | Shared secret for Vercel Cron. Vercel sends `Authorization: Bearer ${CRON_SECRET}` to `/api/cron/release-stale-inventory` every 15 minutes. Generate with `openssl rand -base64 32`. |

\* `RAZORPAY_KEY_ID` is not a `NEXT_PUBLIC_` var; the client receives it from `/api/payments/razorpay/create-order`.  
† Required together with their API credentials if you want that channel live.  
‡ Required in production once you paste secrets in the Integrations UI. You can keep using env-only credentials without this key.

### How to set them in Vercel

1. Open the project in Vercel.
2. Go to **Settings → Environment Variables**.
3. For each row: enter **Key**, **Value**, choose environments (**Production** / **Preview** / **Development**), click **Save**.
4. Redeploy (**Deployments → … → Redeploy**) so new vars are picked up.

### Local `.env.local` reminder

Match the same keys locally. Never commit `.env` or `.env.local`. Use `.env.local.example` as a template.

---

## 4. Create the first admin user

Admin login requires both:

1. A Supabase Auth user (email/password)
2. A row in `public.admin_users`

```sql
-- After creating the user in Authentication → Users, paste their UUID:
insert into public.admin_users (auth_user_id, role)
values ('PASTE-AUTH-USER-UUID', 'admin');
```

The first row must be inserted with the SQL editor / service role because `admin_users` insert RLS only allows existing admins.

Sign in at `/admin/login`.

---

## 5. Supabase Auth (production)

In Supabase → **Authentication → URL configuration**:

- **Site URL:** your production origin, e.g. `https://your-project.vercel.app` (or custom domain later)
- **Redirect URLs:** include:
  - `https://your-project.vercel.app/**`
  - `http://localhost:3000/**` for local
  - custom domain `https://www.yourdomain.com/**` when you add one

---

## 6. RLS production safety audit

**Verdict: production-safe for anon writes.** RLS is enabled on all app tables. There are **no** `INSERT` / `UPDATE` / `DELETE` policies granted to the `anon` role on admin-only or customer-private tables.

### Tables

| Table | Anon read | Anon write | Notes |
|---|---|---|---|
| `categories` | Yes | **No** | Public catalog |
| `products` | Active only (after harden migration) | **No** | Writes: authenticated + `is_admin()` |
| `product_images` | Yes | **No** | Writes: authenticated + `is_admin()` |
| `customers` | **No** | **No** | Own row / admin only (`authenticated`) |
| `addresses` | **No** | **No** | Own / admin only |
| `orders` | **No** | **No** | Customers **SELECT** own only. Insert/update: admin RLS or **service role** (checkout/payments). Customers cannot update status/payment fields via PostgREST. |
| `order_items` | **No** | **No** | Customers **SELECT** via own orders. Insert/update/delete: admin or **service role** only. |
| `product_variants` | Active only (or admin) | **No** | Size/colour sellable stock. Writes: authenticated + `is_admin()` |
| `admin_users` | **No** | **No** | Own select / admin manage |

### Storage (`product-images`)

| Operation | Who |
|---|---|
| Public read | Anyone (public bucket) |
| Insert / update / delete | `authenticated` **and** `is_admin()` only |

### Privileged server writes

Checkout order creation, payment status updates, and confirmation notification lookups use `SUPABASE_SERVICE_ROLE_KEY` via `createAdminClient()` on the **server only**. That bypasses RLS by design — keep this key secret and never expose it to the browser.

### Hardening applied for deploy

Migration `20260721143000_harden_products_public_read.sql` replaces unrestricted product SELECT with:

`is_active = true OR is_admin()`

so inactive products are not publicly listable via the anon key.

Migration `20260722090000_harden_orders_rls.sql` removes customer insert/update on `orders` / insert on `order_items` so payment status and totals cannot be mutated via the anon/authenticated PostgREST client.

Migration `20260722091000_product_variants_and_inventory.sql` adds `product_variants`, variant snapshots on `order_items`, and `reserve_order_inventory` / `release_order_inventory` RPCs (service role).

---

## 7. Razorpay webhook (works without a purchased domain)

1. Deploy to Vercel and note the production URL: `https://YOUR_PROJECT.vercel.app`
2. In [Razorpay Dashboard](https://dashboard.razorpay.com) → **Settings → Webhooks** → create webhook.
3. **URL:** `https://YOUR_PROJECT.vercel.app/api/payments/razorpay/webhook`
4. **Events:** enable at least `payment.captured`
5. Copy the **webhook secret** into `RAZORPAY_WEBHOOK_SECRET` on Vercel (and local `.env.local` if testing), **or** paste it under Admin → Integrations → Razorpay
6. Redeploy so the env var is available (not needed if the secret is only stored via Integrations)

You can also copy the webhook URL from **Admin → Integrations → Razorpay** (built from `NEXT_PUBLIC_SITE_URL`).

Until the webhook is configured, checkout still works via the browser verify route. Add the webhook before taking real customer traffic (covers closed tabs / dropped network after pay).

When you switch to a custom domain, edit the webhook URL in Razorpay to match.

The webhook and the client verify route share the same idempotent mark-paid path. Inventory is reserved at order create and released on payment failure, admin cancel of unpaid/pending orders, or the stale-reservation cron (orders still `pending` + `inventory_reserved` after 45 minutes).

---

## 8. Stale inventory cron

[`vercel.json`](vercel.json) schedules `GET /api/cron/release-stale-inventory` every **15 minutes**. The route:

1. Requires `Authorization: Bearer ${CRON_SECRET}` (401 without it)
2. Finds orders with `payment_status = pending`, `inventory_reserved = true`, and `created_at` older than **45 minutes**
3. Marks each failed via `markOrderPaymentFailed` (releases reserved stock)

Set `CRON_SECRET` in Vercel **Production** before relying on this path. On Hobby plans, cron timing can drift; Pro is more precise — either is fine for soft launch stock recovery.

Manual check (local or prod):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_PROJECT.vercel.app/api/cron/release-stale-inventory
```

---

## 9. Post-deploy smoke test

1. `/` and `/products` load
2. Product detail + size/colour + Add to Cart
3. Checkout → Razorpay (test mode) → order confirmation
4. `/admin/login` → dashboard → products (variants) / orders
5. Confirm `/sitemap.xml` and `/robots.txt` resolve
6. Confirm `/api/health` returns `{ "status": "ok" }`
7. Confirm order confirmation email/WhatsApp stubs or live providers in server logs
8. After webhook is set: Razorpay test capture marks order paid without relying only on client verify
9. Abandon checkout (leave pending): after TTL or cron/fail path, stock returns; admin cancel of unpaid pending order releases reserved inventory

---

## 10. Common failures

| Symptom | Likely cause |
|---|---|
| `Invalid path specified in request URL` | `NEXT_PUBLIC_SUPABASE_URL` includes `/rest/v1/` — remove it |
| Admin login “no admin access” | Missing `admin_users` row for that Auth user |
| Image uploads fail | Storage migration not applied, or user is not in `admin_users` |
| Payment verify 500 | Missing `RAZORPAY_KEY_SECRET` |
| Webhook 500 / invalid signature | Missing or wrong `RAZORPAY_WEBHOOK_SECRET` |
| Insufficient stock / no variants | Phase 0 variants migration not applied, or product has no active variants |
| Wrong sitemap/OG URLs | Missing `NEXT_PUBLIC_SITE_URL` on Production (falls back to `VERCEL_URL` if unset) |
| Service role errors / empty admin data | `SUPABASE_SERVICE_ROLE_KEY` set to the **anon** key by mistake |
| Cron returns 401 | Missing/wrong `CRON_SECRET`, or request missing `Authorization: Bearer …` |

---

## 11. Security reminders

- Rotate any keys that were ever committed or shared in chat.
- Confirm in Vercel that `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `INTEGRATIONS_ENCRYPTION_KEY`, `CRON_SECRET`, Resend, and Twilio vars are **not** `NEXT_PUBLIC_`.
- Use Razorpay **live** keys only on Production; keep test keys for Preview/local until go-live.
- Never commit `.env` / `.env.local`.

---

## Soft-launch gate (Jul 25)

**Bar:** soft launch on `*.vercel.app` with Razorpay **test** keys (or live keys only if the client has activated them). All boxes below must be green before inviting real traffic.

### Database & admin

- [ ] All migrations applied through `20260723110000_customer_cart_items.sql` (full ordered list in section 1)
- [ ] `npm test` passes locally before deploy
- [ ] Health probes respond: `/api/livez` (200) and `/api/readyz` (200 when Supabase is reachable)
- [ ] At least one Auth user + matching `admin_users` row; sign-in works at `/admin/login`
- [ ] Admin can open orders, change status, and print a packing slip

### Production environment (Vercel)

- [ ] `NEXT_PUBLIC_SITE_URL` = production `https://YOUR_PROJECT.vercel.app` (no trailing slash)
- [ ] Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (and `RAZORPAY_WEBHOOK_SECRET` once webhook exists)
- [ ] `INTEGRATIONS_ENCRYPTION_KEY` set if using Admin → Integrations to store secrets (`openssl rand -base64 32`)
- [ ] `CRON_SECRET` set; cron route returns 200 with `Authorization: Bearer …` (section 8)
- [ ] Supabase Auth Site URL / Redirect URLs point at the production origin (section 5)

### Payments & inventory

- [ ] Razorpay webhook: `https://YOUR_PROJECT.vercel.app/api/payments/razorpay/webhook` with `payment.captured` (section 7)
- [ ] **Smoke — pay success:** product → cart → checkout → Razorpay test pay → order confirmation; order shows paid (client verify and/or webhook)
- [ ] **Smoke — abandon:** leave checkout pending → stock returns after fail route **or** 45‑minute TTL + cron
- [ ] **Smoke — admin cancel:** cancel an unpaid/pending reserved order → reserved stock releases immediately
- [ ] Inventory cancel path + stale cron verified once in staging or Production (not only locally)

### Catalog, legal, notifications

- [ ] ~15 products loaded with size/colour variants + stock (client photos when available)
- [ ] Legal pages live: `/privacy`, `/terms`, `/refund` + footer links
- [ ] Email / WhatsApp: **stub logger is OK for soft launch** if Resend/Twilio are not configured — confirm stubs appear in server logs on order confirmation; tell the client real email/WhatsApp need provider accounts (see Client blockers)
- [ ] Client explicitly accepts soft launch on `*.vercel.app` until a custom domain is purchased

### Code readiness already shipped (verify once after deploy)

- Inventory release on admin cancel of unpaid/pending reserved orders
- `releaseStaleReservedOrders` + `/api/cron/release-stale-inventory` + `vercel.json` every 15 minutes
- Middleware protects `/api/admin` (same `admin_users` gate as `/admin`)

---

## Client blockers

These are **not** code tasks. Soft launch can proceed on `*.vercel.app` without them; flag to the client before Jul 25.

| Blocker | Impact if missing |
|---|---|
| **Custom domain** (purchase + DNS) | Stay on `*.vercel.app`; update `NEXT_PUBLIC_SITE_URL`, Supabase Auth URLs, and Razorpay webhook when ready |
| **Product photos / descriptions** | Catalog can use placeholders; replace before marketing push |
| **Razorpay live keys** | Soft launch can use **test** mode; switch to live keys + live webhook secret before real charges |
| **Resend / Twilio** | Order confirmation email/WhatsApp stay as **server stubs** until accounts + verified sender / WhatsApp number are provided |

Lawyer-reviewed legal copy is post-launch; published templates are live for soft launch and marked for client review in `PROJECT_BRIEF.md`.
