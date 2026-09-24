import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import EmptyState from './EmptyState.jsx';

export default function DataTable({
  columns,
  rows,
  loading,
  error,
  empty = { title: 'Nothing here yet' },
  pagination,
  onPage,
  rowKey = (row, i) => row._id || i,
}) {
  if (loading) {
    return (
      <div className="card grid place-items-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="card border-red-500/30 bg-red-500/5 p-5 text-sm text-red-300">
        {error.message || 'Failed to load'}
      </div>
    );
  }
  if (!rows?.length) {
    return <EmptyState {...empty} />;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-800 text-sm">
          <thead className="bg-ink-900/60">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-300 ${
                    c.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rows.map((row, i) => (
              <tr key={rowKey(row, i)} className="hover:bg-ink-900/50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap px-4 py-3 text-ink-100 ${
                      c.align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 ? (
        <div className="flex items-center justify-between border-t border-ink-700 bg-ink-900/40 px-4 py-3">
          <span className="text-xs text-ink-400">
            Page {pagination.page} of {pagination.pages} · {pagination.total} total
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPage?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-ghost !px-2 !py-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onPage?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="btn-ghost !px-2 !py-1 text-xs"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}