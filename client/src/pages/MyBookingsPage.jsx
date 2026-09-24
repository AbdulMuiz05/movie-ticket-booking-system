import { Link } from 'react-router-dom';
import { Clock, MapPin, Ticket, CreditCard, AlertCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { bookingsApi } from '../api/index.js';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loading from '../components/Loading.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { formatCurrency, formatDateTime, statusTone } from '../lib/formatters.js';

export default function MyBookingsPage() {
  const { data, loading, refetch } = useApi(() => bookingsApi.mine({ limit: 50 }), []);
  const bookings = data?.data?.bookings || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="My bookings" subtitle="Your ticket history and reservations" />

      {loading ? (
        <Loading />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No bookings yet"
          description="When you book a movie, your tickets will appear here."
          action={<Link to="/movies" className="btn-primary">Browse movies</Link>}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <BookingCard key={b._id} booking={b} onChanged={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}

const BookingCard = ({ booking, onChanged }) => {
  const movie = booking.movie || {};
  const cinema = booking.cinema || {};
  const show = booking.show || {};
  const paymentPending =
    booking.bookingStatus === 'pending' && booking.paymentStatus === 'pending';
  const countdown = useCountdown(booking.reservationExpiresAt);

  const canPay = paymentPending && !countdown.expired;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <div className="w-full flex-shrink-0 overflow-hidden rounded-lg bg-ink-800 sm:w-28">
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} className="h-40 w-full object-cover sm:h-full" />
          ) : (
            <div className="grid h-40 w-full place-items-center text-ink-600 sm:h-full">
              <Ticket className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-white">{movie.title}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                <MapPin className="h-3 w-3" /> {cinema.name}, {cinema.city}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={booking.bookingStatus} />
              <StatusPill status={booking.paymentStatus} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Meta label="Show" value={formatDateTime(show.startTime)} />
            <Meta label="Seats" value={(booking.seats || []).join(', ') || '—'} />
            <Meta label="Tickets" value={booking.quantity} />
            <Meta label="Amount" value={formatCurrency(booking.totalAmount)} />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] text-ink-500">
              {booking.bookingReference}
            </span>

            {canPay ? (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                  <Clock className="h-3 w-3" /> {countdown.label} left
                </span>
                <Link to={`/checkout/${booking._id}`} className="btn-primary !py-1.5 !text-xs">
                  <CreditCard className="h-3.5 w-3.5" /> Pay now
                </Link>
              </div>
            ) : paymentPending && countdown.expired ? (
              <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300">
                <AlertCircle className="h-3 w-3" /> Expired
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const Meta = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-ink-500">{label}</p>
    <p className="mt-0.5 text-xs text-ink-100">{value || '—'}</p>
  </div>
);

const StatusPill = ({ status }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(status)}`}>
    {status}
  </span>
);