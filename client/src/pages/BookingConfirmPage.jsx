import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Ticket, ArrowRight } from 'lucide-react';
import { bookingsApi } from '../api/index.js';
import { extractApiError } from '../api/client.js';
import Loading from '../components/Loading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { formatCurrency, formatDateTime, statusTone } from '../lib/formatters.js';

export default function BookingConfirmPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await bookingsApi.get(bookingId);
        setBooking(res.data.booking);
      } catch (err) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  if (loading) return <Loading fullScreen label="Fetching your booking…" />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error.message} />
      </div>
    );
  if (!booking) return null;

  const isConfirmed = booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-ink-700 bg-emerald-500/10 p-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <div>
            <h1 className="font-display text-3xl tracking-wide text-white">
              {isConfirmed ? 'Booking confirmed' : 'Booking details'}
            </h1>
            <p className="text-xs text-ink-300">
              Reference{' '}
              <span className="font-mono text-ink-100">{booking.bookingReference}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4 p-6 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Movie" value={booking.movie?.title} />
            <Row label="Cinema" value={`${booking.cinema?.name}, ${booking.cinema?.city}`} />
            <Row label="Screen" value={booking.screen?.name} />
            <Row label="Show time" value={formatDateTime(booking.show?.startTime)} />
            <Row label="Seats" value={(booking.seats || []).join(', ')} />
            <Row label="Tickets" value={booking.quantity} />
            <Row label="Total paid" value={formatCurrency(booking.totalAmount)} />
            <Row
              label="Payment status"
              value={
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${statusTone(booking.paymentStatus)}`}>
                  {booking.paymentStatus}
                </span>
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-ink-700 bg-ink-900/60 p-5">
          <Link to="/my-bookings" className="btn-primary">
            <Ticket className="h-4 w-4" /> View my bookings
          </Link>
          <Link to="/movies" className="btn-outline">
            Browse more movies <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-2 text-xs text-ink-400">
        <p className="inline-flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" /> Arrive at least 15 minutes early.
        </p>
        <p className="inline-flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" /> Show your booking reference at the counter.
        </p>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
    <p className="mt-1 text-sm text-ink-100">{value || '—'}</p>
  </div>
);