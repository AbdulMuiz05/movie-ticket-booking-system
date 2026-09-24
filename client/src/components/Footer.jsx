import { Link } from 'react-router-dom';
import { Film, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white">
                <Film className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl tracking-widest text-white">QUICKSHOW</span>
            </div>
            <p className="mt-4 max-w-md text-sm text-ink-400">
              Book movie tickets online — pick your seats, pay securely, get instant
              confirmation. Built for a modern cinema experience.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                className="rounded-lg border border-ink-700 p-2 text-ink-300 hover:border-brand-500 hover:text-brand-400"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="rounded-lg border border-ink-700 p-2 text-ink-300 hover:border-brand-500 hover:text-brand-400"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@quickshow.example"
                className="rounded-lg border border-ink-700 p-2 text-ink-300 hover:border-brand-500 hover:text-brand-400"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-300">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/movies" className="hover:text-white">Now Showing</Link></li>
              <li><Link to="/cinemas" className="hover:text-white">Cinemas</Link></li>
              <li><Link to="/my-bookings" className="hover:text-white">My Bookings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-300">
              Account
            </h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
              <li><Link to="/register" className="hover:text-white">Create account</Link></li>
              <li><Link to="/favorites" className="hover:text-white">Favorites</Link></li>
              <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-6 sm:flex-row">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} QuickShow. All rights reserved.
          </p>
          <p className="text-xs text-ink-500">
            Payments secured by Stripe · Built with MERN
          </p>
        </div>
      </div>
    </footer>
  );
}