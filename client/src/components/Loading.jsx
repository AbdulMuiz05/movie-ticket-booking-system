import { Loader2 } from 'lucide-react';

export default function Loading({ label = 'Loading…', fullScreen = false }) {
  return (
    <div
      className={
        fullScreen
          ? 'fixed inset-0 z-40 flex items-center justify-center bg-ink-950/80 backdrop-blur'
          : 'flex items-center justify-center py-16'
      }
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-sm text-ink-300">{label}</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}