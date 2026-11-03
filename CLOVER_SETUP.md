# Clover Payments Setup — Shadab

## Current state (already built)
Both cart checkout and reservations already send the customer to Clover's hosted payment page:

- **Orders:** `lib/services/cloverCheckout.ts` → `server/src/routes/clover.ts` creates a Clover Hosted Checkout session and sends the browser to `checkout.clover.com`.
- **Reservations:** `lib/services/reservationCheckout.ts` → `server/src/routes/reservation.ts`. Same flow, charging the 100% prepay plus 10.75% tax.
- **Webhook:** the `/api/clover/webhook` route marks orders or reservations as paid or declined after Clover confirms the payment.

The remaining work is credentials and setup, plus one decision.

## Decision: which Clover product?
- **Clover Hosted Checkout** (built now, recommended): customers use the Shadab menu and cart and only pay on Clover's page. Reservations, delivery fees, loyalty, promos and order tracking keep working.
- **Clover Online Ordering** (separate `clover.com/online-ordering/...` storefront): has its own menu and cart. "Order" would just link out to Clover. This loses our cart, delivery pricing, loyalty and tracking, and it can't take buffet reservations. Reservations would still need Hosted Checkout.

## What's needed from the Clover merchant dashboard
1. **Merchant ID** for the Devon Ave location (`chicago-il`).
2. **Private API key (token)**, from Setup → Ecommerce → Ecommerce API Tokens. Must be the **private** key, not the public one.
3. **Hosted Checkout signing secret**, from Ecommerce → Hosted Checkout → Webhook.
4. In the same Hosted Checkout settings page:
   - Webhook URL: `https://shadab-api.onrender.com/api/clover/webhook` (or the real API host).
   - Redirect URLs: leave **blank**, or set them to `https://shadab.io/...`. Dashboard redirects override the ones the code sends.
5. **Optional:** a `pageConfigUuid` for a custom-branded checkout page, and whether to collect tips on Clover (`CLOVER_TIPS_ENABLED`).
6. **Hosting:** confirm the API stays on Render (`shadab-api`) or moves to Cloud Functions next to Firebase Hosting, and who sets the env vars there.

## Where the secrets go
**Never paste the private key or signing secret into chat or commit them.** Put them in `server/.env` locally and in Render's env settings, as one line:

```
CLOVER_LOCATIONS_JSON={"chicago-il":{"merchantId":"...","privateKey":"...","webhookSecret":"..."}}
```

Also set:
```
CLOVER_API_BASE_URL=https://api.clover.com
CLOVER_SITE_URL=https://shadab.io
```

## Code-side follow-ups
- `server/.env.example` points `CLOVER_SUCCESS_URL` / `CLOVER_FAILURE_URL` at `https://www.shadab.com/`, but the site is `shadab.io`. If copied into production, customers land on the wrong domain after paying. Fix to `https://shadab.io/`.
- Run a $1 test order and a test reservation end to end, and confirm the webhook marks both as paid.
