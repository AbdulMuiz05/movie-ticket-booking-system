import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import MovieCard from '../components/MovieCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Your favorites"
        subtitle={favorites.length ? `${favorites.length} saved movies` : 'Movies you love'}
      />

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorite movies yet"
          description="Tap the heart icon on any movie to save it here."
          action={<Link to="/movies" className="btn-primary">Browse movies</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favorites.map((m) => (
            <MovieCard key={m._id} movie={m} onFavoriteToggle={(mv) => toggleFavorite(mv._id)} />
          ))}
        </div>
      )}
    </div>
  );
}