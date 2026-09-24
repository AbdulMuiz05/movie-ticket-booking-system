# Movie Ticket Booking System

Full-stack MERN movie ticket booking platform built from scratch for the Dev Weekends Full Stack AI Engineering Fellowship.

## Stack
React + Vite + Tailwind CSS, Node.js + Express, MongoDB + Mongoose, JWT authentication, Stripe, TMDB, Vitest/Supertest.

## Features
- Movie discovery, search, filtering, details, cast, trailers and favorites
- Cinema, screen, date and show selection
- Show-specific interactive seat availability
- 10-minute temporary seat reservations and atomic double-booking protection
- Stripe PaymentIntent/payment verification architecture and retry for eligible pending bookings
- Booking confirmation and My Bookings
- USER/ADMIN roles with backend authorization and frontend route guards
- Admin dashboard for movies, cinemas, screens, seats, shows, bookings and users
- Expired-reservation background sweep and deployment-friendly jobs endpoint
- Responsive UI and Vercel-ready frontend/backend configuration

## Setup
1. Copy `server/.env.example` to `server/.env` and configure MongoDB, JWT, Stripe, client URL and optional TMDB/email variables.
2. Copy `client/.env.example` to `client/.env`.
3. Run `npm install` inside `server` and `client`.
4. Run `npm run seed` in `server` to create demo data.
5. Start backend with `npm run dev` and frontend with `npm run dev`.

## Test/build
- `cd server && npm test`
- `cd client && npm run build`

Never commit `.env` files or secrets. Configure Stripe webhook delivery to `/api/payments/webhook` in production.
