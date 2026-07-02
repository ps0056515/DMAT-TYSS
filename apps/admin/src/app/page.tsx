'use client';

import { useEffect, useState } from 'react';
import { Button, Card, NeedsAttentionRow, ProgressBar, StaffNav, StatCard, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';
import Link from 'next/link';

export default function AdminPage() {
  const [email, setEmail] = useState('admin@dmat.de');
  const [password, setPassword] = useState('password123');
  const [loggedIn, setLoggedIn] = useState(!!api.getToken());
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (loggedIn) api.getAdminOverview().then(setData).catch(console.error);
  }, [loggedIn]);

  const login = async () => {
    const res = await api.login(email, password);
    api.setToken(res.accessToken);
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 32 }}>
        <h1>Admin login</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8 }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8 }} />
        <Button onClick={login}>Sign in</Button>
      </div>
    );
  }

  const kpis = data?.kpis as Record<string, unknown> | undefined;
  const pathways = data?.pathways as Record<string, number> | undefined;
  const needs = (data?.needsAttention as string[]) ?? [];

  return (
    <>
      <StaffNav title="Program overview" subtitle="Live data from API" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Exams delivered" value={String(kpis?.examsDelivered ?? '—')} />
          <StatCard label="Certificates issued" value={String(kpis?.certificatesIssued ?? '—')} />
          <StatCard label="Flag rate" value={String(kpis?.flagRate ?? '—')} />
          <StatCard label="Open appeals" value={String(kpis?.openAppeals ?? 0)} tone="warning" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Card title="Exams by pathway">
            <ProgressBar value={pathways?.remotePct ?? 0} />
            <p style={{ fontSize: 13 }}>Remote {pathways?.remotePct ?? 0}%</p>
            <ProgressBar value={pathways?.physicalPct ?? 0} />
            <p style={{ fontSize: 13 }}>Physical {pathways?.physicalPct ?? 0}%</p>
          </Card>
          <Card title="Needs attention">
            {needs.length ? needs.map((n) => <NeedsAttentionRow key={n} label={n} />) : <p>All clear</p>}
          </Card>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          <Link href="/grading" style={{ color: tokens.accent }}>
            Open grading console →
          </Link>
          <Link href="/questions" style={{ color: tokens.accent }}>
            Manage question bank →
          </Link>
        </div>
      </div>
    </>
  );
}
