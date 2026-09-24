import { Link, useParams } from 'react-router-dom';
import { MapPin, Building2, Monitor, Armchair, ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { cinemasApi, screensApi } from '../api/index.js';
import Loading from '../components/Loading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CinemaDetailPage() {
  const { cinemaId } = useParams();

  const cinemaQuery = useApi(() => cinemasApi.get(cinemaId), [cinemaId]);
  const screensQuery = useApi(() => screensApi.listByCinema(cinemaId), [cinemaId]);

  if (cinemaQuery.loading) return <Loading fullScreen />;
  if (cinemaQuery.error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message={cinemaQuery.error.message} onRetry={cinemaQuery.refetch} />
      </div>
    );

  const cinema = cinemaQuery.data?.data?.cinema;
  if (!cinema) return <EmptyState title="Cinema not found" />;

  const screens = screensQuery.data?.data?.screens || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="card overflow-hidden">
        {cinema.images?.[0] ? (
          <div className="aspect-[21/9] bg-ink-800">
            <img src={cinema.images[0]} alt={cinema.name} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="p-6">
          <h1 className="font-display text-4xl tracking-wide text-white">{cinema.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-300">
            <MapPin className="h-4 w-4" /> {cinema.address}, {cinema.city}
          </p>
          {cinema.description ? (
            <p className="mt-3 max-w-3xl text-sm text-ink-300">{cinema.description}</p>
          ) : null}
          {cinema.facilities?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {cinema.facilities.map((f) => (
                <span key={f} className="chip">{f}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-brand-400" />
          <h2 className="text-xl font-semibold text-white">Screens</h2>
        </div>

        {screensQuery.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
        ) : screens.length === 0 ? (
          <EmptyState icon={Monitor} title="No screens configured" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screens.map((s) => (
              <div key={s._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{s.name}</h3>
                    <p className="mt-1 text-xs text-ink-400">
                      Screen #{s.screenNumber} · {s.screenType}
                    </p>
                  </div>
                  <span className="chip-brand">#{s.screenNumber}</span>
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-ink-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Armchair className="h-3.5 w-3.5" /> {s.capacity} seats
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {s.rows} × {s.columns}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <Link to="/movies" className="btn-outline">
          Browse movies <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}