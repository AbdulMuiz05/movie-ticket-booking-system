import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { ArrowLeft, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { bookingsApi, paymentsApi } from '../api/index.js';
import { extractApiError } from '../api/client.js';
import Loading from '../components/Loading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { formatCurrency, formatDateTime } from '../lib/formatters.js';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intent, setIntent] = useState(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.get(bookingId);
      setBooking(res.data.booking);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const countdown = useCountdown(booking?.reservationExpiresAt);

  useEffect(() => {
    if (!countdown.expired || !booking) return;
    if (booking.bookingStatus === 'pending') {
      toast.error('Reservation expired — the seats were released');
      navigate('/my-bookings', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown.expired]);

  const startPayment = async () => {
    setCreatingIntent(true);
    try {
      const res = await paymentsApi.createIntent(bookingId);
      setIntent(res.data);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setCreatingIntent(false);
    }
  };

  if (loading) return <Loading fullScreen label="Loading checkout…" />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error.message} onRetry={load} />
      </div>
    );
  if (!booking) return null;

  const movie = booking.movie || {};
  const cinema = booking.cinema || {};
  const screen = booking.screen || {};
  const show = booking.show || {};

  const alreadyPaid = booking.paymentStatus === 'paid' || booking.bookingStatus === 'confirmed';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to={`/shows/${booking.show?._id}/seats`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to seats
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr,380px]">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-700 p-5">
            <h1 className="font-display text-2xl tracking-wide text-white">Checkout</h1>
            <p className="mt-1 text-xs text-ink-400">
              Booking reference <span className="font-mono text-ink-200">{booking.bookingReference}</span>
            </p>
          </div>

          <div className="space-y-4 p-5 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Movie" value={movie.title} />
              <Detail label="Cinema" value={`${cinema.name}, ${cinema.city}`} />
              <Detail label="Screen" value={screen.name} />
              <Detail label="Show time" value={formatDateTime(show.startTime)} />
              <Detail label="Seats" value={(booking.seats || []).join(', ')} />
              <Detail label="Tickets" value={`${booking.quantity}`} />
            </div>
          </div>

          <div className="border-t border-ink-700 bg-ink-900/60 p-5">
            {alreadyPaid ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                This booking is already paid.
                <Link to={`/booking-confirm/${booking._id}`} className="ml-2 underline">
                  View confirmation
                </Link>
              </div>
            ) : !intent ? (
              <button
                type="button"
                onClick={startPayment}
                disabled={creatingIntent || countdown.expired}
                className="btn-primary w-full"
              >
                <CreditCard className="h-4 w-4" />
                {creatingIntent ? 'Preparing…' : 'Continue to payment'}
              </button>
            ) : (
              <StripeCheckout
                clientSecret={intent.clientSecret}
                bookingId={booking._id}
                onSuccess={() => navigate(`/booking-confirm/${booking._id}`, { replace: true })}
              />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
              Payment summary
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Tickets ({booking.quantity})</span>
                <span>{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-400">Booking fee</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-ink-700 pt-3 text-base font-semibold">
                <span className="text-white">Total due</span>
                <span className="text-white">{formatCurrency(booking.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-300">
              <Clock className="h-3.5 w-3.5" /> Reservation time
            </div>
            <p
              className={`mt-2 font-mono text-3xl font-bold ${
                countdown.totalSeconds < 60 ? 'text-red-400' : 'text-brand-400'
              }`}
            >
              {countdown.label}
            </p>
            <p className="mt-1 text-xs text-ink-400">
              Complete payment before the timer ends or the seats are released.
            </p>
          </div>

          <div className="card flex items-start gap-3 p-5 text-xs text-ink-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <p>
              Payments are secured by Stripe. Your card details are never stored on our servers.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
    <p className="mt-1 text-sm text-ink-100">{value || '—'}</p>
  </div>
);

const StripeCheckout = ({ clientSecret, bookingId, onSuccess }) => (
  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
    <StripeForm bookingId={bookingId} onSuccess={onSuccess} />
  </Elements>
);

const StripeForm = ({ bookingId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message || 'Payment failed');
        return;
      }
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        toast.error(`Payment status: ${paymentIntent?.status || 'unknown'}`);
        return;
      }
      // Verify server-side — never trust client "succeeded" alone.
      const verify = await paymentsApi.confirm(paymentIntent.id);
      if (!verify.data?.confirmed) {
        toast.error('Payment could not be verified — please try again');
        return;
      }
      toast.success('Payment confirmed');
      onSuccess?.(verify.data.booking);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button type="submit" disabled={!stripe || processing} className="btn-primary w-full">
        <CreditCard className="h-4 w-4" />
        {processing ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
};

export const _unused = useMemo;