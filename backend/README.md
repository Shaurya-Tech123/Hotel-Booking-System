# LuxuryStay Backend (Node http)

This backend provides a single endpoint:
- `POST /api/bookings` - saves bookings to `backend/data/bookings.json`
- `GET /api/bookings` - returns stored bookings (debug/admin)
- (Optional) `POST /api/admin/login` - returns an admin token when admin credentials are configured

## Run

From the `backend` folder:

`node server.js`

Server listens on `http://localhost:3000` by default.

## Optional Admin Auth

If you want `GET /api/bookings` to be protected, configure these environment variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (preferred) or `ADMIN_PASSWORD_HASH`

Example (PowerShell):

`$env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="change-me"; node server.js`

Then use the Admin panel with `?admin=1` in your URL.

