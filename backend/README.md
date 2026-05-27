# Advanced HMS Backend (Express + MongoDB + Socket.io)

## Run

1. Copy env values:

   - `cp .env.example .env` (or create `.env` manually on Windows)

2. Start MongoDB locally (default URI in `.env.example`).

3. Start backend:

   - `npm install`
   - `npm run dev`

Backend starts on `http://localhost:3000`.

## Major APIs

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
- Booking:
  - `GET /api/rooms/availability`
  - `POST /api/payments/create-order`
  - `POST /api/bookings`
  - `PATCH /api/bookings/:id/cancel`
  - `GET /api/bookings/:id/invoice`
- Reviews/Service/Maintenance:
  - `POST /api/reviews`
  - `POST /api/services/requests`
  - `POST /api/maintenance/tickets`
- Analytics:
  - `GET /api/admin/analytics`
  - `GET /api/admin/audit-logs`
  - `GET /api/calendar/bookings`

## Realtime

- Socket.io is enabled in `src/server.js`.
- Current broadcast event: `room:status:update`.

## Payments

- `POST /api/payments/create-order` creates an order abstraction for Stripe/Razorpay/manual modes.
- If Stripe/Razorpay keys are not configured, payment mode runs in `SIMULATED`.
- Cancellation flow writes a refund payment record and links to original transaction metadata.

