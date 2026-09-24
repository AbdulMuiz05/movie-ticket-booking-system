export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-300">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}