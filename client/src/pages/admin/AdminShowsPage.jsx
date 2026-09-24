import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, CalendarRange, XCircle } from 'lucide-react';
import {
  cinemasApi,
  screensApi,
  moviesApi,
  showsApi,
  adminApi,
} from '../../api/index.js';
import { extractApiError } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { formatCurrency, formatDateTime, statusTone } from '../../lib/formatters.js';

const EMPTY = {
  movie: '',
  cinema: '',
  screen: '',
  date: '',
  startTime: '',
  ticketPrice: 10,
};

export default function AdminShowsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('SCHEDULED');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showsQuery = useApi(
    () => adminApi.listShows({ status: statusFilter || undefined, page, limit: 20 }),
    [statusFilter, page]
  );
  const moviesQuery = useApi(() => moviesApi.list({ limit: 100 }), []);
  const cinemasQuery = useApi(() => cinemasApi.list({ limit: 100 }), []);
  const screensQuery = useApi(
    () =>
      form.cinema
        ? screensApi.listByCinema(form.cinema)
        : Promise.resolve({ data: { screens: [] } }),
    [form.cinema]
  );

  const shows = showsQuery.data?.data?.shows || [];
  const pagination = showsQuery.data?.data?.pagination;
  const movies = moviesQuery.data?.data?.movies || [];
  const cinemas = cinemasQuery.data?.data?.cinemas || [];
  const screens = screensQuery.data?.data?.screens || [];

  useEffect(() => {
    setForm((f) => {
      if (!f.movie && movies.length) return { ...f, movie: movies[0]._id };
      return f;
    });
  }, [movies]);

  useEffect(() => {
    setForm((f) => {
      if (!f.cinema && cinemas.length) return { ...f, cinema: cinemas[0]._id };
      return f;
    });
  }, [cinemas]);

  useEffect(() => {
    setForm((f) => {
      if (screens.length && !screens.find((s) => s._id === f.screen)) {
        return { ...f, screen: screens[0]._id };
      }
      return f;
    });
  }, [screens]);

  const openCreate = () => {
    setForm((f) => ({
      ...EMPTY,
      movie: f.movie || movies[0]?._id || '',
      cinema: f.cinema || cinemas[0]?._id || '',
      screen: screens[0]?._id || '',
    }));
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!form.movie || !form.cinema || !form.screen || !form.startTime || !form.ticketPrice) {
        toast.error('Please fill in all fields');
        return;
      }
      const startTime = new Date(form.startTime).toISOString();
      const date = startTime.slice(0, 10);

      await showsApi.create({
        movie: form.movie,
        cinema: form.cinema,
        screen: form.screen,
        date,
        startTime,
        ticketPrice: Number(form.ticketPrice),
      });
      toast.success('Show created');
      setModalOpen(false);
      showsQuery.refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const doCancel = async () => {
    try {
      await showsApi.cancel(confirmCancel._id);
      toast.success('Show cancelled');
      setConfirmCancel(null);
      showsQuery.refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const doDelete = async () => {
    try {
      await showsApi.remove(confirmDelete._id);
      toast.success('Show deleted');
      setConfirmDelete(null);
      showsQuery.refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'movie', label: 'Movie', render: (s) => s.movie?.title },
      {
        key: 'cinema',
        label: 'Cinema / Screen',
        render: (s) => `${s.cinema?.name} · ${s.screen?.name}`,
      },
      { key: 'startTime', label: 'Time', render: (s) => formatDateTime(s.startTime) },
      { key: 'ticketPrice', label: 'Price', render: (s) => formatCurrency(s.ticketPrice) },
      {
        key: 'availableSeats',
        label: 'Seats',
        render: (s) =>
          `${(s.totalSeats || 0) - (s.occupiedSeats?.length || 0)} / ${s.totalSeats || 0}`,
      },
      {
        key: 'status',
        label: 'Status',
        render: (s) => (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(
              s.status?.toLowerCase()
            )}`}
          >
            {s.status}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (s) => (
          <div className="flex justify-end gap-1">
            {s.status === 'SCHEDULED' ? (
              <button
                onClick={() => setConfirmCancel(s)}
                className="rounded p-1.5 text-amber-300 hover:bg-amber-500/10"
                title="Cancel show"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              onClick={() => setConfirmDelete(s)}
              className="rounded p-1.5 text-red-300 hover:bg-red-500/10"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div>
      <PageHeader
        title="Shows"
        subtitle="Schedule screenings across your cinemas"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add show
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        {['SCHEDULED', 'CANCELLED', 'COMPLETED', ''].map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === s
                ? 'bg-brand-500 text-white'
                : 'bg-ink-800 text-ink-200 hover:bg-ink-700'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={shows}
        loading={showsQuery.loading}
        error={showsQuery.error}
        empty={{ icon: CalendarRange, title: 'No shows' }}
        pagination={pagination}
        onPage={setPage}
      />

      <Modal
        open={modalOpen}
        title="Add show"
        onClose={() => !saving && setModalOpen(false)}
        disableClose={saving}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-ghost" disabled={saving}>
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Create show'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Movie</label>
            <select
              value={form.movie}
              onChange={(e) => setForm((f) => ({ ...f, movie: e.target.value }))}
              className="input"
            >
              <option value="">Select movie</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cinema</label>
            <select
              value={form.cinema}
              onChange={(e) => setForm((f) => ({ ...f, cinema: e.target.value }))}
              className="input"
            >
              <option value="">Select cinema</option>
              {cinemas.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Screen</label>
            <select
              value={form.screen}
              onChange={(e) => setForm((f) => ({ ...f, screen: e.target.value }))}
              className="input"
            >
              <option value="">Select screen</option>
              {screens.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Start time</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Ticket price</label>
            <input
              type="number"
              step="0.01"
              value={form.ticketPrice}
              onChange={(e) => setForm((f) => ({ ...f, ticketPrice: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmCancel)}
        title="Cancel show?"
        description="Any pending bookings will need to be refunded manually."
        confirmLabel="Cancel show"
        onConfirm={doCancel}
        onClose={() => setConfirmCancel(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete show?"
        description="Shows with confirmed bookings cannot be deleted."
        confirmLabel="Delete"
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}