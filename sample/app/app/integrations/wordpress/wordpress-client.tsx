'use client';

import { useMemo, useState } from 'react';

type Integration = {
  id: string;
  siteUrl: string;
  username: string;
  lastVerifiedAt: string | Date | null;
  wpUserId: number | null;
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className='rounded-3xl border border-zinc-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 p-6 shadow-sm'>
      {children}
    </div>
  );
}

export function WordPressIntegrationClient({
  integrations,
}: {
  integrations: Integration[];
}) {
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const hasAny = integrations.length > 0;
  const latest = integrations[0];

  const help = useMemo(
    () => [
      'In WordPress admin: Users → Profile → Application Passwords.',
      'Create a password named “ArticleAlchemist” and paste it here.',
      'If a security plugin blocks REST API, whitelisting /wp-json/ may be required.',
    ],
    []
  );

  const test = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/integrations/wordpress/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, username, appPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Test failed');
      setMsg(`Connected as WordPress user #${json?.wpUser?.id}. Looks good.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/integrations/wordpress/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, username, appPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Connect failed');
      setMsg('WordPress connected. You can now publish from any article page.');
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async (siteUrlToDisconnect?: string) => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/integrations/wordpress/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: siteUrlToDisconnect || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Disconnect failed');
      setMsg('Disconnected.');
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <p className='text-sm font-medium'>Connect a WordPress site</p>
        <p className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>
          We use WordPress <span className='font-medium'>Application Passwords</span> (Option A).
          Credentials are encrypted in your database.
        </p>

        <div className='mt-5 grid grid-cols-1 gap-3'>
          <div>
            <label className='text-xs text-zinc-600 dark:text-zinc-400'>Site URL</label>
            <input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder='https://your-site.com'
              className='mt-1 w-full rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10'
            />
          </div>
          <div>
            <label className='text-xs text-zinc-600 dark:text-zinc-400'>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='admin'
              className='mt-1 w-full rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10'
            />
          </div>
          <div>
            <label className='text-xs text-zinc-600 dark:text-zinc-400'>
              Application password
            </label>
            <input
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder='xxxx xxxx xxxx xxxx xxxx xxxx'
              type='password'
              className='mt-1 w-full rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10'
            />
          </div>
        </div>

        <div className='mt-5 flex flex-wrap gap-3'>
          <button
            onClick={test}
            disabled={busy}
            className='px-4 py-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors disabled:opacity-60'
          >
            Test connection
          </button>
          <button
            onClick={connect}
            disabled={busy}
            className='bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-60'
          >
            Connect
          </button>
          {hasAny && (
            <button
              onClick={() => disconnect()}
              disabled={busy}
              className='px-4 py-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors disabled:opacity-60'
            >
              Disconnect all
            </button>
          )}
        </div>

        {msg && (
          <p className='mt-4 text-sm text-zinc-700 dark:text-zinc-300'>
            {msg}
          </p>
        )}

        <div className='mt-6 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/20 p-4'>
          <p className='text-sm font-medium'>Setup checklist</p>
          <ul className='mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300'>
            {help.map((h) => (
              <li key={h}>• {h}</li>
            ))}
          </ul>
        </div>
      </Card>

      {hasAny && (
        <Card>
          <p className='text-sm font-medium'>Connected sites</p>
          <div className='mt-4 space-y-3'>
            {integrations.map((i, idx) => (
              <div
                key={i.id}
                className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/20 p-4'
              >
                <div>
                  <p className='text-sm font-medium'>
                    {i.siteUrl} {idx === 0 ? <span className='text-xs text-zinc-500 dark:text-zinc-400'>(default)</span> : null}
                  </p>
                  <p className='mt-1 text-xs text-zinc-600 dark:text-zinc-400'>
                    User: {i.username} {i.wpUserId ? `• WP user #${i.wpUserId}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => disconnect(i.siteUrl)}
                  disabled={busy}
                  className='px-4 py-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors disabled:opacity-60'
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>

          {latest && (
            <p className='mt-4 text-xs text-zinc-600 dark:text-zinc-400'>
              When publishing, we use the most recently connected site by default.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}






