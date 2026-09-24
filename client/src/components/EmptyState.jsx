import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-600 bg-ink-900/40 px-6 py-14 text-center">
      <Icon className="mb-3 h-10 w-10 text-ink-500" />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-300">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}