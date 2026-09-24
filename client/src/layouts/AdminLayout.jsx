import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Film, Building2, Monitor, Armchair, CalendarRange, Ticket, Users, ArrowLeft } from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/movies', label: 'Movies', icon: Film },
  { to: '/admin/cinemas', label: 'Cinemas', icon: Building2 },
  { to: '/admin/screens', label: 'Screens', icon: Monitor },
  { to: '/admin/seats', label: 'Seats', icon: Armchair },
  { to: '/admin/shows', label: 'Shows', icon: CalendarRange },
  { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-ink-950">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="lg:w-64 lg:flex-shrink-0">
          <div className="card sticky top-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
              <span className="font-display text-xl tracking-widest text-white">ADMIN</span>
              <Link to="/" className="text-xs text-ink-300 hover:text-white">
                <ArrowLeft className="mr-1 inline h-3 w-3" />
                Site
              </Link>
            </div>
            <nav className="flex flex-wrap gap-1 p-3 lg:flex-col">
              {ADMIN_LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-200'
                        : 'text-ink-200 hover:bg-ink-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" /> {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <Outlet />
        </section>
      </div>
    </div>
  );
}