# Production Audit Summary — BOOK MY TEES

**Date:** 23 Jul 2026  
**Stack:** Next.js 14 App Router · TypeScript · Supabase · Razorpay · Tailwind · Vitest

---

## 1. Architecture overview

| Layer | Role |
|---|---|
| `app/(storefront)` | Catalog, cart, checkout, account, legal, contact |
| `app/(admin)` | Products, orders, inventory, discounts, reviews, settings, integrations |
| `app/api` | Orders, cart, coupons, Razorpay (create/verify/fail/webhook), cron, health, admin CSV export |
| `lib/db` + `lib/actions` | All database access and server mutations |
| `lib/checkout` | Shared order totals + coupon math |
| `supabase/migrations` | Schema, RLS, inventory RPCs, coupons, cart, reviews |

### Verified business workflows

1. **Browse → cart** — Guest Zustand cart; authenticated sync via `/api/cart` + `cart_items`
2. **Checkout → reserve** — Login-gated create order, aggregate line items, validate stock, reserve inventory RPC
3. **Pay → confirm** — Razorpay create-order → client checkout → signature verify **and** amount/currency fetch → mark paid; webhook `payment.captured` as backup
4. **Fail / abandon** — Soft-fail keeps stock reserved; stale cron (45m) **cancels** unpaid reserved orders and releases stock
5. **Coupons** — Preview + re-validate at create; **usage incremented only on paid capture**
6. **Admin** — Status transitions, refund (DB claim-then-Razorpay), packing slip, inventory, reviews
7. **Notifications** — Resend / Twilio with stubs when unset

### Roles

- **Customer:** Supabase Auth + `customers` row; `/checkout` and `/account` middleware-protected
- **Admin:** Auth + `admin_users` row; UI and `/api/admin/*` gated

---

## 2. Critical bugs caught and fixed

| Severity | Issue | Fix |
|---|---|---|
| **CRITICAL** | Soft payment fail / dismiss released inventory while payment could still capture → oversell | Soft-fail no longer releases stock; confirm re-reserves if needed; cron **cancels** stale unpaid orders before release |
| **CRITICAL** | Coupon `usage_count` / per-customer limit burned on unpaid create+abandon | Increment only in `confirmOrderPaymentPaid`; usage counts only `payment_status=paid` |
| **HIGH** | Verify/webhook never checked Razorpay amount/currency | `validateRazorpayPaymentAgainstOrder` + payment fetch on verify; webhook entity amount check |
| **HIGH** | Concurrent Razorpay create-order could orphan payment ids | `setOrderPaymentReferenceIfEmpty` + reuse winner’s `order_*` |
| **HIGH** | Retry pay after fail without stock hold | Create-order re-reserves when `inventory_reserved=false` (409 if unavailable) |
| **HIGH** | Admin double-click could issue two Razorpay refunds | Claim `payment_status=refunded` first; revert if Razorpay fails |
| **HIGH** | DB Razorpay secrets with empty webhook secret blocked env fallback | Merge `webhook_secret` with `RAZORPAY_WEBHOOK_SECRET` |
| **MEDIUM** | Duplicate variant lines in checkout | Aggregate by `variantId` before stock/insert |
| **MEDIUM** | Free shipping used pre-discount subtotal | Threshold uses post-discount taxable merchandise |
| **MEDIUM** | Open-redirect via `/\…` in `safeNextPath` | Block backslashes and `://` |
| **MEDIUM** | Invalid coupon date strings skipped window checks | Invalid dates now fail closed |
| **LOW** | `formatPrice` dropped paise; CSV filename injection; cron timing-unsafe compare | 2 decimal INR; sanitize filename; `timingSafeEqual` for cron Bearer |

Also: checkout email/phone validation, max 50 cart lines, account middleware protection, structured JSON logging helper, standardized API error helper.

---

## 3. Security, performance, reliability

### Security
- Payment routes remain owner/admin gated (IDOR-safe)
- Webhook HMAC + timing-safe compare; amount match required
- Cron fail-closed without `CRON_SECRET`; constant-time Bearer compare
- No secrets in repo; `.env.local.example` documents all vars
- Open-redirect hardening on post-login `next`

### Reliability
- Inventory held through soft cancel; terminal abandon via cron cancel
- Payment confirm idempotent; rejects cancelled orders
- Refund optimistic lock before external API
- Health: `/api/livez` (liveness), `/api/readyz` (Supabase readiness), `/api/health` / `/api/healthz` aliases

### Observability
- `lib/logger.ts` — structured JSON logs with optional `traceId`
- Payment/cron/order paths emit structured warn/error events

### Tests
- Vitest suite covering totals, coupons, signatures, payment amount guards, validations, crypto, utils
- **51+ tests, all passing** via `npm test`

---

## 4. Running tests

```bash
npm install
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # coverage report (optional; install @vitest/coverage-v8 if needed)
npm run lint
npm run build
```

---

## 5. Safe production deploy

1. Apply **all** SQL migrations in order through `20260723110000_customer_cart_items.sql` (see `DEPLOYMENT.md`).
2. Set env vars from `.env.local.example` on Vercel (Production):
   - Supabase URL / anon / **service role**
   - Razorpay key id, secret, **webhook secret**
   - `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `INTEGRATIONS_ENCRYPTION_KEY`
   - Optional: Resend / Twilio
3. Create admin: Auth user + `admin_users` row.
4. Razorpay webhook → `https://YOUR_HOST/api/payments/razorpay/webhook` event `payment.captured`.
5. Confirm Vercel cron hits `/api/cron/release-stale-inventory` with Bearer `CRON_SECRET`.
6. Smoke test:
   - `GET /api/livez` → 200
   - `GET /api/readyz` → 200
   - Place test order with Razorpay **test** keys end-to-end
   - Dismiss modal → stock still held → retry succeeds
   - Wait/simulate stale cron → unpaid order cancelled, stock restored
7. Soft-launch gate: client content (photos, legal review), live Razorpay keys, custom domain — see `PROJECT_BRIEF.md` / `DEPLOYMENT.md`.

---

## 6. Known residual risks / follow-ups

- Coupon global `usage_count` still has a small race under extreme parallelism (optimistic CAS helps; prefer DB RPC for absolute atomicity).
- Cart replace is still delete-then-insert (compensate on insert failure is partial); a single transactional RPC would harden further.
- Fine-grained admin RBAC (`super_admin` vs `admin`) is unused — single-admin product.
- Email/WhatsApp remain stubbed until Resend/Twilio are configured.
- No Playwright E2E in CI yet — add when staging env + test keys are available.
- Next.js graceful shutdown is platform-managed on Vercel (no long-lived DB pool to drain in-process).

---

## 7. Key files touched in this audit

- `lib/db/orders.ts` — soft-fail / abandon / confirm / payment-reference race
- `lib/db/coupons.ts`, `app/api/orders/create/route.ts` — coupon usage on pay
- `app/api/payments/razorpay/*` — amount checks, re-reserve, webhook harden
- `lib/db/admin-orders.ts` — refund claim lock
- `lib/payments/validate-razorpay-payment.ts`, `lib/logger.ts`, `app/api/livez|readyz|healthz`
- `vitest.config.ts`, `**/*.test.ts`, `package.json` scripts
