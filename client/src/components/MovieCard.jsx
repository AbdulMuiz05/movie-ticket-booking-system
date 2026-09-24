import { Link } from 'react-router-dom';
import { Star, Clock, Heart } from 'lucide-react';
import { formatDuration } from '../lib/formatters.js';
import { useAuth } from '../hooks/useAuth.js';

export default function MovieCard({ movie, onFavoriteToggle }) {
  const { isAuthenticated, isFavorite } = useAuth();
  const fav = isFavorite?.(movie._id);

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(movie);
  };

  return (
    <Link
      to={`/movies/${movie._id}`}
      className="group card overflow-hidden transition hover:-translate-y-1 hover:border-brand-500/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-ink-800">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://placehold.co/400x600/17171f/8a8a99?text=No+Poster';
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Star className="mr-1 inline h-3 w-3 fill-amber-400 text-amber-400" />
            {(movie.rating || 0).toFixed(1)}
          </span>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleFav}
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
              className="rounded-full bg-black/60 p-2 text-white backdrop-blur transition hover:bg-brand-500"
            >
              <Heart className={`h-4 w-4 ${fav ? 'fill-brand-500 text-brand-500' : ''}`} />
            </button>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
          <div className="flex items-center gap-2 text-xs text-ink-200">
            <Clock className="h-3 w-3" />
            {formatDuration(movie.duration)}
            <span className="mx-1 h-1 w-1 rounded-full bg-ink-500" />
            {movie.language}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-white sm:text-base">
          {movie.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-ink-400">
          {(movie.genre || []).slice(0, 3).join(' · ') || '—'}
        </p>
      </div>
    </Link>
  );
}