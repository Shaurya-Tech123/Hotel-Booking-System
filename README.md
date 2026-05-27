# Hotel Booking System

Full-stack hotel booking application with separate **Admin** and **User** portals, JWT authentication, MongoDB storage, and PDF invoice generation.

## Tech Stack

- **Frontend:** React (Vite), Redux Toolkit, React Router, React Toastify, Axios
- **Backend:** Node.js, Express.js, Mongoose, JWT, bcryptjs, PDFKit
- **Database:** MongoDB (`hotel_booking_db`)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally

### Backend

```bash
cd backend
npm install
npm start
```

API runs at `http://localhost:5000` (configured in `backend/.env`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI runs at `http://localhost:5173` with API proxy to the backend.

## Features

- Separate admin/user registration & login (username + password)
- JWT auth with persisted sessions
- Admin: add/edit/delete hotels, manage room categories, pricing, features, availability
- **Image upload** (multer) for hotel & room photos with preview
- **Analytics dashboard** (Recharts): revenue, bookings, top hotels/rooms/cities/features
- **Interactive star ratings** (1–5) on reviews with average rating display
- User: search by city & dates, book rooms, add reviews, download PDF bills
- All prices in INR

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/admin/auth/register` | Admin registration |
| `POST /api/admin/auth/login` | Admin login |
| `POST /api/user/auth/register` | User registration |
| `POST /api/user/auth/login` | User login |
| `GET/POST/PUT/DELETE /api/hotels` | Hotel management (admin) |
| `GET /api/bookings/search` | Search hotels (user) |
| `POST /api/bookings` | Create booking (user) |
| `GET /api/bookings/:id/bill` | Download PDF bill (user) |
| `POST /api/reviews` | Add review (user) |
| `GET /api/reviews/hotel/:hotelId/stats` | Rating stats for a hotel |
| `POST /api/admin/uploads/hotel` | Upload hotel images (admin) |
| `POST /api/admin/uploads/room` | Upload room images (admin) |
| `GET /api/admin/analytics/dashboard` | Analytics data (admin) |
