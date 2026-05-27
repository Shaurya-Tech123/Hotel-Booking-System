# Advanced Hotel Management System (MERN) Blueprint

## 1) Complete System Architecture

- Frontend: React + Redux Toolkit (auth/ui state) + React Query (server state), charting for admin dashboards.
- Backend: Node.js + Express (recommended), layered MVC modules, centralized error handling, rate limiter, request validation.
- Data: MongoDB with collections for users, rooms, bookings, payments, invoices, reviews, notifications, loyalty, service, maintenance, audit logs.
- Realtime: Socket.io for room status, booking updates, service workflow events.
- External services: Payment gateway (Stripe or Razorpay), email gateway (SMTP/SendGrid), optional queue (BullMQ + Redis) for async jobs.

## 2) Database Schema Design

- `users`: role (`ADMIN`/`CUSTOMER`), password hash, refresh token metadata, loyalty points balance.
- `rooms`: room type/category, capacity, amenities, current status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`), base price.
- `bookings`: customer, room type/room id, check-in/check-out, dynamic price snapshot, payment status, cancellation/refund state.
- `payments`: provider (`STRIPE`/`RAZORPAY`), transaction id, amount, status, refund references.
- `invoices`: booking reference, invoice number, tax breakdown, final amount, PDF URL/object key.
- `reviews`: user + booking + room + rating + comment.
- `notifications`: user, channel (`EMAIL`, `IN_APP`), read state, payload.
- `serviceRequests`: user/room, category, priority, status, SLA timestamps.
- `maintenanceTickets`: room/issue/severity/assignment/status.
- `auditLogs`: actor, action, entity, before/after snapshot hash, timestamp.
- `loyaltyLedger`: user, booking, points delta, reason.

## 3) API Routes Structure

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- Rooms and Pricing:
  - `GET /api/rooms/availability`
  - `GET /api/rooms/:id`
- Bookings:
  - `POST /api/bookings`
  - `GET /api/bookings`
  - `PATCH /api/bookings/:id/cancel`
  - `GET /api/bookings/:id/invoice`
- Payments:
  - `POST /api/payments/create-order`
  - `POST /api/payments/webhook`
  - `POST /api/payments/:id/refund`
- Reviews:
  - `POST /api/reviews`
  - `GET /api/reviews`
- Notifications:
  - `GET /api/notifications`
  - `PATCH /api/notifications/:id/read`
- Service and Maintenance:
  - `POST /api/services/requests`
  - `PATCH /api/services/requests/:id`
  - `POST /api/maintenance/tickets`
- AI + Analytics:
  - `GET /api/ai/recommendations`
  - `GET /api/admin/analytics`
  - `GET /api/admin/audit-logs`
  - `GET /api/calendar/bookings`

## 4) Recommended Folder Structure

```txt
hotel-management-system/
  frontend/
    src/
      app/                  # redux store
      features/
        auth/
        bookings/
        rooms/
        payments/
        analytics/
      services/             # react-query api clients
      components/
      pages/
      hooks/
      utils/
  backend/
    src/
      config/
      modules/
        auth/
        users/
        rooms/
        bookings/
        payments/
        invoices/
        reviews/
        notifications/
        analytics/
        maintenance/
        loyalty/
      middlewares/
      sockets/
      shared/
    tests/
    server.js
```

## 5) ER Diagram Explanation

- One `User` has many `Bookings`, `Reviews`, `Notifications`, and `LoyaltyLedger` records.
- One `Booking` belongs to one `User`, references one `Room`/room type, and has one `Payment` and one `Invoice`.
- One `Room` has many `Bookings`, many `ServiceRequests`, and many `MaintenanceTickets`.
- `AuditLog` captures actions across all entities with actor linkage to `User`.

## 6) Scaling Strategy

- Horizontal scale API behind load balancer.
- Move realtime session state to Redis adapter for Socket.io.
- Add MongoDB indexes:
  - bookings: `{ roomId: 1, checkin: 1, checkout: 1, status: 1 }`
  - users: `{ email: 1 } unique`
  - reviews: `{ roomId: 1, createdAt: -1 }`
  - auditLogs: `{ actorId: 1, createdAt: -1 }`
- Queue heavy jobs: invoice PDF generation, email notifications, analytics rollups, ML retraining.
- Use caching (Redis) for availability windows and analytics snapshots.

## 7) Security Best Practices

- Hash passwords with bcrypt and strict policy checks.
- Store refresh tokens securely and rotate on refresh.
- JWT short expiry + role-based authorization middleware.
- Validate all payloads with Joi/Zod.
- Apply rate limiting to auth and payment routes.
- Add Helmet, CORS allowlist, secure cookies, and webhook signature checks.
- Mask PII in logs and enforce audit trail integrity.

## Current Implementation in This Repository

- `backend/server.js` now includes:
  - Role-based auth (`ADMIN`/`CUSTOMER`)
  - Access token + refresh token flow
  - Real-time room status stream (SSE foundation)
  - Booking create/cancel + refund logic
  - Invoice payload endpoint
  - AI recommendation endpoint
  - Predictive analytics endpoint
  - Room service requests
  - Maintenance ticketing
  - Audit logs
  - Loyalty points ledger

- Data is currently persisted in `backend/data/hms-db.json` for local development speed.
- For strict MERN production deployment, replace file persistence with MongoDB models while preserving route contracts.
