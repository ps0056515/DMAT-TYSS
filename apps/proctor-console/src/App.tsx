import { useEffect, useState } from 'react';
import { Button, StaffNav, StatusBadge, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';

export function App() {
  const [email, setEmail] = useState('proctor@dmat.de');
  const [password, setPassword] = useState('password123');
  const [flags, setFlags] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [loggedIn, setLoggedIn] = useState(!!api.getToken());

  const loadFlags = () => api.getProctorFlags().then(setFlags).catch(console.error);

  useEffect(() => {
    if (loggedIn) loadFlags();
  }, [loggedIn]);

  const login = async () => {
    const res = await api.login(email, password);
    api.setToken(res.accessToken);
    setLoggedIn(true);
  };

  const act = async (action: 'dismiss' | 'warn' | 'escalate') => {
    if (!selected) return;
    await api.reviewFlag(selected.id as string, action);
    loadFlags();
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Proctor login</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8, width: 280 }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8, width: 280 }} />
        <Button onClick={login}>Sign in</Button>
      </div>
    );
  }

  const session = selected?.session as Record<string, unknown> | undefined;
  const booking = session?.booking as Record<string, unknown> | undefined;
  const candidate = booking?.candidate as Record<string, unknown> | undefined;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#FAFAF9' }}>
      <StaffNav title="Proctor review console" subtitle={`${flags.length} flags in queue`} />
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: '80vh' }}>
        <aside style={{ borderRight: `0.5px solid ${tokens.border}`, padding: 16 }}>
          {flags.map((flag) => (
            <button
              key={flag.id as string}
              type="button"
              onClick={() => setSelected(flag)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 12,
                marginBottom: 8,
                border: 'none',
                borderLeft: selected?.id === flag.id ? `3px solid ${tokens.accent}` : '3px solid transparent',
                backgroundColor: selected?.id === flag.id ? tokens.accentLight : tokens.surface2,
                cursor: 'pointer',
              }}
            >
              <StatusBadge label={String(flag.severity)} tone={flag.severity === 'HIGH' ? 'danger' : 'warning'} />
              <div style={{ fontSize: 14, marginTop: 4 }}>{flag.description as string}</div>
            </button>
          ))}
        </aside>
        <main style={{ padding: 24 }}>
          {selected ? (
            <>
              <div style={{ backgroundColor: tokens.surface1, aspectRatio: '16/9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                Clip: {String(selected.clipUrl ?? 'n/a')}
              </div>
              <p>Candidate: {candidate ? `${candidate.firstName} ${candidate.lastName}` : '—'}</p>
              <p>AI confidence: {String(selected.aiConfidence ?? '—')}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <Button variant="secondary" onClick={() => act('dismiss')}>Dismiss</Button>
                <Button variant="secondary" onClick={() => act('warn')}>Send warning</Button>
                <Button variant="danger" onClick={() => act('escalate')}>Escalate</Button>
              </div>
              {session?.id && (
                <Button
                  style={{ marginTop: 16 }}
                  onClick={() => api.resolveProctoring(session.id as string).then(loadFlags)}
                >
                  Resolve session → grading
                </Button>
              )}
            </>
          ) : (
            <p>Select a flag from the queue</p>
          )}
        </main>
      </div>
    </div>
  );
}
