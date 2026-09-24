import { useMemo, useState } from 'react';
import { Ticket } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import { formatCurrency, formatDateTime, statusTone } from '../../lib/formatters.js';

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const { data, loading, error } = useApi(
    () =>
      adminApi.listBookings({
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        page,
        limit: 20,
      }),
    [status, paymentStatus, page]
  );

  const bookings = data?.data?.bookings || [];
  const pagination = data?.data?.pagination;

  const columns = useMemo(
    () => [
      {
        key: 'reference',
        label: 'Reference',
        render: (b) => (
          <span className="font-mono text-xs text-ink-200">{b.bookingReference}</span>
        ),
      },
      { key: 'user', label: 'User', render: (b) => b.user?.name || '—' },
      { key: 'movie', label: 'Movie', render: (b) => b.movie?.title || '—' },
      {
        key: 'show',
        label: 'Show',
        render: (b) => (b.show?.startTime ? formatDateTime(b.show.startTime) : '—'),
      },
      { key: 'seats', label: 'Seats', render: (b) => (b.seats || []).join(', ') },
      { key: 'totalAmount', label: 'Amount', render: (b) => formatCurrency(b.totalAmount) },
      {
        key: 'bookingStatus',
        label: 'Booking',
        render: (b) => (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(
              b.bookingStatus
            )}`}
          >
            {b.bookingStatus}
          </span>
        ),
      },
      {
        key: 'paymentStatus',
        label: 'Payment',
        render: (b) => (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(
              b.paymentStatus
            )}`}
          >
            {b.paymentStatus}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="Bookings" subtitle="All bookings across the platform" />

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input sm:w-48"
        >
          <option value="">All bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            setPage(1);
          }}
          className="input sm:w-48"
        >
          <option value="">All payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={bookings}
        loading={loading}
        error={error}
        empty={{ icon: Ticket, title: 'No bookings' }}
        pagination={pagination}
        onPage={setPage}
      />
    </div>
  );
}