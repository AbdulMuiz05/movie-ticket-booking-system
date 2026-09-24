import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { extractApiError } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);

  const { data, loading, error, refetch } = useApi(
    () => adminApi.listUsers({ role: role || undefined, q: q || undefined, page, limit: 20 }),
    [role, q, page]
  );

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  const toggleRole = async (u) => {
    try {
      const next = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
      await adminApi.updateUserRole(u._id, next);
      toast.success(`Role set to ${next}`);
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const toggleActive = async (u) => {
    try {
      await adminApi.setUserActive(u._id, !u.active);
      toast.success(u.active ? 'User deactivated' : 'User activated');
      setConfirm(null);
      refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      {
        key: 'role',
        label: 'Role',
        render: (u) => (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
              u.role === 'ADMIN'
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-300'
                : 'border-ink-600 bg-ink-800 text-ink-300'
            }`}
          >
            {u.role}
          </span>
        ),
      },
      {
        key: 'active',
        label: 'Status',
        render: (u) =>
          u.active ? (
            <span className="chip border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              Active
            </span>
          ) : (
            <span className="chip border-red-500/40 bg-red-500/10 text-red-300">
              Inactive
            </span>
          ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (u) =>
          u._id === me?._id ? (
            <span className="text-xs text-ink-500">(you)</span>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => toggleRole(u)}
                className="inline-flex items-center gap-1 rounded border border-ink-600 px-2 py-1 text-xs text-ink-200 hover:border-brand-500 hover:text-brand-300"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
              </button>
              <button
                onClick={() => setConfirm(u)}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                  u.active
                    ? 'border-red-500/40 text-red-300 hover:bg-red-500/10'
                    : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
                }`}
              >
                {u.active ? (
                  <>
                    <UserX className="h-3.5 w-3.5" /> Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5" /> Activate
                  </>
                )}
              </button>
            </div>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me?._id]
  );

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage accounts and roles" />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search users…"
          className="input sm:w-64"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="input sm:w-48"
        >
          <option value="">All roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        error={error}
        empty={{ icon: Users, title: 'No users found' }}
        pagination={pagination}
        onPage={setPage}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.active ? 'Deactivate user?' : 'Activate user?'}
        description={
          confirm
            ? `${confirm.name} will be ${confirm.active ? 'unable to' : 'able to'} sign in.`
            : ''
        }
        confirmLabel={confirm?.active ? 'Deactivate' : 'Activate'}
        tone={confirm?.active ? 'danger' : 'primary'}
        onConfirm={() => toggleActive(confirm)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}