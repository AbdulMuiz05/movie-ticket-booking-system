import { useState } from 'react';
import ReactPlayer from 'react-player';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Heart, Star, Clock, Calendar, Play, ArrowRight, MapPin, Building2,
} from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { moviesApi, showsApi } from '../api/index.js';
import Loading from '../components/Loading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import MovieCard from '../components/MovieCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDuration, formatShowDate, formatTime, formatCurrency } from '../lib/formatters.js';
export default function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isFavorite, toggleFavorite, favorites } = useAuth();

  const movieQuery = useApi(() => moviesApi.get(movieId), [movieId]);
  const recQuery = useApi(() => moviesApi.recommended(movieId), [movieId]);
  const allShowsQuery = useApi(
  () => showsApi.list({ movieId, status: 'SCHEDULED' }),
  [movieId]
);

const [selectedDate, setSelectedDate] = useState(null);

const showsQuery = useApi(
  () =>
    selectedDate
      ? showsApi.list({
          movieId,
          date: selectedDate,
          status: 'SCHEDULED',
        })
      : Promise.resolve({ data: { shows: [] } }),
  [movieId, selectedDate]
);

  if (movieQuery.loading) return <Loading fullScreen label="Loading movie…" />;
  if (movieQuery.error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          title="Could not load movie"
          message={movieQuery.error.message}
          onRetry={movieQuery.refetch}
        />
      </div>
    );

  const movie = movieQuery.data?.data?.movie;
  if (!movie)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Movie not found" description="It may have been removed." />
      </div>
    );

const allShows = allShowsQuery.data?.data?.shows || [];

const dates = [
  ...new Set(
    allShows.map((show) =>
      new Date(show.startTime).toISOString().slice(0, 10)
    )
  ),
].sort();
  const shows = showsQuery.data?.data?.shows || [];
  const fav = isFavorite(movie.tmdbId);

  const handleFav = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/movies/${movie.tmdbId}` } });
      return;
    }
    await toggleFavorite(movie.tmdbId);
  };

  const selectSeats = (show) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/shows/${show._id}/seats` } });
      return;
    }
    navigate(`/shows/${show._id}/seats`);
  };

  return (
    <div className="pb-12">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 h-[420px] overflow-hidden">
          <img
            src={movie.backdrop || movie.poster}
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[260px,1fr]">
            <div className="mx-auto w-56 md:mx-0 md:w-full">
              <img
                src={movie.poster}
                alt={movie.title}
                className="aspect-[2/3] w-full rounded-2xl border border-ink-700 object-cover shadow-2xl shadow-black/60"
              />
            </div>

            <div>
              <h1 className="font-display text-4xl leading-none tracking-wide text-white sm:text-5xl">
                {movie.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-200">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {(movie.rating || 0).toFixed(1)}
                  <span className="text-ink-400">·</span>
                  <span className="text-ink-400">user rating</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {formatDuration(movie.duration)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(movie.releaseDate).getFullYear()}
                </span>
                <span className="chip">{movie.language}</span>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink-200 sm:text-base">
                {movie.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(movie.genre || []).map((g) => (
                  <span key={g} className="chip">
                    {g}
                  </span>
                ))}
              </div>

              {movie.trailer ? (
  <div
    id="trailer"
    className="mt-7 overflow-hidden rounded-xl border border-ink-700 bg-black"
  >
    <ReactPlayer
      url={movie.trailer}
      width="100%"
      controls
      light={movie.backdrop || movie.poster}
    />
  </div>
) : null}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#shows" className="btn-primary">
                  Book tickets <ArrowRight className="h-4 w-4" />
                </a>
                {movie.trailer ? (
  <a href="#trailer" className="btn-outline">
    <Play className="h-4 w-4 fill-current" /> Watch trailer
  </a>
) : null}
                <button onClick={handleFav} className="btn-outline" type="button">
                  <Heart className={`h-4 w-4 ${fav ? 'fill-brand-500 text-brand-500' : ''}`} />
                  {fav ? 'In favorites' : 'Add to favorites'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {movie.cast?.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <h2 className="section-title">Cast</h2>
          <div className="no-scrollbar mt-6 flex gap-6 overflow-x-auto pb-3">
            {movie.cast.slice(0, 12).map((c, i) => (
              <div key={`${c.name}-${i}`} className="flex w-28 flex-shrink-0 flex-col items-center text-center">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-ink-700 bg-ink-800">
                  {c.profilePath ? (
                    <img src={c.profilePath} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-lg font-bold text-ink-400">
                      {c.name?.[0]}
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium text-ink-100">{c.name}</p>
                {c.character ? (
                  <p className="line-clamp-1 text-[11px] text-ink-400">{c.character}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section id="shows" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-16 sm:px-6 lg:px-8">
        <h2 className="section-title">Choose a date & show</h2>
        <p className="section-subtitle mt-1">Pick a date to see available shows</p>

        {allShowsQuery.loading ? (
          <div className="mt-6 flex gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-24" />
            ))}
          </div>
        ) : dates.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No upcoming shows"
              description="This movie doesn't have any scheduled screenings yet."
            />
          </div>
        ) : (
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {dates.map((d) => {
              const active = selectedDate === d;
              const dateObj = new Date(`${d}T00:00:00Z`);
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`flex min-w-[92px] flex-col items-center rounded-xl border px-4 py-3 text-sm transition ${
                    active
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-ink-700 bg-ink-900 text-ink-200 hover:border-brand-500/60'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider opacity-80">
                    {dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}
                  </span>
                  <span className="mt-1 text-lg font-bold">{dateObj.getUTCDate()}</span>
                  <span className="text-[11px] uppercase tracking-wider opacity-80">
                    {dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selectedDate ? (
          <div className="mt-8">
            {showsQuery.loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="card h-32 animate-pulse" />
                ))}
              </div>
            ) : shows.length === 0 ? (
              <EmptyState
                title="No shows this day"
                description="Try another date — screens are being scheduled all the time."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {shows.map((show) => {
                  const cinema = show.cinema || {};
                  const screen = show.screen || {};
                  return (
                    <div key={show._id} className="card p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Building2 className="h-4 w-4 text-brand-400" />
                            {cinema.name}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                            <MapPin className="h-3 w-3" />
                            {cinema.city}
                            <span className="mx-1 h-1 w-1 rounded-full bg-ink-600" />
                            {screen.name} · {screen.screenType}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(show.ticketPrice)}
                          </p>
                          <p className="text-[11px] uppercase tracking-wide text-ink-400">
                            per ticket
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="chip">
                          <Clock className="h-3 w-3" />
                          {formatTime(show.startTime)} – {formatTime(show.endTime)}
                        </span>
                        <span className="chip-brand">
                          {show.availableSeats ?? show.totalSeats} seats left
                        </span>
                      </div>

                      <button
                        onClick={() => selectSeats(show)}
                        className="btn-primary mt-5 w-full"
                      >
                        Select seats <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-8 text-sm text-ink-400">
            Pick a date above to see show times, cinemas and prices.
          </p>
        )}
      </section>

      {recQuery.data?.data?.movies?.length ? (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">You may also like</h2>
              <p className="section-subtitle mt-1">Similar picks based on genre and language</p>
            </div>
            <Link to="/movies" className="hidden text-sm font-medium text-brand-400 hover:text-brand-300 sm:inline-flex">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recQuery.data.data.movies.slice(0, 4).map((m) => (
  <MovieCard
    key={m.tmdbId}
    movie={m}
    onFavoriteToggle={(mv) => toggleFavorite(mv.tmdbId)}
  />
))}
          </div>
        </section>
      ) : null}

      <span className="hidden">{favorites.length}</span>
    </div>
  );
}
