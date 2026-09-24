import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  title,
  size = 'md',
  onClose,
  children,
  footer,
  disableClose = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && !disableClose && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, disableClose, onClose]);

  if (!open) return null;

  const width = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size] || 'max-w-xl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !disableClose) onClose?.();
      }}
    >
      <div className={`card w-full ${width} my-4 overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
          <h2 className="font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={() => !disableClose && onClose?.()}
            className="rounded p-1 text-ink-400 hover:bg-ink-800 hover:text-ink-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-ink-700 bg-ink-900/60 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}