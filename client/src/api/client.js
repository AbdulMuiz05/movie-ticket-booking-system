import axios from 'axios';

const ACCESS_TOKEN_KEY = 'mtbs_access_token';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || null;
export const setAccessToken = (token) => {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
};

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach access token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 with single-flight refresh
let refreshPromise = null;

const refreshToken = async () => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = apiClient
    .post('/auth/refresh', {}, { _skipAuthRefresh: true })
    .then((res) => {
      const token = res.data?.data?.accessToken || null;
      setAccessToken(token);
      return token;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    if (
      status === 401 &&
      !original._retry &&
      !original._skipAuthRefresh &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/register')
    ) {
      original._retry = true;
      try {
        const newToken = await refreshToken();
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        }
      } catch {
        setAccessToken(null);
      }
    }

    return Promise.reject(error);
  }
);

// Normalize errors into user-friendly messages
export const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong';
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (!error.response) return 'Network error. Check your internet connection.';

  const data = error.response.data;
  if (data?.error && Array.isArray(data.error)) {
    return data.error.map((e) => e.message).join(', ');
  }
  return data?.message || `Request failed (${error.response.status})`;
};

export const extractApiError = (error) => ({
  status: error?.response?.status || 0,
  message: getErrorMessage(error),
  details: error?.response?.data?.error || null,
});