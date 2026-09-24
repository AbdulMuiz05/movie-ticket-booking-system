import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AdminRoute from '../components/AdminRoute.jsx';

import HomePage from '../pages/HomePage.jsx';
import MoviesPage from '../pages/MoviesPage.jsx';
import MovieDetailPage from '../pages/MovieDetailPage.jsx';
import CinemasPage from '../pages/CinemasPage.jsx';
import CinemaDetailPage from '../pages/CinemaDetailPage.jsx';
import SeatSelectionPage from '../pages/SeatSelectionPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import BookingConfirmPage from '../pages/BookingConfirmPage.jsx';
import MyBookingsPage from '../pages/MyBookingsPage.jsx';
import FavoritesPage from '../pages/FavoritesPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminMoviesPage from '../pages/admin/AdminMoviesPage.jsx';
import AdminCinemasPage from '../pages/admin/AdminCinemasPage.jsx';
import AdminScreensPage from '../pages/admin/AdminScreensPage.jsx';
import AdminSeatsPage from '../pages/admin/AdminSeatsPage.jsx';
import AdminShowsPage from '../pages/admin/AdminShowsPage.jsx';
import AdminBookingsPage from '../pages/admin/AdminBookingsPage.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="movies/:movieId" element={<MovieDetailPage />} />
        <Route path="cinemas" element={<CinemasPage />} />
        <Route path="cinemas/:cinemaId" element={<CinemaDetailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="shows/:showId/seats" element={<SeatSelectionPage />} />
          <Route path="checkout/:bookingId" element={<CheckoutPage />} />
          <Route path="booking-confirm/:bookingId" element={<BookingConfirmPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="cinemas" element={<AdminCinemasPage />} />
          <Route path="screens" element={<AdminScreensPage />} />
          <Route path="seats" element={<AdminSeatsPage />} />
          <Route path="shows" element={<AdminShowsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}