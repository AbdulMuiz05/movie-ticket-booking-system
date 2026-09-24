import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-9 w-9 text-red-400" />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {message ? <p className="mt-1 max-w-md text-sm text-ink-200">{message}</p> : null}
      {onRetry ? (
        <button onClick={onRetry} className="btn-outline mt-5">
          Try again
        </button>
      ) : null}
    </div>
  );
}