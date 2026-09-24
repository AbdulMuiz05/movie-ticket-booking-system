import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Armchair, Save } from 'lucide-react';
import { cinemasApi, screensApi, seatsApi } from '../../api/index.js';
import { extractApiError } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import { groupSeatsByRow } from '../../lib/seatLayout.js';

const TYPES = ['REGULAR', 'PREMIUM', 'RECLINER'];

export default function AdminSeatsPage() {
  const cinemasQuery = useApi(() => cinemasApi.list({ limit: 100 }), []);
  const cinemas = cinemasQuery.data?.data?.cinemas || [];

  const [cinemaId, setCinemaId] = useState('');
  useEffect(() => {
    if (!cinemaId && cinemas.length) setCinemaId(cinemas[0]._id);
  }, [cinemas, cinemaId]);

  const screensQuery = useApi(
    () => (cinemaId ? screensApi.listByCinema(cinemaId) : Promise.resolve({ data: { screens: [] } })),
    [cinemaId]
  );
  const screens = screensQuery.data?.data?.screens || [];

  const [screenId, setScreenId] = useState('');
  useEffect(() => {
    if (screens.length && !screens.find((s) => s._id === screenId)) {
      setScreenId(screens[0]._id);
    }
    if (!screens.length) setScreenId('');
  }, [screens, screenId]);

  const seatsQuery = useApi(
    () => (screenId ? seatsApi.listByScreen(screenId) : Promise.resolve({ data: { seats: [] } })),
    [screenId]
  );
  const seats = seatsQuery.data?.data?.seats || [];
  const rows = useMemo(() => groupSeatsByRow(seats), [seats]);

  const [editRow, setEditRow] = useState(null);
  const [rowForm, setRowForm] = useState({ seatType: 'REGULAR', priceMultiplier: 1 });
  const [saving, setSaving] = useState(false);

  const openRow = (row, seats) => {
    const first = seats[0];
    setEditRow({ row, seatIds: seats.map((s) => s._id) });
    setRowForm({
      seatType: first.seatType,
      priceMultiplier: first.priceMultiplier,
    });
  };

  const saveRow = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await Promise.all(
        editRow.seatIds.map((id) =>
          seatsApi.update(id, {
            seatType: rowForm.seatType,
            priceMultiplier: Number(rowForm.priceMultiplier),
          })
        )
      );
      toast.success('Row updated');
      setEditRow(null);
      seatsQuery.refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const seatColor = (seatType) =>
    ({
      PREMIUM: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      RECLINER: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    }[seatType] || 'bg-ink-700 border-ink-600 text-ink-100');

  return (
    <div>
      <PageHeader title="Seats" subtitle="View and configure seat layout per screen" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Cinema</label>
          <select
            value={cinemaId}
            onChange={(e) => setCinemaId(e.target.value)}
            className="input"
          >
            <option value="">Select cinema</option>
            {cinemas.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} — {c.city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Screen</label>
          <select
            value={screenId}
            onChange={(e) => setScreenId(e.target.value)}
            className="input"
            disabled={!screens.length}
          >
            <option value="">Select screen</option>
            {screens.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.capacity} seats)
              </option>
            ))}
          </select>
        </div>
      </div>

      {!screenId ? (
        <EmptyState icon={Armchair} title="Pick a cinema and screen to view seats" />
      ) : seatsQuery.loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={Armchair} title="No seats generated for this screen" />
      ) : (
        <div className="card overflow-x-auto p-5">
          <div className="mx-auto mb-6 max-w-md">
            <div className="h-2 rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
            <p className="mt-2 text-center text-[11px] uppercase tracking-[0.25em] text-ink-400">
              Screen
            </p>
          </div>

          <div className="space-y-2">
            {rows.map(({ row, seats: rowSeats }) => (
              <div key={row} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRow(row, rowSeats)}
                  className="flex items-center gap-1 rounded-md border border-ink-700 px-2 py-1 text-xs font-semibold text-ink-200 hover:border-brand-500"
                  title="Edit row"
                >
                  {row} <Save className="h-3 w-3 opacity-60" />
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {rowSeats.map((s) => (
                    <div
                      key={s._id}
                      title={`${s.seatNumber} · ${s.seatType} × ${s.priceMultiplier}`}
                      className={`grid h-8 w-8 place-items-center rounded border text-[10px] font-semibold ${seatColor(
                        s.seatType
                      )}`}
                    >
                      {s.column}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={Boolean(editRow)}
        title={`Configure row ${editRow?.row || ''}`}
        size="sm"
        onClose={() => !saving && setEditRow(null)}
        disableClose={saving}
        footer={
          <>
            <button
              onClick={() => setEditRow(null)}
              disabled={saving}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button onClick={saveRow} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save row'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Seat type</label>
            <select
              value={rowForm.seatType}
              onChange={(e) => setRowForm((f) => ({ ...f, seatType: e.target.value }))}
              className="input"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Price multiplier</label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={rowForm.priceMultiplier}
              onChange={(e) => setRowForm((f) => ({ ...f, priceMultiplier: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}