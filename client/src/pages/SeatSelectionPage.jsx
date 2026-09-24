import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Armchair, Info } from 'lucide-react';
import { showsApi, seatsApi, bookingsApi } from '../api/index.js';
import { extractApiError } from '../api/client.js';
import Loading from '../components/Loading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { formatCurrency, formatTime, formatDateTime } from '../lib/formatters.js';
import { groupSeatsByRow } from '../lib/seatLayout.js';

const MAX_SEATS = 5;

const seatClasses = (state, seatType) => {
  const base =
    'grid h-9 w-9 place-items-center rounded-md text-[11px] font-semibold transition select-none sm:h-10 sm:w-10 sm:text-xs';
  if (state === 'booked') return `${base} bg-ink-800 text-ink-600 cursor-not-allowed line-through`;
  if (state === 'reserved') return `${base} bg-amber-500/15 text-amber-300 cursor-not-allowed border border-amber-500/30`;
  if (state === 'selected') return `${base} bg-brand-500 text-white shadow-glow`;
  if (seatType === 'PREMIUM') return `${base} bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20`;
  if (seatType === 'RECLINER') return `${base} bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/20`;
  return `${base} bg-ink-700 text-ink-100 hover:bg-ink-600 border border-ink-600`;
};

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [occupied, setOccupied] = useState(new Map());
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [showRes, occupiedRes] = await Promise.all([
        showsApi.get(showId),
        showsApi.occupiedSeats(showId),
      ]);
      const showDoc = showRes.data.show;
      setShow(showDoc);

      const seatsRes = await seatsApi.listByScreen(showDoc.screen._id);
      setSeats(seatsRes.data.seats || []);

      const map = new Map();
      for (const o of occupiedRes.data.occupied || []) {
        map.set(o.seatNumber, o.status);
      }
      setOccupied(map);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId]);

  const rows = useMemo(() => groupSeatsByRow(seats), [seats]);

  const seatPrice = (seat) =>
    Number(show?.ticketPrice || 0) * Number(seat.priceMultiplier || 1);

  const total = useMemo(
    () =>
      selected.reduce((sum, sn) => {
        const s = seats.find((x) => x.seatNumber === sn);
        return sum + seatPrice(s);
      }, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, seats, show]
  );

  const toggleSeat = (seat) => {
    const occupiedStatus = occupied.get(seat.seatNumber);
    if (occupiedStatus === 'booked') {
      toast.error('This seat is already booked');
      return;
    }
    if (occupiedStatus === 'reserved') {
      toast.error('This seat is on hold by another user — try again in a few minutes');
      return;
    }
    setSelected((prev) => {
      if (prev.includes(seat.seatNumber)) return prev.filter((s) => s !== seat.seatNumber);
      if (prev.length >= MAX_SEATS) {
        toast.error(`You can select up to ${MAX_SEATS} seats`);
        return prev;
      }
      return [...prev, seat.seatNumber];
    });
  };

  const proceed = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one seat');
      return;
    }
    setSubmitting(true);
    try {
      const res = await bookingsApi.create({ showId, seats: selected });
      toast.success('Seats reserved — complete payment to confirm');
      navigate(`/checkout/${res.data.booking._id}`);
    } catch (err) {
      const api = extractApiError(err);
      if (api.status === 409 && api.details?.existingBookingId) {
        toast.error('You already have a reservation for one of these seats');
        navigate(`/checkout/${api.details.existingBookingId}`);
      } else {
        toast.error(api.message);
        // refresh occupied seats so stale state clears
        load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading fullScreen label="Loading seats…" />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={error.message} onRetry={load} />
      </div>
    );
  if (!show) return null;

  const movie = show.movie || {};
  const cinema = show.cinema || {};
  const screen = show.screen || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to={`/movies/${movie._id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to movie
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-700 p-5">
            <h1 className="font-display text-2xl tracking-wide text-white">{movie.title}</h1>
            <p className="mt-1 text-xs text-ink-400">
              {cinema.name} · {screen.name} · {formatDateTime(show.startTime)}
            </p>
          </div>

          <div className="p-5">
            <div className="mx-auto mb-8 max-w-md">
              <div className="h-2 rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
              <p className="mt-2 text-center text-[11px] uppercase tracking-[0.25em] text-ink-400">
                Screen
              </p>
            </div>

            {rows.length === 0 ? (
              <p className="text-center text-sm text-ink-400">
                No seats configured for this screen.
              </p>
            ) : (
              <div className="space-y-2 overflow-x-auto pb-2">
                {rows.map(({ row, seats: rowSeats }) => (
                  <div key={row} className="flex items-center justify-center gap-1.5">
                    <span className="w-6 text-right text-xs font-semibold text-ink-400">
                      {row}
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {rowSeats.map((seat) => {
                        const state = occupied.get(seat.seatNumber);
                        const isSelected = selected.includes(seat.seatNumber);
                        const cls = seatClasses(
                          isSelected ? 'selected' : state || 'available',
                          seat.seatType
                        );
                        return (
                          <button
                            key={seat.seatNumber}
                            type="button"
                            title={`${seat.seatNumber} · ${seat.seatType}`}
                            disabled={state === 'booked' || state === 'reserved'}
                            onClick={() => toggleSeat(seat)}
                            className={cls}
                          >
                            {seat.column}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-6 text-xs font-semibold text-ink-400">{row}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-ink-300">
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-ink-700 border border-ink-600" /> Available
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-brand-500" /> Selected
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-amber-500/30 border border-amber-500/40" /> Reserved
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-ink-800 border border-ink-700" /> Booked
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-amber-500/20 border border-amber-500/40" /> Premium
              </span>
            </div>
          </div>
        </div>

        <aside className="card h-fit overflow-hidden lg:sticky lg:top-24">
          <div className="border-b border-ink-700 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
              Order summary
            </h2>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <Row label="Movie" value={movie.title} />
            <Row label="Cinema" value={cinema.name} />
            <Row label="Screen" value={screen.name} />
            <Row
              label="Time"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {formatTime(show.startTime)}
                </span>
              }
            />

            <div className="border-t border-ink-700 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                Selected seats
              </p>
              {selected.length === 0 ? (
                <p className="text-xs text-ink-500">None yet — pick your seats on the left.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((s) => (
                    <span key={s} className="chip-brand">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-ink-700 pt-3">
              <span className="text-ink-300">
                Tickets
                <span className="ml-1 text-ink-500">× {selected.length}</span>
              </span>
              <span className="text-ink-100">{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span className="text-white">Total</span>
              <span className="text-white">{formatCurrency(total)}</span>
            </div>

            <button
              type="button"
              onClick={proceed}
              disabled={submitting || selected.length === 0}
              className="btn-primary mt-2 w-full"
            >
              {submitting ? 'Reserving…' : 'Proceed to checkout'}
            </button>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-ink-400">
              <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
              Seats are held for 10 minutes. Complete payment before the timer runs out or the
              reservation is released.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 text-sm">
    <span className="text-ink-400">{label}</span>
    <span className="text-right text-ink-100">{value}</span>
  </div>
);

// Silence unused import lint
export const _unused = Armchair;