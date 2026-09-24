import axios from 'axios';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const client = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 8000,
  params: TMDB_API_KEY ? { api_key: TMDB_API_KEY } : {},
});

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const isTmdbConfigured = () => Boolean(TMDB_API_KEY);

export const searchTmdbMovies = async (query, page = 1) => {
  if (!isTmdbConfigured()) throw new Error('TMDB_API_KEY not configured');
  const { data } = await client.get('/search/movie', { params: { query, page } });
  return data;
};

export const getTmdbMovieDetails = async (tmdbId) => {
  if (!isTmdbConfigured()) throw new Error('TMDB_API_KEY not configured');
  const { data } = await client.get(`/movie/${tmdbId}`, {
    params: { append_to_response: 'credits,videos' },
  });
  return data;
};

export const mapTmdbToMovie = (tmdb) => ({
  title: tmdb.title,
  description: tmdb.overview || 'No description available.',
  poster: tmdb.poster_path ? `${IMAGE_BASE}/w500${tmdb.poster_path}` : '',
  backdrop: tmdb.backdrop_path ? `${IMAGE_BASE}/original${tmdb.backdrop_path}` : '',
  trailer:
    tmdb.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer')?.key
      ? `https://www.youtube.com/watch?v=${tmdb.videos.results.find(
          (v) => v.site === 'YouTube' && v.type === 'Trailer'
        ).key}`
      : '',
  language: (tmdb.original_language || 'en').toUpperCase(),
  genre: (tmdb.genres || []).map((g) => g.name),
  duration: tmdb.runtime || 120,
  releaseDate: tmdb.release_date ? new Date(tmdb.release_date) : new Date(),
  cast: (tmdb.credits?.cast || []).slice(0, 15).map((c, i) => ({
    name: c.name,
    character: c.character || '',
    profilePath: c.profile_path ? `${IMAGE_BASE}/w185${c.profile_path}` : '',
    order: i,
  })),
  rating: tmdb.vote_average || 0,
  popularity: tmdb.popularity || 0,
  tmdbId: tmdb.id,
  status: new Date(tmdb.release_date) > new Date() ? 'UPCOMING' : 'NOW_SHOWING',
});