import { Link, useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Clock, Star, Ticket } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { moviesApi } from '../api/index.js';
import MovieCard from '../components/MovieCard.jsx';
import { SkeletonRow } from '../components/Loading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDuration } from '../lib/formatters.js';

export default function HomePage() {
  const navigate = useNavigate();
  const { toggleFavorite } = useAuth();

  const { data, loading } = useApi(
    () => moviesApi.list({ status: 'NOW_SHOWING', limit: 8 }),
    []
  );

  const upcoming = useApi(
    () => moviesApi.list({ status: 'UPCOMING', limit: 4 }),
    []
  );

  const movies = data?.data?.movies || [];
  const upcomingMovies = upcoming.data?.data?.movies || [];
  const hero = movies[0];

  return (
    <div className="pb-12">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={hero?.backdrop || hero?.poster || ''}
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/40" />
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:items-center lg:px-8">
          <div className="flex-1">
            <span className="chip-brand mb-4">
              <Star className="h-3 w-3 fill-current" /> Now showing
            </span>

            <h1 className="font-display text-5xl leading-none tracking-wider text-white sm:text-6xl lg:text-7xl">
              {hero?.title || 'BOOK YOUR NEXT MOVIE NIGHT'}
            </h1>

            <p className="mt-4 max-w-xl text-sm text-ink-200 sm:text-base">
              {hero?.description ||
                'Pick a show, choose your favourite seats, and pay securely. Instant confirmation, no queues.'}
            </p>

            {hero ? (
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-200">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {(hero.rating || 0).toFixed(1)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />{' '}
                  {formatDuration(hero.duration)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Ticket className="h-4 w-4" /> {hero.language}
                </span>

                <span className="text-ink-400">·</span>

                <span>
                  {(hero.genre || []).slice(0, 3).join(' · ')}
                </span>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigate(
                    hero
                      ? `/movies/${hero.tmdbId}`
                      : '/movies'
                  )
                }
                className="btn-primary"
              >
                <Play className="h-4 w-4 fill-current" /> Book tickets
              </button>

              <Link to="/movies" className="btn-outline">
                Browse all movies <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {hero ? (
            <div className="hidden w-[260px] flex-shrink-0 lg:block">
              <Link
                to={`/movies/${hero.tmdbId}`}
                className="block overflow-hidden rounded-2xl border border-ink-700 shadow-2xl shadow-black/50"
              >
                <img
                  src={hero.poster}
                  alt={hero.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Now Showing</h2>
            <p className="section-subtitle mt-1">
              Book your seat for the latest releases
            </p>
          </div>

          <Link
            to="/movies"
            className="hidden text-sm font-medium text-brand-400 hover:text-brand-300 sm:inline-flex"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <SkeletonRow count={4} />
        ) : movies.length === 0 ? (
          <EmptyState
            title="No movies playing right now"
            description="Check back soon — new releases are added all the time."
            action={
              <Link to="/movies" className="btn-outline">
                Browse movies
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {movies.slice(0, 8).map((m) => (
              <MovieCard
                key={m.tmdbId}
                movie={m}
                onFavoriteToggle={(mv) =>
                  toggleFavorite(mv.tmdbId)
                }
              />
            ))}
          </div>
        )}
      </section>

      {upcomingMovies.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="section-title">Coming Soon</h2>
            <p className="section-subtitle mt-1">
              Get ready for these upcoming releases
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {upcomingMovies.map((m) => (
              <MovieCard
                key={m.tmdbId}
                movie={m}
                onFavoriteToggle={(mv) =>
                  toggleFavorite(mv.tmdbId)
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {hero ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="card overflow-hidden">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative aspect-video md:aspect-auto">
                <img
                  src={hero.backdrop || hero.poster}
                  alt={hero.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-center gap-4 p-8">
                <span className="chip-brand w-fit">
                  <Play className="h-3 w-3 fill-current" /> Trailer
                </span>

                <h3 className="font-display text-4xl tracking-wide text-white">
                  {hero.title}
                </h3>

                <p className="text-sm text-ink-300 line-clamp-4">
                  {hero.description}
                </p>

                {hero.trailer ? (
                  <a
                    href={hero.trailer}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-fit"
                  >
                    Watch trailer <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    to={`/movies/${hero.tmdbId}`}
                    className="btn-primary w-fit"
                  >
                    View details <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}