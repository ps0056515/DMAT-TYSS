'use client';

import { useEffect, useState } from 'react';
import { Button, StaffNav, StatCard, StatusBadge, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';

export default function TestCenterPage() {
  const [email, setEmail] = useState('staff@dmat.de');
  const [password, setPassword] = useState('password123');
  const [loggedIn, setLoggedIn] = useState(!!api.getToken());
  const [session, setSession] = useState<Record<string, unknown> | null>(null);

  const load = () => api.getTestCenterSession().then(setSession).catch(console.error);

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn]);

  const login = async () => {
    const res = await api.login(email, password);
    api.setToken(res.accessToken);
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 32 }}>
        <h1>Test center staff login</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8 }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8 }} />
        <Button onClick={login}>Sign in</Button>
      </div>
    );
  }

  const stats = session?.stats as Record<string, number> | undefined;
  const candidates = (session?.candidates as Record<string, unknown>[]) ?? [];
  const center = session?.center as Record<string, string> | undefined;

  return (
    <>
      <StaffNav title={center?.name ?? 'Test Center'} subtitle={`Room ${center?.room ?? '—'}`} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Expected" value={stats?.expected ?? 0} />
          <StatCard label="Checked in" value={stats?.checkedIn ?? 0} tone="success" />
          <StatCard label="In progress" value={stats?.inProgress ?? 0} />
          <StatCard label="No-shows" value={stats?.noShows ?? 0} tone="danger" />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, backgroundColor: '#fff', borderRadius: 12 }}>
          <thead>
            <tr style={{ backgroundColor: tokens.surface1, textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Seat</th>
              <th style={{ padding: 12 }}>Module</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.bookingId as string} style={{ borderTop: `0.5px solid ${tokens.border}` }}>
                <td style={{ padding: 12 }}>{c.name as string}</td>
                <td style={{ padding: 12 }}>{c.seat as string}</td>
                <td style={{ padding: 12 }}>{c.module as string}</td>
                <td style={{ padding: 12 }}>
                  <StatusBadge
                    label={String(c.status).replace('_', ' ')}
                    tone={c.status === 'in_progress' ? 'success' : c.status === 'no_show' ? 'danger' : 'neutral'}
                  />
                </td>
                <td style={{ padding: 12 }}>
                  {c.status === 'awaiting' && (
                    <Button onClick={() => api.checkIn(c.bookingId as string).then(load)}>Check in</Button>
                  )}
                  {c.status === 'in_progress' && (
                    <Button variant="secondary" onClick={() => api.logIncident(c.bookingId as string, { type: 'disruption', notes: 'Logged from console' }).then(load)}>
                      Log incident
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
