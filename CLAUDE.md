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
- Delivery fee is **recomputed server-side** at order creation (never trusted from the client); delivery-only $20 minimum order and fixed 5:00pm–11:30pm window
- Buffet timing computed in **America/Chicago** timezone using `date-fns-tz`
- `isWeekend` = Saturday only (Sunday is closed); Saturday buffet = $24.99, Mon–Fri = $17.99
- Auth prompt appears only at checkout, never blocks browsing or cart
- Single active location: `chicago-il` (see `constants/staticLocations.ts`) — real street address/phone are placeholders pending confirmation

## Important Files
- `constants/theme.ts` — all colors, spacing, fonts, border radius
- `constants/buffet.ts` — `BUFFET_PRICING`, `BUFFET_HOURS`, `BUFFET_DAYS`
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
- Real street address, phone, and hours for the Chicago location (`constants/staticLocations.ts`, `constants/config.ts`)
- Real admin email(s) — replace the `admin@shadab.com` placeholder in `firestore.rules`, `lib/adminAuth.ts`, `functions/src/admin/isAdmin.ts`
- Clover merchant credentials (`CLOVER_LOCATIONS_JSON` or per-location env vars — see `.env.clover.local.example` / `server/.env.example`)
- Firebase config values in `.env` (copy from `.env.example`)
- Real menu items/prices/photos — currently carried over from Deccan Bawarchi as placeholders (`constants/staticMenu.ts`, `assets/`)
- Brand assets — logo, icon, splash image, hero photography (still Deccan Bawarchi's placeholders in `assets/` and `Photos/`)
