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
import {
  formatCurrency,
  formatDateTime,
  statusTone,
} from '../../lib/formatters.js';

const EMPTY = {
  movie: '',
  cinema: '',
  screen: '',
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
    () =>
      adminApi.listShows({
        status: statusFilter || undefined,
        page,
        limit: 20,
      }),
    [statusFilter, page]
  );

  const moviesQuery = useApi(
    () => moviesApi.list({ limit: 100 }),
    []
  );

  const cinemasQuery = useApi(
    () => cinemasApi.list({ limit: 100 }),
    []
  );

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
    setForm((current) => {
      if (!current.movie && movies.length) {
        return {
          ...current,
          movie: String(movies[0].tmdbId),
        };
      }

      return current;
    });
  }, [movies]);

  useEffect(() => {
    setForm((current) => {
      if (!current.cinema && cinemas.length) {
        return {
          ...current,
          cinema: cinemas[0]._id,
        };
      }

      return current;
    });
  }, [cinemas]);

  useEffect(() => {
    setForm((current) => {
      if (
        screens.length &&
        !screens.find((screen) => screen._id === current.screen)
      ) {
        return {
          ...current,
          screen: screens[0]._id,
        };
      }

      return current;
    });
  }, [screens]);

  const openCreate = () => {
    setForm({
      ...EMPTY,
      movie: movies[0] ? String(movies[0].tmdbId) : '',
      cinema: cinemas[0]?._id || '',
      screen: screens[0]?._id || '',
    });

    setModalOpen(true);
  };

  const save = async () => {
    if (
      !form.movie ||
      !form.cinema ||
      !form.screen ||
      !form.startTime ||
      form.ticketPrice === ''
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    const movie = movies.find(
      (item) => String(item.tmdbId) === String(form.movie)
    );

    const screen = screens.find(
      (item) => item._id === form.screen
    );

    if (!movie) {
      toast.error('Selected TMDB movie was not found');
      return;
    }

    if (!screen) {
      toast.error('Selected screen was not found');
      return;
    }

    setSaving(true);

    try {
      const startTime = new Date(form.startTime);

      if (Number.isNaN(startTime.getTime())) {
        throw new Error('Invalid start time');
      }

      const endTime = new Date(
        startTime.getTime() +
          Number(movie.duration || 120) * 60 * 1000
      );

      await showsApi.create({
        tmdbMovieId: Number(movie.tmdbId),
        cinema: form.cinema,
        screen: form.screen,
        date: startTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        ticketPrice: Number(form.ticketPrice),
        totalSeats: Number(screen.capacity),
      });

      toast.success('Show created');
      setModalOpen(false);
      showsQuery.refetch();
    } catch (err) {
      toast.error(
        extractApiError(err).message || err.message
      );
    } finally {
      setSaving(false);
    }
  };

  const doCancel = async () => {
    if (!confirmCancel) return;

    try {
      await showsApi.update(confirmCancel._id, {
        status: 'CANCELLED',
      });

      toast.success('Show cancelled');
      setConfirmCancel(null);
      showsQuery.refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;

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
      {
        key: 'movie',
        label: 'Movie',
        render: (show) => (
          <div>
            <p className="font-medium text-white">
              {show.movie?.title || 'Unknown movie'}
            </p>
            <p className="text-xs text-ink-500">
              TMDB ID: {show.movie?.tmdbId || '—'}
            </p>
          </div>
        ),
      },
      {
        key: 'cinema',
        label: 'Cinema / Screen',
        render: (show) =>
          `${show.cinema?.name || '—'} · ${
            show.screen?.name || '—'
          }`,
      },
      {
        key: 'startTime',
        label: 'Time',
        render: (show) => formatDateTime(show.startTime),
      },
      {
        key: 'ticketPrice',
        label: 'Price',
        render: (show) =>
          formatCurrency(show.ticketPrice),
      },
      {
        key: 'availableSeats',
        label: 'Seats',
        render: (show) =>
          `${show.availableSeats ?? 0} / ${
            show.totalSeats || 0
          }`,
      },
      {
        key: 'status',
        label: 'Status',
        render: (show) => (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(
              show.status?.toLowerCase()
            )}`}
          >
            {show.status}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (show) => (
          <div className="flex justify-end gap-1">
            {show.status === 'SCHEDULED' ? (
              <button
                onClick={() => setConfirmCancel(show)}
                className="rounded p-1.5 text-amber-300 hover:bg-amber-500/10"
                title="Cancel show"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            ) : null}

            <button
              onClick={() => setConfirmDelete(show)}
              className="rounded p-1.5 text-red-300 hover:bg-red-500/10"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="Shows"
        subtitle="Schedule TMDB movies across your cinemas"
        actions={
          <button
            onClick={openCreate}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add show
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        {['SCHEDULED', 'CANCELLED', 'COMPLETED', ''].map(
          (status) => (
            <button
              key={status || 'ALL'}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === status
                  ? 'bg-brand-500 text-white'
                  : 'bg-ink-800 text-ink-200 hover:bg-ink-700'
              }`}
            >
              {status || 'All'}
            </button>
          )
        )}
      </div>

      <DataTable
        columns={columns}
        rows={shows}
        loading={
          showsQuery.loading ||
          moviesQuery.loading ||
          cinemasQuery.loading
        }
        error={
          showsQuery.error ||
          moviesQuery.error ||
          cinemasQuery.error
        }
        empty={{
          icon: CalendarRange,
          title: 'No shows',
        }}
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
            <button
              onClick={() => setModalOpen(false)}
              className="btn-ghost"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              onClick={save}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Create show'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">
              Movie from TMDB
            </label>

            <select
              value={form.movie}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  movie: e.target.value,
                }))
              }
              className="input"
            >
              <option value="">
                Select movie
              </option>

              {movies.map((movie) => (
                <option
                  key={movie.tmdbId}
                  value={movie.tmdbId}
                >
                  {movie.title}
                  {movie.releaseDate
                    ? ` (${movie.releaseDate.slice(0, 4)})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Cinema
            </label>

            <select
              value={form.cinema}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  cinema: e.target.value,
                  screen: '',
                }))
              }
              className="input"
            >
              <option value="">
                Select cinema
              </option>

              {cinemas.map((cinema) => (
                <option
                  key={cinema._id}
                  value={cinema._id}
                >
                  {cinema.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Screen
            </label>

            <select
              value={form.screen}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  screen: e.target.value,
                }))
              }
              className="input"
            >
              <option value="">
                Select screen
              </option>

              {screens.map((screen) => (
                <option
                  key={screen._id}
                  value={screen._id}
                >
                  {screen.name} ({screen.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label">
              Start time
            </label>

            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  startTime: e.target.value,
                }))
              }
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Ticket price
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.ticketPrice}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  ticketPrice: e.target.value,
                }))
              }
              className="input"
            />
          </div>

          <div>
            <label className="label">
              Movie duration
            </label>

            <div className="input bg-ink-900 text-ink-400">
              {(() => {
                const movie = movies.find(
                  (item) =>
                    String(item.tmdbId) ===
                    String(form.movie)
                );

                return movie?.duration
                  ? `${movie.duration} minutes`
                  : 'Select a movie';
              })()}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmCancel)}
        title="Cancel show?"
        description="The show status will be changed to CANCELLED."
        confirmLabel="Cancel show"
        onConfirm={doCancel}
        onClose={() => setConfirmCancel(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete show?"
        description="Shows with occupied seats cannot be deleted."
        confirmLabel="Delete"
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}