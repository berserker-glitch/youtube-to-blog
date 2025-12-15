'use client';

import { useMemo, useState } from 'react';

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string | Date;
  plan: 'free' | 'pro' | 'premium';
  subscriptionStatus: 'inactive' | 'active' | 'past_due' | 'canceled';
  role: 'user' | 'super_admin';
};

type RoutingRow = {
  plan: 'free' | 'pro' | 'premium';
  chaptersModel: string;
  writerModel: string;
  feedbackModel: string;
};

function fmtDate(v: string | Date) {
  const d = typeof v === 'string' ? new Date(v) : v;
  return d.toLocaleString();
}

export function AdminDashboardClient(props: {
  initialUsers: UserRow[];
  initialRoutings: RoutingRow[];
}) {
  const [users, setUsers] = useState<UserRow[]>(props.initialUsers);
  const [routings, setRoutings] = useState<RoutingRow[]>(props.initialRoutings);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const routingByPlan = useMemo(() => {
    const m = new Map<RoutingRow['plan'], RoutingRow>();
    for (const r of routings) m.set(r.plan, r);
    return m;
  }, [routings]);

  const updateUser = async (id: string, patch: Partial<UserRow>) => {
    setMsg(null);
    setBusy(`user:${id}`);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...json.user } : u)));
      setMsg('User updated.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const updateRouting = async (plan: RoutingRow['plan'], next: RoutingRow) => {
    setMsg(null);
    setBusy(`routing:${plan}`);
    try {
      const res = await fetch('/api/admin/model-routing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');

      setRoutings((prev) => prev.map((r) => (r.plan === plan ? json.routing : r)));
      setMsg('Model routing updated.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const setRoutingField = (plan: RoutingRow['plan'], field: keyof Omit<RoutingRow, 'plan'>, value: string) => {
    setRoutings((prev) =>
      prev.map((r) => (r.plan === plan ? { ...r, [field]: value } : r))
    );
  };

  return (
    <div className='space-y-8'>
      {msg ? (
        <div className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-4 text-sm text-zinc-800 dark:text-zinc-200'>
          {msg}
        </div>
      ) : null}

      <section className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-5 sm:p-6'>
        <h2 className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
          Model routing per plan
        </h2>
        <p className='mt-1 text-sm text-zinc-700 dark:text-zinc-300'>
          These values are used by the generator API. Changing them affects future generations.
        </p>

        <div className='mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {(['free', 'pro', 'premium'] as const).map((plan) => {
            const r = routingByPlan.get(plan);
            if (!r) return null;
            return (
              <div key={plan} className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-4'>
                <p className='text-sm font-medium text-zinc-900 dark:text-zinc-50'>
                  {plan === 'free' ? 'Basic (Free)' : plan === 'pro' ? 'Pro' : 'Premium'}
                </p>

                <label className='mt-3 block text-xs text-zinc-500 dark:text-zinc-400'>Chapterer model</label>
                <input
                  value={r.chaptersModel}
                  onChange={(e) => setRoutingField(plan, 'chaptersModel', e.target.value)}
                  className='mt-1 w-full rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm'
                />

                <label className='mt-3 block text-xs text-zinc-500 dark:text-zinc-400'>Writer model</label>
                <input
                  value={r.writerModel}
                  onChange={(e) => setRoutingField(plan, 'writerModel', e.target.value)}
                  className='mt-1 w-full rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm'
                />

                <label className='mt-3 block text-xs text-zinc-500 dark:text-zinc-400'>Feedback model</label>
                <input
                  value={r.feedbackModel}
                  onChange={(e) => setRoutingField(plan, 'feedbackModel', e.target.value)}
                  className='mt-1 w-full rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm'
                />

                <button
                  disabled={busy !== null}
                  onClick={() => updateRouting(plan, r)}
                  className='mt-4 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 text-sm transition-colors disabled:opacity-60'
                >
                  {busy === `routing:${plan}` ? 'Saving…' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className='rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-5 sm:p-6'>
        <h2 className='text-lg font-medium text-zinc-900 dark:text-zinc-50'>
          Users
        </h2>
        <p className='mt-1 text-sm text-zinc-700 dark:text-zinc-300'>
          Upgrade/downgrade plans and manage roles.
        </p>

        <div className='mt-4 overflow-auto rounded-2xl border border-zinc-200/70 dark:border-zinc-800'>
          <table className='min-w-[980px] w-full text-sm'>
            <thead className='bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-300'>
              <tr>
                <th className='text-left font-medium px-4 py-3'>Email</th>
                <th className='text-left font-medium px-4 py-3'>Name</th>
                <th className='text-left font-medium px-4 py-3'>Created</th>
                <th className='text-left font-medium px-4 py-3'>Role</th>
                <th className='text-left font-medium px-4 py-3'>Plan</th>
                <th className='text-left font-medium px-4 py-3'>Subscription</th>
                <th className='text-left font-medium px-4 py-3'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className='border-t border-zinc-200/70 dark:border-zinc-800'>
                  <td className='px-4 py-3 text-zinc-900 dark:text-zinc-100'>
                    {u.email || '(no email)'}
                  </td>
                  <td className='px-4 py-3 text-zinc-700 dark:text-zinc-300'>
                    {u.name || ''}
                  </td>
                  <td className='px-4 py-3 text-zinc-700 dark:text-zinc-300'>
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className='px-4 py-3'>
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as any })}
                      disabled={busy !== null}
                      className='rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm'
                    >
                      <option value='user'>user</option>
                      <option value='super_admin'>super_admin</option>
                    </select>
                  </td>
                  <td className='px-4 py-3'>
                    <select
                      value={u.plan}
                      onChange={(e) => updateUser(u.id, { plan: e.target.value as any })}
                      disabled={busy !== null}
                      className='rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm'
                    >
                      <option value='free'>free</option>
                      <option value='pro'>pro</option>
                      <option value='premium'>premium</option>
                    </select>
                  </td>
                  <td className='px-4 py-3'>
                    <select
                      value={u.subscriptionStatus}
                      onChange={(e) => updateUser(u.id, { subscriptionStatus: e.target.value as any })}
                      disabled={busy !== null}
                      className='rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm'
                    >
                      <option value='inactive'>inactive</option>
                      <option value='active'>active</option>
                      <option value='past_due'>past_due</option>
                      <option value='canceled'>canceled</option>
                    </select>
                  </td>
                  <td className='px-4 py-3'>
                    <button
                      disabled={busy !== null}
                      onClick={() => updateUser(u.id, {})}
                      className='rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 disabled:opacity-60'
                      title='No-op (kept for future bulk actions)'
                    >
                      {busy === `user:${u.id}` ? 'Updating…' : '—'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
