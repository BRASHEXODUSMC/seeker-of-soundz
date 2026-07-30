# Purchase and VIP Automation

The included website remains a static demonstration. Secure automatic access requires a server endpoint.

## Recommended flow
1. A signed-in user starts checkout with their immutable user ID in payment metadata.
2. Stripe/Tebex/Lemon Squeezy/PayPal sends a webhook to your server.
3. The server verifies the provider signature and event ID.
4. The server records the purchase idempotently.
5. For a VIP product, set `paidMember=true` and grant Music Vault access. For a song, create an entitlement for that product.
6. The account refreshes access after sign-in.
7. Keep the existing Admin Hub paid-access toggle as a recovery/manual override.

Never trust a browser success page as proof of payment. Never expose secret/API keys in `js/backend-config.js`.

See `server/payment-webhook-example.js` and `.env.example`. Replace the in-memory placeholder functions with your real database adapter before taking payments.
