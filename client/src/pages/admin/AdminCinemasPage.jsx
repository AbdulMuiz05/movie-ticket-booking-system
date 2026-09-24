import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, MapPin } from 'lucide-react';
import { cinemasApi } from '../../api/index.js';
import { extractApiError } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

const EMPTY = {
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
  facilities: '',
  images: '',
  active: true,
};

export default function AdminCinemasPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, loading, error, refetch } = useApi(
    () => cinemasApi.list({ page, limit: 20, active: undefined }),
    [page]
  );

  const cinemas = data?.data?.cinemas || [];
  const pagination = data?.data?.pagination;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      ...EMPTY,
      ...c,
      facilities: (c.facilities || []).join(', '),
      images: (c.images || []).join(', '),
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        facilities: form.facilities
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        images: form.images
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      };
      if (editing) {
        await cinemasApi.update(editing._id, payload);
        toast.success('Cinema updated');
      } else {
        await cinemasApi.create(payload);
        toast.success('Cinema created');
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
    try {
      await cinemasApi.remove(confirmDelete._id);
      toast.success('Cinema deactivated');
      setConfirmDelete(null);
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      {
        key: 'location',
        label: 'Location',
        render: (c) => (
          <span className="inline-flex items-center gap-1.5 text-ink-200">
            <MapPin className="h-3 w-3 text-ink-500" /> {c.city}, {c.state || c.country}
          </span>
        ),
      },
      { key: 'address', label: 'Address' },
      {
        key: 'facilities',
        label: 'Facilities',
        render: (c) => (c.facilities || []).slice(0, 2).join(', ') || '—',
      },
      {
        key: 'active',
        label: 'Status',
        render: (c) =>
          c.active ? (
            <span className="chip border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              Active
            </span>
          ) : (
            <span className="chip border-red-500/40 bg-red-500/10 text-red-300">Inactive</span>
          ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (c) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => openEdit(c)}
              className="rounded p-1.5 text-ink-300 hover:bg-ink-700 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(c)}
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
        title="Cinemas"
        subtitle="Manage your cinema locations"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add cinema
          </button>
        }
      />

      <DataTable
        columns={columns}
        rows={cinemas}
        loading={loading}
        error={error}
        empty={{ icon: Building2, title: 'No cinemas yet' }}
        pagination={pagination}
        onPage={setPage}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Edit cinema' : 'Add cinema'}
        size="lg"
        onClose={() => !saving && setModalOpen(false)}
        disableClose={saving}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-ghost" disabled={saving}>
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create cinema'}
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
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">State</label>
            <input
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Postal code</label>
            <input
              value={form.postalCode}
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Country</label>
            <input
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Facilities (comma separated)</label>
            <input
              value={form.facilities}
              onChange={(e) => setForm((f) => ({ ...f, facilities: e.target.value }))}
              className="input"
              placeholder="Dolby Atmos, Parking, Food Court"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Images (comma separated URLs)</label>
            <input
              value={form.images}
              onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Deactivate cinema?"
        description={
          confirmDelete
            ? `"${confirmDelete.name}" and its screens will be deactivated.`
            : ''
        }
        confirmLabel="Deactivate"
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}