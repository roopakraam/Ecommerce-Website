# Deployment guide (Vercel + Supabase)

This project is a **Next.js 14 App Router** app. Vercel detects Next.js automatically — a `vercel.json` is **not required**. Framework settings, builds, and serverless routing are handled by the Vercel Next.js runtime.

---

## 1. Pre-flight checklist

- [ ] Run both SQL migrations in the Supabase SQL editor (or via CLI):
  - `supabase/migrations/20260721133000_initial_ecommerce_schema.sql`
  - `supabase/migrations/20260721140000_product_images_storage.sql`
  - `supabase/migrations/20260721143000_harden_products_public_read.sql`
- [ ] Create at least one Auth user and insert a matching `admin_users` row (see below)
- [ ] Confirm Razorpay keys (test or live) and webhook/callback domains if used
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain (no trailing slash)

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
6. Deploy.

After the first deploy, open **Project → Settings → Domains** and attach your custom domain. Then update `NEXT_PUBLIC_SITE_URL` to that domain and redeploy.

---

## 3. Environment variables (Vercel dashboard)

**Where:** Project → **Settings** → **Environment Variables**

Add each variable below. Prefer scoping secrets to **Production** only; use Preview/Development with test keys where possible.

| Variable | Required | Public? | Example / notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Yes | `https://www.bookmytees.com` — used for sitemap, canonicals, Open Graph. No trailing slash. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | `https://YOUR_REF.supabase.co` — **project URL only**, never append `/rest/v1/` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No** | Supabase → API → `service_role` `secret` key. **Never** prefix with `NEXT_PUBLIC_`. Never commit. |
| `RAZORPAY_KEY_ID` | Yes | No* | Razorpay Dashboard → API Keys. Returned to the browser only via your create-order API. |
| `RAZORPAY_KEY_SECRET` | Yes | **No** | Razorpay secret. Server-only (verify signatures). |
| `RESEND_API_KEY` | Optional | **No** | Resend API key. If missing, email confirmation uses a stub logger. |
| `RESEND_FROM_EMAIL` | Optional† | No | e.g. `BOOK MY TEES <orders@yourdomain.com>` — must be a verified Resend sender/domain. |
| `TWILIO_ACCOUNT_SID` | Optional | **No** | Twilio Console → Account SID |
| `TWILIO_AUTH_TOKEN` | Optional | **No** | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Optional† | No | e.g. `whatsapp:+14155238886` (sandbox) or your approved WhatsApp sender |

\* `RAZORPAY_KEY_ID` is not a `NEXT_PUBLIC_` var; the client receives it from `/api/payments/razorpay/create-order`.  
† Required together with their API credentials if you want that channel live.

### How to set them in Vercel

1. Open the project in Vercel.
2. Go to **Settings → Environment Variables**.
3. For each row: enter **Key**, **Value**, choose environments (**Production** / **Preview** / **Development**), click **Save**.
4. Redeploy (**Deployments → … → Redeploy**) so new vars are picked up.

### Local `.env.local` reminder

Match the same keys locally. Never commit `.env.local`. Use `.env.local.example` as a template.

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

- **Site URL:** your production origin, e.g. `https://www.bookmytees.com`
- **Redirect URLs:** include `https://www.bookmytees.com/**` and `http://localhost:3000/**` for local

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
| `orders` | **No** | **No** | Own / admin only |
| `order_items` | **No** | **No** | Own (via order) / admin only |
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

---

## 7. Post-deploy smoke test

1. `/` and `/products` load
2. Product detail + Add to Cart
3. Checkout → Razorpay (test mode) → order confirmation
4. `/admin/login` → dashboard → products / orders
5. Confirm `/sitemap.xml` and `/robots.txt` resolve
6. Confirm order confirmation email/WhatsApp stubs or live providers in server logs

---

## 8. Common failures

| Symptom | Likely cause |
|---|---|
| `Invalid path specified in request URL` | `NEXT_PUBLIC_SUPABASE_URL` includes `/rest/v1/` — remove it |
| Admin login “no admin access” | Missing `admin_users` row for that Auth user |
| Image uploads fail | Storage migration not applied, or user is not in `admin_users` |
| Payment verify 500 | Missing `RAZORPAY_KEY_SECRET` |
| Wrong sitemap/OG URLs | Missing `NEXT_PUBLIC_SITE_URL` on Production |
| Service role errors / empty admin data | `SUPABASE_SERVICE_ROLE_KEY` set to the **anon** key by mistake |

---

## 9. Security reminders

- Rotate any keys that were ever committed or shared in chat.
- Confirm in Vercel that `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, Resend, and Twilio vars are **not** `NEXT_PUBLIC_`.
- Use Razorpay **live** keys only on Production; keep test keys for Preview/local.
