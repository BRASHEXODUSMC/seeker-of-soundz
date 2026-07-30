# Hosting and Main Server Installation

## Shared hosting (cPanel/Plesk)
Upload the extracted contents into `public_html`. Confirm `index.html` is at the web root, preserve `css`, `js`, `assets`, and `specials`, then enable the host's free SSL certificate. Static hosting alone cannot safely process payment webhooks or share browser-stored collaboration data.

## VPS
Install Node.js 20+, place the website behind Nginx or Apache, and run `server/payment-webhook-example.js` with a process manager. Put secrets in server environment variables—never in front-end JavaScript. Proxy `/api/` to the Node service and restrict CORS to your domain.

## Production requirements
Use a database for users/roles/purchases, object storage for audio, HTTPS, server-side sessions, backups, rate limiting, email verification, and webhook signature verification.
