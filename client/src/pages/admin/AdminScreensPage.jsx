import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Monitor, RefreshCw } from 'lucide-react';
import { cinemasApi, screensApi } from '../../api/index.js';
import { extractApiError } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

const EMPTY = {
  name: '',
  screenNumber: 1,
  rows: 8,
  columns: 10,
  screenType: 'STANDARD',
  active: true,
};

export default function AdminScreensPage() {
  const cinemasQuery = useApi(() => cinemasApi.list({ limit: 100 }), []);
  const cinemas = cinemasQuery.data?.data?.cinemas || [];

  const [cinemaId, setCinemaId] = useState('');
  useEffect(() => {
    if (!cinemaId && cinemas.length) setCinemaId(cinemas[0]._id);
  }, [cinemas, cinemaId]);

  const { data, loading, error, refetch } = useApi(
    () => (cinemaId ? screensApi.listByCinema(cinemaId) : Promise.resolve({ data: { screens: [] } })),
    [cinemaId]
  );
  const screens = data?.data?.screens || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ ...EMPTY, ...s });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        screenNumber: Number(form.screenNumber),
        rows: Number(form.rows),
        columns: Number(form.columns),
      };
      if (editing) {
        await screensApi.update(editing._id, payload);
        toast.success('Screen updated');
      } else {
        await screensApi.create(cinemaId, payload);
        toast.success('Screen created with auto-generated seats');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async (screen) => {
    try {
      await screensApi.regenerateSeats(screen._id);
      toast.success('Seats regenerated');
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const doDelete = async () => {
    try {
      await screensApi.remove(confirmDelete._id);
      toast.success('Screen deactivated');
      setConfirmDelete(null);
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      { key: 'screenNumber', label: '#', render: (s) => `#${s.screenNumber}` },
      { key: 'screenType', label: 'Type' },
      { key: 'capacity', label: 'Capacity', render: (s) => `${s.capacity} seats` },
      { key: 'rows', label: 'Layout', render: (s) => `${s.rows} × ${s.columns}` },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (s) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => regenerate(s)}
              className="rounded p-1.5 text-ink-300 hover:bg-ink-700 hover:text-white"
              title="Regenerate seats"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => openEdit(s)}
              className="rounded p-1.5 text-ink-300 hover:bg-ink-700 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(s)}
              className="rounded p-1.5 text-red-300 hover:bg-red-500/10"
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
        title="Screens"
        subtitle="Configure screens per cinema"
        actions={
          <button onClick={openCreate} disabled={!cinemaId} className="btn-primary">
            <Plus className="h-4 w-4" /> Add screen
          </button>
        }
      />

      <div className="mb-4">
        <label className="label">Cinema</label>
        <select value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} className="input sm:w-80">
          <option value="">Select a cinema</option>
          {cinemas.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} — {c.city}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={screens}
        loading={loading || cinemasQuery.loading}
        error={error}
        empty={{ icon: Monitor, title: 'No screens for this cinema' }}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Edit screen' : 'Add screen'}
        onClose={() => !saving && setModalOpen(false)}
        disableClose={saving}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-ghost" disabled={saving}>
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Screen number</label>
            <input
              type="number"
              value={form.screenNumber}
              onChange={(e) => setForm((f) => ({ ...f, screenNumber: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              value={form.screenType}
              onChange={(e) => setForm((f) => ({ ...f, screenType: e.target.value }))}
              className="input"
            >
              <option value="STANDARD">Standard</option>
              <option value="IMAX">IMAX</option>
              <option value="3D">3D</option>
              <option value="4DX">4DX</option>
              <option value="DOLBY">Dolby</option>
            </select>
          </div>
          <div>
            <label className="label">Rows</label>
            <input
              type="number"
              value={form.rows}
              onChange={(e) => setForm((f) => ({ ...f, rows: e.target.value }))}
              className="input"
              disabled={Boolean(editing)}
            />
          </div>
          <div>
            <label className="label">Columns</label>
            <input
              type="number"
              value={form.columns}
              onChange={(e) => setForm((f) => ({ ...f, columns: e.target.value }))}
              className="input"
              disabled={Boolean(editing)}
            />
          </div>
          <p className="sm:col-span-2 text-xs text-ink-400">
            Changing rows or columns on an existing screen is disabled. Delete and recreate
            to change the layout.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Deactivate screen?"
        description={
          confirmDelete ? `"${confirmDelete.name}" will no longer be bookable.` : ''
        }
        confirmLabel="Deactivate"
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}