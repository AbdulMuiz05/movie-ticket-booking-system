import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Ticket,
  Heart,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Film,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useUi } from '../hooks/useUi.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/cinemas', label: 'Cinemas' },
];

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout, favorites } = useAuth();
  const { mobileNavOpen, openMobileNav, closeMobileNav } = useUi();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    closeMobileNav();
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-500/10 text-brand-300' : 'text-ink-200 hover:bg-ink-800 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => closeMobileNav()}
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white shadow-glow">
              <Film className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl tracking-widest text-white">QUICKSHOW</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && favorites?.length > 0 ? (
              <NavLink to="/favorites" className={navLinkClass}>
                Favorites
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 py-1 pl-1 pr-3 transition hover:border-brand-500"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-brand-500 text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                  )}
                </span>
                <span className="hidden text-sm font-medium text-ink-100 sm:inline">
                  {user?.name?.split(' ')[0]}
                </span>
              </button>

              {userMenuOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-xl">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-100 hover:bg-ink-800"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                    <Link
                      to="/my-bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-100 hover:bg-ink-800"
                    >
                      <Ticket className="h-4 w-4" /> My Bookings
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-100 hover:bg-ink-800"
                    >
                      <Heart className="h-4 w-4" /> Favorites
                    </Link>
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-300 hover:bg-ink-800"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                      </Link>
                    ) : null}
                    <div className="border-t border-ink-800" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-300 hover:bg-ink-800"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-ink-200 hover:bg-ink-800 md:hidden"
            onClick={openMobileNav}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileNav}
          />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85%] border-l border-ink-800 bg-ink-950 p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-2xl tracking-widest text-white">MENU</span>
              <button
                type="button"
                onClick={closeMobileNav}
                className="rounded p-1 text-ink-300 hover:bg-ink-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={closeMobileNav}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-300'
                        : 'text-ink-200 hover:bg-ink-800'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/my-bookings"
                    onClick={closeMobileNav}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-200 hover:bg-ink-800"
                  >
                    My Bookings
                  </NavLink>
                  <NavLink
                    to="/favorites"
                    onClick={closeMobileNav}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-200 hover:bg-ink-800"
                  >
                    Favorites
                  </NavLink>
                  <NavLink
                    to="/profile"
                    onClick={closeMobileNav}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-200 hover:bg-ink-800"
                  >
                    Profile
                  </NavLink>
                  {isAdmin ? (
                    <NavLink
                      to="/admin"
                      onClick={closeMobileNav}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-300 hover:bg-ink-800"
                    >
                      Admin
                    </NavLink>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-left text-sm font-medium text-red-300 hover:bg-red-500/20"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={closeMobileNav}
                    className="btn-secondary w-full"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileNav}
                    className="btn-primary w-full"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}