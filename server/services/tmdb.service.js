import axios from 'axios';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_REGION = process.env.TMDB_REGION || '';
const TMDB_LANGUAGE = process.env.TMDB_LANGUAGE || 'en-US';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const client = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000,
  params: TMDB_API_KEY ? { api_key: TMDB_API_KEY } : {},
});

export const isTmdbConfigured = () => Boolean(TMDB_API_KEY);

const movieUrl = (path, size = 'w500') => path ? `${IMAGE_BASE}/${size}${path}` : '';

export const mapTmdbMovie = (tmdb, status = null) => ({
  _id: tmdb.id,
  tmdbId: tmdb.id,
  title: tmdb.title || tmdb.original_title || 'Untitled',
  description: tmdb.overview || 'No description available.',
  poster: movieUrl(tmdb.poster_path, 'w500'),
  backdrop: movieUrl(tmdb.backdrop_path, 'original'),
  trailer:
    tmdb.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer')?.key
      ? `https://www.youtube.com/watch?v=${tmdb.videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer').key}`
      : '',
  language: (tmdb.original_language || 'en').toUpperCase(),
  genre: (tmdb.genres || []).map((g) => g.name).filter(Boolean),
  duration: tmdb.runtime || 120,
  releaseDate: tmdb.release_date || null,
  cast: (tmdb.credits?.cast || []).slice(0, 15).map((c, i) => ({
    name: c.name,
    character: c.character || '',
    profilePath: movieUrl(c.profile_path, 'w185'),
    order: i,
  })),
  rating: tmdb.vote_average || 0,
  popularity: tmdb.popularity || 0,
  status: status || null,
});

export const getTmdbMovieDetails = async (tmdbId) => {
  if (!isTmdbConfigured()) throw new Error('TMDB_API_KEY not configured');

  const { data } = await client.get(`/movie/${tmdbId}`, {
    params: {
      language: TMDB_LANGUAGE,
      append_to_response: 'credits,videos',
    },
  });

  return data;
};

export const listTmdbMovies = async ({ q, status, page = 1 }) => {
  if (!isTmdbConfigured()) throw new Error('TMDB_API_KEY not configured');

  const endpoint = q
    ? '/search/movie'
    : status === 'UPCOMING'
      ? '/movie/upcoming'
      : status === 'NOW_SHOWING'
        ? '/movie/now_playing'
        : '/movie/popular';

  const params = {
    language: TMDB_LANGUAGE,
    page,
  };

  if (TMDB_REGION) params.region = TMDB_REGION;
  if (q) params.query = q;

  const { data } = await client.get(endpoint, { params });

  return {
    movies: (data.results || []).map((movie) => mapTmdbMovie(movie, status || null)),
    page: data.page || page,
    total: data.total_results || 0,
    pages: data.total_pages || 0,
  };
};

export const searchTmdbMovies = async (query, page = 1) => {
  const result = await listTmdbMovies({ q: query, page });

  return {
    results: result.movies,
    total_pages: result.pages,
    total_results: result.total,
  };
};

export const getTmdbRecommendations = async (tmdbId, page = 1) => {
  if (!isTmdbConfigured()) throw new Error('TMDB_API_KEY not configured');

  const { data } = await client.get(`/movie/${tmdbId}/recommendations`, {
    params: {
      language: TMDB_LANGUAGE,
      page,
    },
  });

  return {
    movies: (data.results || []).map((movie) => mapTmdbMovie(movie)),
    page: data.page || page,
    total: data.total_results || 0,
    pages: data.total_pages || 0,
  };
};

export const mapTmdbToMovie = mapTmdbMovie;