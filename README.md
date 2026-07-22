# BOOK MY TEES

Next.js e-commerce storefront and admin portal for **BOOK MY TEES** (apparel).

**Stack:** Next.js 14 App Router · TypeScript · Supabase · Tailwind CSS · Razorpay · Resend / Twilio (optional notifications)

## Features

- Storefront: catalog, size/colour variants, cart, authenticated checkout, Razorpay payments
- Admin: products (with variants + images), orders, dashboard KPIs
- Inventory reservation on order create; webhook + client verify for payment confirmation

## Local development

1. Copy env template and fill values:

```bash
cp .env.local.example .env.local
```

2. Apply SQL migrations in Supabase (see [DEPLOYMENT.md](./DEPLOYMENT.md)).

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: `/admin/login`.

## Deploy to Vercel

Full checklist (env vars, migrations, webhook without a custom domain, smoke tests): **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

Quick path:

1. Push this repo to GitHub.
2. Import in Vercel → Framework: Next.js.
3. Add environment variables from `.env.local.example` (required ones in DEPLOYMENT.md §3).
4. Deploy. Use the `*.vercel.app` URL until a custom domain is purchased.
5. Point Razorpay webhook at `https://YOUR_PROJECT.vercel.app/api/payments/razorpay/webhook`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Project layout

```
app/           # App Router (storefront + admin + API)
components/    # UI
lib/           # db, supabase, razorpay, validations, notifications
supabase/      # SQL migrations
types/         # TypeScript domain types
```
