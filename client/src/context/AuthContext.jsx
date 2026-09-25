import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi, usersApi } from '../api/index.js';
import { extractApiError, getAccessToken, setAccessToken } from '../api/client.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAccessToken()));
  const [favorites, setFavorites] = useState([]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await usersApi.listFavorites();
      setFavorites(res.data?.favorites || []);
    } catch {
      setFavorites([]);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.me();
      setUser(res.data.user);
      await loadFavorites();
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadFavorites]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials);
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      await loadFavorites();
      toast.success(`Welcome back, ${res.data.user.name}`);
      return res.data.user;
    },
    [loadFavorites]
  );

  const register = useCallback(
    async (payload) => {
      const res = await authApi.register(payload);
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      await loadFavorites();
      toast.success('Account created — welcome!');
      return res.data.user;
    },
    [loadFavorites]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}

    setAccessToken(null);
    setUser(null);
    setFavorites([]);
    toast.success('Signed out');
  }, []);

  const updateProfile = useCallback(async (body) => {
    const res = await usersApi.updateProfile(body);
    setUser(res.data.user);
    toast.success('Profile updated');
    return res.data.user;
  }, []);

  const changePassword = useCallback(async (body) => {
    await usersApi.changePassword(body);
    toast.success('Password changed');
  }, []);

  const toggleFavorite = useCallback(
    async (movieId) => {
      try {
        const res = await usersApi.toggleFavorite(movieId);
        setFavorites(res.data.favorites || []);
        return res.data.isFavorite;
      } catch (err) {
        toast.error(extractApiError(err).message);
        throw err;
      }
    },
    []
  );

  const isFavorite = useCallback(
    (movieId) =>
      favorites.some(
        (movie) =>
          movie.tmdbId?.toString() === movieId?.toString()
      ),
    [favorites]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      favorites,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      toggleFavorite,
      isFavorite,
      refreshFavorites: loadFavorites,
    }),
    [
      user,
      loading,
      favorites,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      toggleFavorite,
      isFavorite,
      loadFavorites,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}