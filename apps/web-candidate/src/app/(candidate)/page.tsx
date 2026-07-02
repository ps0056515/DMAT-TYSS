'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AccentBanner,
  Button,
  Card,
  ChecklistRow,
  PageTitle,
  StatCard,
  tokens,
} from '@dmat/ui';
import { api } from '@dmat/api-client';
import { useAuth } from '@/lib/auth';

export default function CandidateDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.getDashboard().then(setData).catch(console.error);
  }, [user]);

  if (loading || !user) return <p>Loading…</p>;
  if (!data) return <p>Loading dashboard…</p>;

  const upcoming = data.upcomingBooking as Record<string, unknown> | null;
  const stats = data.stats as Record<string, unknown>;
  const checklist = data.checklist as { label: string; done: boolean; href: string }[];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <PageTitle
          title={`Welcome back, ${data.firstName as string}`}
          subtitle={
            upcoming
              ? `Your ${upcoming.moduleName as string} exam is in ${stats.daysUntilExam} days`
              : 'Book your exam to get started'
          }
        />
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </div>

      {upcoming ? (
        <AccentBanner
          title={`${upcoming.moduleName as string} — ${(upcoming.pathway as string).replace('_', ' ')}`}
          subtitle={new Date(upcoming.scheduledAt as string).toLocaleString()}
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/system-check" style={{ textDecoration: 'none' }}>
                <Button>Run system check</Button>
              </Link>
              {upcoming.sessionId ? (
                <a
                  href={`http://localhost:3300/?session=${String(upcoming.sessionId)}${api.getToken() ? `&token=${encodeURIComponent(api.getToken()!)}` : ''}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="secondary">Start exam</Button>
                </a>
              ) : null}
            </div>
          }
        />
      ) : (
        <AccentBanner
          title="Book your exam"
          subtitle="Choose a module and pathway to schedule your assessment"
          action={
            <Link href="/booking" style={{ textDecoration: 'none' }}>
              <Button>Book now</Button>
            </Link>
          }
        />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          margin: '24px 0',
        }}
      >
        <StatCard label="Days until exam" value={String(stats.daysUntilExam ?? '—')} />
        <StatCard
          label="ID verification"
          value={String(stats.idVerification)}
          tone={stats.idVerification === 'Verified' ? 'success' : 'warning'}
        />
        <StatCard
          label="System check"
          value={String(stats.systemCheck)}
          tone={stats.systemCheck === 'Complete' ? 'success' : 'warning'}
        />
        <StatCard label="Prep modules done" value={String(stats.prepModulesDone)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
        <Card title="Prep checklist">
          {checklist.map((item) => (
            <ChecklistRow key={item.label} {...item} />
          ))}
        </Card>
        <Card title="Quick actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/booking" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" fullWidth>
                {upcoming ? 'Reschedule exam' : 'Book exam'}
              </Button>
            </Link>
            <Link href="/certificate" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" fullWidth>
                View certificates
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
