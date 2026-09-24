import { useState } from 'react';
import { LogOut, UserCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { extractApiError } from '../api/client.js';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';

export default function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profile);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwd.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSavingPwd(true);
    try {
      await changePassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Profile" subtitle="Manage your account details" />

      <div className="card mb-6 flex items-center gap-4 p-5">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-brand-500 text-white">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserCircle2 className="h-8 w-8" />
          )}
        </div>
        <div>
          <p className="font-semibold text-white">{user?.name}</p>
          <p className="text-xs text-ink-400">{user?.email}</p>
          <span className="chip-brand mt-2 text-[11px]">{user?.role}</span>
        </div>
        <button
          onClick={logout}
          className="btn-outline ml-auto"
          type="button"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <form onSubmit={saveProfile} className="card mb-6 space-y-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">
          Account details
        </h2>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input
            id="phone"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="avatar">Avatar URL</label>
          <input
            id="avatar"
            value={profile.avatar}
            onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))}
            className="input"
            placeholder="https://…"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <form onSubmit={savePassword} className="card space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-300">
          <KeyRound className="h-4 w-4" /> Change password
        </h2>
        <div>
          <label className="label" htmlFor="cur">Current password</label>
          <input
            id="cur"
            type="password"
            value={pwd.currentPassword}
            onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
            className="input"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="new">New password</label>
            <input
              id="new"
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="conf">Confirm new password</label>
            <input
              id="conf"
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              className="input"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={savingPwd} className="btn-primary">
            {savingPwd ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}