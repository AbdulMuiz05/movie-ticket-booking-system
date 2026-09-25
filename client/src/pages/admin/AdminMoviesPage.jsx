import { useMemo, useState } from 'react';
import { Film, Search } from 'lucide-react';
import { moviesApi } from '../../api/index.js';
import { extractApiError } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import { formatDate, formatDuration } from '../../lib/formatters.js';

export default function AdminMoviesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const debouncedQ = useDebounce(q, 300);

  const { data, loading, error } = useApi(
    () =>
      moviesApi.list({
        q: debouncedQ || undefined,
        status: status || undefined,
        page,
        limit: 20,
      }),
    [debouncedQ, status, page]
  );

  const movies = data?.data?.movies || [];
  const pagination = data?.data?.pagination;

  const columns = useMemo(
    () => [
      {
        key: 'poster',
        label: '',
        render: (movie) =>
          movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="h-14 w-10 rounded object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          ) : (
            <div className="grid h-14 w-10 place-items-center rounded bg-ink-800 text-ink-600">
              <Film className="h-4 w-4" />
            </div>
          ),
      },
      {
        key: 'title',
        label: 'Title',
        render: (movie) => (
          <div>
            <p className="font-medium text-white">{movie.title}</p>
            <p className="text-xs text-ink-500">
              TMDB ID: {movie.tmdbId}
            </p>
          </div>
        ),
      },
      {
        key: 'genre',
        label: 'Genres',
        render: (movie) =>
          (movie.genre || []).slice(0, 3).join(', ') || '—',
      },
      {
        key: 'duration',
        label: 'Duration',
        render: (movie) => formatDuration(movie.duration),
      },
      {
        key: 'releaseDate',
        label: 'Released',
        render: (movie) => formatDate(movie.releaseDate),
      },
      {
        key: 'rating',
        label: 'Rating',
        render: (movie) => (movie.rating || 0).toFixed(1),
      },
      {
        key: 'status',
        label: 'Status',
        render: (movie) => (
          <span className="rounded-full border border-ink-600 bg-ink-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-300">
            {movie.status || 'TMDB'}
          </span>
        ),
      },
    ],
    []
  );

  const searchError = error
    ? extractApiError(error).message
    : null;

  return (
    <div>
      <PageHeader
        title="Movies"
        subtitle="Browse movies directly from TMDB"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search movies from TMDB…"
            className="input pl-10"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input sm:w-52"
        >
          <option value="">Popular</option>
          <option value="NOW_SHOWING">Now Showing</option>
          <option value="UPCOMING">Upcoming</option>
        </select>
      </div>

      {searchError ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {searchError}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={movies}
        loading={loading}
        error={error}
        empty={{
          icon: Film,
          title: 'No movies found',
        }}
        pagination={pagination}
        onPage={setPage}
      />
    </div>
  );
}