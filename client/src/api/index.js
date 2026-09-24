import { apiClient } from './client.js';

const unwrap = (promise) => promise.then((r) => r.data);

// ── Auth ────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body) => unwrap(apiClient.post('/auth/register', body)),
  login: (body) => unwrap(apiClient.post('/auth/login', body)),
  refresh: () => unwrap(apiClient.post('/auth/refresh', {}, { _skipAuthRefresh: true })),
  logout: () => unwrap(apiClient.post('/auth/logout')),
  me: () => unwrap(apiClient.get('/auth/me')),
};

// ── Users ───────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => unwrap(apiClient.get('/users/profile')),
  updateProfile: (body) => unwrap(apiClient.patch('/users/profile', body)),
  changePassword: (body) => unwrap(apiClient.patch('/users/password', body)),
  listFavorites: () => unwrap(apiClient.get('/users/favorites')),
  toggleFavorite: (movieId) => unwrap(apiClient.post(`/users/favorites/${movieId}/toggle`)),
  addFavorite: (movieId) => unwrap(apiClient.post(`/users/favorites/${movieId}`)),
  removeFavorite: (movieId) => unwrap(apiClient.delete(`/users/favorites/${movieId}`)),
  listMyBookings: (params) => unwrap(apiClient.get('/users/bookings', { params })),
};

// ── Movies ──────────────────────────────────────────────────────────────
export const moviesApi = {
  list: (params) => unwrap(apiClient.get('/movies', { params })),
  get: (id) => unwrap(apiClient.get(`/movies/${id}`)),
  recommended: (id) => unwrap(apiClient.get(`/movies/${id}/recommended`)),
  tmdbStatus: () => unwrap(apiClient.get('/movies/tmdb/status')),
  tmdbSearch: (q, page = 1) => unwrap(apiClient.get('/movies/tmdb/search', { params: { q, page } })),
  tmdbImport: (tmdbId) => unwrap(apiClient.post(`/movies/tmdb/import/${tmdbId}`)),
  create: (body) => unwrap(apiClient.post('/movies', body)),
  update: (id, body) => unwrap(apiClient.patch(`/movies/${id}`, body)),
  remove: (id) => unwrap(apiClient.delete(`/movies/${id}`)),
  hardRemove: (id) => unwrap(apiClient.delete(`/movies/${id}/permanent`)),
};

// ── Cinemas ─────────────────────────────────────────────────────────────
export const cinemasApi = {
  list: (params) => unwrap(apiClient.get('/cinemas', { params })),
  listCities: () => unwrap(apiClient.get('/cinemas/cities')),
  get: (id) => unwrap(apiClient.get(`/cinemas/${id}`)),
  create: (body) => unwrap(apiClient.post('/cinemas', body)),
  update: (id, body) => unwrap(apiClient.patch(`/cinemas/${id}`, body)),
  remove: (id) => unwrap(apiClient.delete(`/cinemas/${id}`)),
  hardRemove: (id) => unwrap(apiClient.delete(`/cinemas/${id}/permanent`)),
};

// ── Screens ─────────────────────────────────────────────────────────────
export const screensApi = {
  listByCinema: (cinemaId) => unwrap(apiClient.get(`/screens/cinema/${cinemaId}`)),
  get: (id) => unwrap(apiClient.get(`/screens/${id}`)),
  create: (cinemaId, body) => unwrap(apiClient.post(`/screens/cinema/${cinemaId}`, body)),
  update: (id, body) => unwrap(apiClient.patch(`/screens/${id}`, body)),
  regenerateSeats: (id) => unwrap(apiClient.post(`/screens/${id}/regenerate-seats`)),
  remove: (id) => unwrap(apiClient.delete(`/screens/${id}`)),
  hardRemove: (id) => unwrap(apiClient.delete(`/screens/${id}/permanent`)),
};

// ── Seats ───────────────────────────────────────────────────────────────
export const seatsApi = {
  listByScreen: (screenId) => unwrap(apiClient.get(`/seats/screen/${screenId}`)),
  create: (body) => unwrap(apiClient.post('/seats', body)),
  update: (id, body) => unwrap(apiClient.patch(`/seats/${id}`, body)),
  remove: (id) => unwrap(apiClient.delete(`/seats/${id}`)),
};

// ── Shows ───────────────────────────────────────────────────────────────
export const showsApi = {
  list: (params) => unwrap(apiClient.get('/shows', { params })),
  get: (id) => unwrap(apiClient.get(`/shows/${id}`)),
  availableDates: (movieId) => unwrap(apiClient.get(`/shows/movie/${movieId}/dates`)),
  occupiedSeats: (id) => unwrap(apiClient.get(`/shows/${id}/occupied-seats`)),
  create: (body) => unwrap(apiClient.post('/shows', body)),
  update: (id, body) => unwrap(apiClient.patch(`/shows/${id}`, body)),
  cancel: (id) => unwrap(apiClient.post(`/shows/${id}/cancel`)),
  remove: (id) => unwrap(apiClient.delete(`/shows/${id}`)),
};

// ── Bookings ────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (body) => unwrap(apiClient.post('/bookings', body)),
  get: (id) => unwrap(apiClient.get(`/bookings/${id}`)),
  mine: (params) => unwrap(apiClient.get('/bookings/me', { params })),
  retryInfo: (id) => unwrap(apiClient.get(`/bookings/${id}/retry-info`)),
  cancel: (id) => unwrap(apiClient.post(`/bookings/${id}/cancel`)),
};

// ── Payments ────────────────────────────────────────────────────────────
export const paymentsApi = {
  createIntent: (bookingId) => unwrap(apiClient.post('/payments/intent', { bookingId })),
  confirm: (paymentIntentId) => unwrap(apiClient.post('/payments/confirm', { paymentIntentId })),
  status: (paymentIntentId) => unwrap(apiClient.get(`/payments/status/${paymentIntentId}`)),
};

// ── Admin ───────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => unwrap(apiClient.get('/admin/dashboard')),
  listUsers: (params) => unwrap(apiClient.get('/admin/users', { params })),
  updateUserRole: (id, role) => unwrap(apiClient.patch(`/admin/users/${id}/role`, { role })),
  setUserActive: (id, active) => unwrap(apiClient.patch(`/admin/users/${id}/active`, { active })),
  listBookings: (params) => unwrap(apiClient.get('/admin/bookings', { params })),
  listShows: (params) => unwrap(apiClient.get('/admin/shows', { params })),
  listPayments: (params) => unwrap(apiClient.get('/admin/payments', { params })),
};