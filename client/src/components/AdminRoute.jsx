import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import Loading from './Loading.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && !isAdmin) {
      toast.error('You are not authorized to access the admin dashboard');
    }
  }, [loading, isAuthenticated, isAdmin]);

  if (loading) return <Loading fullScreen label="Verifying access…" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}