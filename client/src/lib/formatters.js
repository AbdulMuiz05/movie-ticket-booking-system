import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';

export const formatCurrency = (value, currency = import.meta.env.VITE_CURRENCY || '$') => {
  const num = Number(value || 0);
  return `${currency}${num.toFixed(2)}`;
};

export const formatDuration = (mins) => {
  const m = Number(mins) || 0;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (!h) return `${rem}m`;
  return rem ? `${h}h ${rem}m` : `${h}h`;
};

export const formatShowDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, dd MMM');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'EEE, dd MMM yyyy · hh:mm a');
};

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'hh:mm a');
};

export const relativeFromNow = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const maskCard = (last4) => (last4 ? `•••• ${last4}` : '');

export const statusTone = (status) => {
  switch (status) {
    case 'confirmed':
    case 'paid':
    case 'succeeded':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'pending':
    case 'requires_payment':
    case 'processing':
      return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    case 'cancelled':
    case 'failed':
    case 'expired':
    case 'refunded':
      return 'text-red-300 bg-red-500/10 border-red-500/30';
    default:
      return 'text-ink-200 bg-ink-800 border-ink-600';
  }
};