import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Download, Film } from 'lucide-react';
import { adminApi, moviesApi } from '../../api/index.js';
import { extractApiError } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { formatDate, formatDuration } from '../../lib/formatters.js';

const EMPTY_MOVIE = {
  title: '',
  description: '',
  poster: '',
  backdrop: '',
  trailer: '',
  language: 'EN',
  genre: '',
  duration: 120,
  releaseDate: '',
  rating: 0,
  status: 'NOW_SHOWING',
  active: true,
};

export default function AdminMoviesPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MOVIE);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tmdbOpen, setTmdbOpen] = useState(false);

  const debouncedQ = useDebounce(q, 300);

  const { data, loading, error, refetch } = useApi(
    () => moviesApi.list({ q: debouncedQ || undefined, status: status || undefined, page, limit: 20 }),
    [debouncedQ, status, page]
  );

  const movies = data?.data?.movies || [];
  const pagination = data?.data?.pagination;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_MOVIE);
    setModalOpen(true);
  };

  const openEdit = (movie) => {
    setEditing(movie);
    setForm({
      ...EMPTY_MOVIE,
      ...movie,
      genre: (movie.genre || []).join(', '),
      releaseDate: movie.releaseDate ? movie.releaseDate.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        rating: Number(form.rating),
        genre: form.genre
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
      };
      if (editing) {
        await moviesApi.update(editing._id, payload);
        toast.success('Movie updated');
      } else {
        await moviesApi.create(payload);
        toast.success('Movie created');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await moviesApi.remove(confirmDelete._id);
      toast.success('Movie deactivated');
      setConfirmDelete(null);
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'poster',
        label: '',
        render: (m) => (
          <img
            src={m.poster}
            alt=""
            className="h-14 w-10 rounded object-cover"
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          />
        ),
      },
      { key: 'title', label: 'Title' },
      {
        key: 'genre',
        label: 'Genres',
        render: (m) => (m.genre || []).slice(0, 3).join(', ') || '—',
      },
      { key: 'duration', label: 'Duration', render: (m) => formatDuration(m.duration) },
      { key: 'releaseDate', label: 'Released', render: (m) => formatDate(m.releaseDate) },
      { key: 'rating', label: 'Rating', render: (m) => (m.rating || 0).toFixed(1) },
      {
        key: 'status',
        label: 'Status',
        render: (m) => (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
              m.status === 'NOW_SHOWING'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : m.status === 'UPCOMING'
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                : 'border-ink-600 bg-ink-800 text-ink-300'
            }`}
          >
            {m.status}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (m) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => openEdit(m)}
              className="rounded p-1.5 text-ink-300 hover:bg-ink-700 hover:text-white"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(m)}
              className="rounded p-1.5 text-red-300 hover:bg-red-500/10"
              title="Deactivate"
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
        title="Movies"
        subtitle="Manage your movie library"
        actions={
          <>
            <button onClick={() => setTmdbOpen(true)} className="btn-outline">
              <Download className="h-4 w-4" /> Import from TMDB
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> Add movie
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search movies…"
            className="input pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input sm:w-52"
        >
          <option value="">All statuses</option>
          <option value="NOW_SHOWING">Now showing</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="ENDED">Ended</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={movies}
        loading={loading}
        error={error}
        empty={{ icon: Film, title: 'No movies found' }}
        pagination={pagination}
        onPage={setPage}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Edit movie' : 'Add movie'}
        size="lg"
        onClose={() => !saving && setModalOpen(false)}
        disableClose={saving}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create movie'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Poster URL</label>
            <input
              value={form.poster}
              onChange={(e) => setForm((f) => ({ ...f, poster: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Backdrop URL</label>
            <input
              value={form.backdrop}
              onChange={(e) => setForm((f) => ({ ...f, backdrop: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Language</label>
            <input
              value={form.language}
              onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Release date</label>
            <input
              type="date"
              value={form.releaseDate}
              onChange={(e) => setForm((f) => ({ ...f, releaseDate: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Rating (0-10)</label>
            <input
              type="number"
              step="0.1"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Genres (comma separated)</label>
            <input
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="input"
            >
              <option value="NOW_SHOWING">Now showing</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
          <div>
            <label className="label">Trailer URL</label>
            <input
              value={form.trailer}
              onChange={(e) => setForm((f) => ({ ...f, trailer: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </Modal>

      <TmdbImportModal
        open={tmdbOpen}
        onClose={() => setTmdbOpen(false)}
        onImported={() => {
          setTmdbOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Deactivate movie?"
        description={
          confirmDelete
            ? `"${confirmDelete.title}" will be hidden from the site. Future shows will be cancelled.`
            : ''
        }
        confirmLabel="Deactivate"
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function TmdbImportModal({ open, onClose, onImported }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(null);

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await moviesApi.tmdbSearch(q.trim());
      setResults(res.data.results || []);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSearching(false);
    }
  };

  const doImport = async (tmdbId) => {
    setImporting(tmdbId);
    try {
      await moviesApi.tmdbImport(tmdbId);
      toast.success('Movie imported');
      onImported?.();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setImporting(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import from TMDB" size="lg">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search TMDB…"
          className="input"
        />
        <button onClick={search} disabled={searching} className="btn-primary">
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {results.map((r) => (
          <div key={r.tmdbId} className="flex items-center gap-3 rounded-lg border border-ink-700 p-3">
            {r.poster ? (
              <img src={r.poster} alt="" className="h-20 w-14 rounded object-cover" />
            ) : (
              <div className="grid h-20 w-14 place-items-center rounded bg-ink-800 text-ink-600">
                <Film className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{r.title}</p>
              <p className="mt-0.5 text-xs text-ink-400">
                {r.releaseDate || '—'} · Rating {(r.rating || 0).toFixed(1)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-500">{r.overview}</p>
            </div>
            <button
              onClick={() => doImport(r.tmdbId)}
              disabled={importing === r.tmdbId}
              className="btn-primary !py-1.5 !text-xs"
            >
              {importing === r.tmdbId ? 'Importing…' : 'Import'}
            </button>
          </div>
        ))}
      </div>

      {!results.length && !searching ? (
        <p className="mt-4 text-center text-xs text-ink-500">
          Search for a movie title to import from TMDB.
        </p>
      ) : null}
    </Modal>
  );
}

export const _unused = adminApi;