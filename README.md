# Movie Ticket Booking System

Full-stack MERN movie ticket booking platform built from scratch for the Dev Weekends Full Stack AI Engineering Fellowship.

## Stack

React + Vite + Tailwind CSS, Node.js + Express, MongoDB + Mongoose, JWT authentication, Stripe, TMDB, Vitest/Supertest.

## Movie Data Architecture

Movie information is fetched directly from TMDB through the backend API.

MongoDB stores application data such as:

- Users
- Cinemas
- Screens
- Seats
- Shows
- Bookings
- Payments

Shows and bookings store a movie snapshot with the TMDB movie ID so booking history remains available even if TMDB movie data changes.

## Features

- Movie discovery, search, filtering, details, cast, trailers and favorites using TMDB
- Cinema, screen, date and show selection
- Show-specific interactive seat availability
- 10-minute temporary seat reservations and atomic double-booking protection
- Stripe PaymentIntent/payment verification architecture and retry for eligible pending bookings
- Booking confirmation and My Bookings
- USER/ADMIN roles with backend authorization and frontend route guards
- Admin dashboard for movies, cinemas, screens, seats, shows, bookings and users
- TMDB movie browser for administrators
- TMDB movie selection when creating shows
- Expired-reservation background sweep and deployment-friendly jobs endpoint
- Responsive UI and Vercel-ready frontend/backend configuration

## Setup

1. Copy `server/.env.example` to `server/.env` and configure MongoDB, JWT, Stripe, TMDB, client URL and optional email variables.

2. Copy `client/.env.example` to `client/.env`.

3. Run `npm install` inside `server` and `client`.

4. Start the backend with `npm run dev`.

5. Start the frontend with `npm run dev`.

No movie seed data is required. Movies are retrieved from TMDB through the backend.

## Test/build

- `cd server && npm test`
- `cd client && npm run build`

Never commit `.env` files or secrets. Configure Stripe webhook delivery to `/api/payments/webhook` in production.