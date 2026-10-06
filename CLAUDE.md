@AGENTS.md

# Shadab — Claude Code Guide

## What this is
Full-stack restaurant ordering website for Shadab, an authentic Hyderabadi cuisine restaurant in Chicago, IL. Built with **Expo SDK 56 + React Native Web** — **web is the launch target** (Firebase Hosting). iOS/Android are not in scope for launch; the codebase still uses Expo/RN primitives that compile to the browser.

Forked from the Deccan Bawarchi codebase and re-themed; feature set is the same (menu, cart, checkout, self-delivery, buffet, reservations, catering, loyalty, order tracking, admin dashboard).

## Tech Stack
- **Expo SDK 56** + **Expo Router** (file-based routing, `app/` directory)
- **Firebase**: Auth, Firestore, Storage, Cloud Functions, Hosting (project `shadab-5c64e`)
- **Zustand** for cart/auth/order/notification state
- **TanStack Query** for server state & caching
- **Clover** Hosted Checkout for payments (server-only, via `server/` + Cloud Functions webhook) — no Stripe, no DoorDash
- **Self-delivery** — in-house drivers, distance-based fee (free ≤1mi, $1/mi after), free US Census geocoding
- **NativeWind** (Tailwind) + custom theme (`constants/theme.ts`)
- **Design**: Nizami Emerald — `#0d2b22` bg, `#1e5a45` surface, `#c9a24b` gold accent, `#f3ead9` ivory text

## Key Invariants
- All money stored as **integers in cents** in Firestore; displayed as formatted dollars in UI
- Loyalty points awarded **server-side only** in Cloud Function when an order reaches its terminal status: `'delivered'` for delivery orders, `'picked_up'` for pickup orders (pickup has no separate delivery event)
- All Firestore writes involving money use **transactions**
- Clover credentials **never** in client code — `server/` and Cloud Functions only
- Delivery fee is **recomputed server-side** at order creation (never trusted from the client); delivery-only $20 minimum order. Dine-in, pickup, and delivery are **open 24 hours**
- Buffet meals, prices, grand opening week (Fri Oct 16 – Thu Oct 22, 2026), reservation pricing, and cancellation policy live in `constants/buffetSchedule.ts` — an identical copy is in `server/src/lib/buffetSchedule.ts`; edit both
- Buffet runs every day in **America/Chicago**: breakfast 7:00–12:30 ($9.99), lunch 1:00–4:00 ($19.99, $12.99 opening week), dinner 6:00 PM–1:00 AM ($24.99, $14.99 opening week). Dinner after midnight belongs to the previous day's service. Opening day is dinner only
- Reservations prepay 100% of the buffet + 10.75% Chicago tax (kids 5–10 half, under 5 free); no daily cap. Cancellation: free 48h+ before seating, else 20% kept — cancelled by phone, staff cancel in admin and refund in Clover
- Tax rate 10.75% is duplicated in `buffetSchedule.ts`, `lib/services/cartService.ts`, `server/src/lib/cartTotals.ts`
- Auth prompt appears only at checkout, never blocks browsing or cart
- Single active location: `chicago-il` — 2309-11 W Devon Ave, Chicago, IL 60659 · (877) 742-3222 · https://shadab.io (see `constants/config.ts`)

## Important Files
- `constants/theme.ts` — all colors, spacing, fonts, border radius
- `constants/buffet.ts` — re-exports `buffetSchedule.ts` plus buffet highlights, mutton specialties, student discount
- `constants/config.ts` — business hours, loyalty config, default location
- `constants/staticLocations.ts` — the Chicago location record
- `lib/firebase.ts` — Firebase init (Auth, Firestore, Storage)
- `hooks/useBuffet.ts` — live Firestore listener + Chicago timezone logic
- `server/src/lib/cloverLocations.ts` — Clover per-location credential resolution
- `store/cartStore.ts` — cart (items, promo, loyalty, gift card, tip)
- `store/authStore.ts` — Firebase user + profile + admin flag
- `firestore.rules` — security rules (admin email allowlist lives here — keep in sync with `lib/adminAuth.ts` and `functions/src/admin/isAdmin.ts`)

## Entry Point
`main` in `package.json` is `expo-router/entry`. Screens live in `app/`.

## Running Locally
```bash
npm run web
npm run build

cd functions && npm install && npm run serve
cd server && npm install && npm run dev
```

## Deploy Web
Run these as **separate commands** (do not paste inline `#` comments on the same line):

```bash
npm run build
firebase deploy --only hosting
```

## Seeding Firestore
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npm run seed
```

## Still TODO before launch
- Real admin email(s) — replace the `admin@shadab.com` placeholder in `firestore.rules`, `lib/adminAuth.ts`, `functions/src/admin/isAdmin.ts`
- Clover merchant credentials (`CLOVER_LOCATIONS_JSON` or per-location env vars — see `.env.clover.local.example` / `server/.env.example`)
- Firebase config values in `.env` (copy from `.env.example`)
- Real menu items/prices/photos — currently carried over from Deccan Bawarchi as placeholders (`constants/staticMenu.ts`, `assets/`)
- Brand assets — transparent logo, icon, splash image (still Deccan Bawarchi's placeholders in `assets/`); flyer artwork crops are in `assets/flyers/`
