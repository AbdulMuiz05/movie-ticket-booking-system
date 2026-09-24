import { Link } from 'react-router-dom';
import {
  Users, Film, Building2, Monitor, CalendarRange, Ticket, DollarSign, ArrowRight, Activity,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/index.js';
import Loading from '../../components/Loading.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatCurrency, formatDateTime } from '../../lib/formatters.js';

export default function AdminDashboardPage() {
  const statsQuery = useApi(() => adminApi.dashboard(), []);
  const recentBookings = useApi(
    () => adminApi.listBookings({ limit: 5, status: 'confirmed' }),
    []
  );
  const upcomingShows = useApi(
    () => adminApi.listShows({ status: 'SCHEDULED', limit: 5 }),
    []
  );

  const stats = statsQuery.data?.data?.stats || {};
  const bookings = recentBookings.data?.data?.bookings || [];
  const shows = upcomingShows.data?.data?.shows || [];

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(stats.revenue || 0), icon: DollarSign, tone: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Total Bookings', value: stats.totalBookings ?? 0, icon: Ticket, tone: 'text-brand-400 bg-brand-500/10' },
    { label: 'Confirmed', value: stats.confirmedBookings ?? 0, icon: Activity, tone: 'text-sky-400 bg-sky-500/10' },
    { label: 'Pending', value: stats.pendingBookings ?? 0, icon: Activity, tone: 'text-amber-400 bg-amber-500/10' },
    { label: 'Movies', value: stats.totalMovies ?? 0, icon: Film, tone: 'text-fuchsia-400 bg-fuchsia-500/10' },
    { label: 'Cinemas', value: stats.totalCinemas ?? 0, icon: Building2, tone: 'text-purple-400 bg-purple-500/10' },
    { label: 'Screens', value: stats.totalScreens ?? 0, icon: Monitor, tone: 'text-cyan-400 bg-cyan-500/10' },
    { label: 'Upcoming Shows', value: stats.upcomingShows ?? 0, icon: CalendarRange, tone: 'text-orange-400 bg-orange-500/10' },
    { label: 'Users', value: stats.totalUsers ?? 0, icon: Users, tone: 'text-teal-400 bg-teal-500/10' },
  ];

  if (statsQuery.loading) return <Loading />;
  if (statsQuery.error)
    return <ErrorState message={statsQuery.error.message} onRetry={statsQuery.refetch} />;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of your cinema operations"
        actions={
          <>
            <Link to="/admin/shows" className="btn-outline">
              <CalendarRange className="h-4 w-4" /> Manage shows
            </Link>
            <Link to="/admin/movies" className="btn-primary">
              <Film className="h-4 w-4" /> Add movie
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${c.tone}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wide text-ink-400">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
            <h2 className="font-semibold text-white">Recent bookings</h2>
            <Link to="/admin/bookings" className="text-xs text-brand-400 hover:text-brand-300">
              View all <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          {recentBookings.loading ? (
            <Loading />
          ) : bookings.length === 0 ? (
            <p className="p-5 text-sm text-ink-400">No confirmed bookings yet.</p>
          ) : (
            <ul className="divide-y divide-ink-800">
              {bookings.map((b) => (
                <li key={b._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{b.movie?.title}</p>
                    <p className="truncate text-xs text-ink-400">
                      {b.user?.name} · {b.quantity} ticket{b.quantity > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(b.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
            <h2 className="font-semibold text-white">Upcoming shows</h2>
            <Link to="/admin/shows" className="text-xs text-brand-400 hover:text-brand-300">
              Manage <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
          {upcomingShows.loading ? (
            <Loading />
          ) : shows.length === 0 ? (
            <p className="p-5 text-sm text-ink-400">No scheduled shows.</p>
          ) : (
            <ul className="divide-y divide-ink-800">
              {shows.map((s) => (
                <li key={s._id} className="px-5 py-3">
                  <p className="truncate text-sm text-white">{s.movie?.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {s.cinema?.name} · {s.screen?.name} · {formatDateTime(s.startTime)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}