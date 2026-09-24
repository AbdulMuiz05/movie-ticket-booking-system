import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { cinemasApi } from '../api/index.js';
import { useDebounce } from '../hooks/useDebounce.js';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonRow } from '../components/Loading.jsx';

export default function CinemasPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const debouncedQ = useDebounce(q, 300);

  const citiesQuery = useApi(() => cinemasApi.listCities(), []);
  const listQuery = useApi(
    () => cinemasApi.list({ q: debouncedQ || undefined, city: city || undefined }),
    [debouncedQ, city]
  );

  const cinemas = listQuery.data?.data?.cinemas || [];
  const cities = citiesQuery.data?.data?.cities || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Cinemas" subtitle="Find a cinema near you" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cinemas by name…"
            className="input pl-10"
          />
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="input sm:w-56"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {listQuery.loading ? (
        <SkeletonRow count={4} />
      ) : cinemas.length === 0 ? (
        <EmptyState
          title="No cinemas found"
          description="Try a different city or search term."
          icon={Building2}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((c) => (
            <Link
              key={c._id}
              to={`/cinemas/${c._id}`}
              className="card overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-500/50"
            >
              {c.images?.[0] ? (
                <div className="aspect-[16/9] overflow-hidden bg-ink-800">
                  <img src={c.images[0]} alt={c.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="grid aspect-[16/9] place-items-center bg-ink-800 text-ink-500">
                  <Building2 className="h-10 w-10" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-white">{c.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                  <MapPin className="h-3.5 w-3.5" /> {c.address}, {c.city}
                </p>
                {c.facilities?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.facilities.slice(0, 3).map((f) => (
                      <span key={f} className="chip text-[11px]">
                        {f}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}