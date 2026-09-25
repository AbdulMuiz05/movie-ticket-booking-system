import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useAuth } from '../hooks/useAuth.js';
import { moviesApi } from '../api/index.js';
import MovieCard from '../components/MovieCard.jsx';
import { SkeletonRow } from '../components/Loading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'popularity', label: 'Popular' },
  { value: 'title', label: 'A–Z' },
];

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'NOW_SHOWING', label: 'Now showing' },
  { value: 'UPCOMING', label: 'Upcoming' },
];

export default function MoviesPage() {
  const { toggleFavorite } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQ = useDebounce(q, 350);

  const { data, loading } = useApi(
    () =>
      moviesApi.list({
        q: debouncedQ || undefined,
        status: status || undefined,
        sort,
        page,
        limit: 20,
      }),
    [debouncedQ, status, sort, page]
  );

  const movies = data?.data?.movies || [];
  const pagination = data?.data?.pagination || {
    page: 1,
    pages: 1,
    total: 0,
  };

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        debouncedQ ||
          status ||
          sort !== 'newest'
      ),
    [debouncedQ, status, sort]
  );

  const reset = () => {
    setQ('');
    setStatus('');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Movies"
        subtitle={
          pagination.total
            ? `${pagination.total} titles available`
            : 'Browse our collection'
        }
      />

      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search movies by title or description…"
              className="input pl-10"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFilters((value) => !value)
            }
            className="btn-outline sm:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters ? (
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setStatus(s.value);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    status === s.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-ink-800 text-ink-200 hover:bg-ink-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-ink-700" />

            <div className="flex flex-wrap items-center gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setSort(s.value);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    sort === s.value
                      ? 'bg-brand-500/20 text-brand-200'
                      : 'bg-ink-800 text-ink-200 hover:bg-ink-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {hasActiveFilters ? (
              <button
                onClick={reset}
                className="ml-auto btn-ghost text-xs"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <SkeletonRow count={8} />
      ) : movies.length === 0 ? (
        <EmptyState
          title="No movies found"
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or searching with a different term.'
              : 'Check back soon — new releases are added regularly.'
          }
          action={
            hasActiveFilters ? (
              <button
                className="btn-outline"
                onClick={reset}
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard
                key={movie.tmdbId}
                movie={movie}
                onFavoriteToggle={(selectedMovie) =>
                  toggleFavorite(
                    selectedMovie.tmdbId
                  )
                }
              />
            ))}
          </div>

          {pagination.pages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                disabled={page <= 1}
                className="btn-outline"
              >
                Previous
              </button>

              <span className="px-4 text-sm text-ink-300">
                Page {pagination.page} of{' '}
                {pagination.pages}
              </span>

              <button
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      pagination.pages,
                      current + 1
                    )
                  )
                }
                disabled={
                  page >= pagination.pages
                }
                className="btn-outline"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}