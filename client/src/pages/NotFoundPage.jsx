import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center"><Compass className="mb-4 h-12 w-12 text-brand-500" /><h1 className="font-display text-5xl tracking-widest text-white">404</h1><p className="mt-3 text-ink-300">That page doesn't exist or was moved.</p><Link to="/" className="btn-primary mt-6">Back to Home</Link></div>;
}
