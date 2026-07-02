'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, PageTitle, ProgressBar, StatusBadge, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';
import { useAuth } from '@/lib/auth';

export default function CertificatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [certs, setCerts] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) api.getMyCertificates().then(setCerts).catch(() => setCerts([]));
  }, [user, loading, router]);

  if (loading || !user) return null;

  const cert = certs[0];
  if (!cert) {
    return (
      <>
        <PageTitle title="Certificates" subtitle="No certificates issued yet." />
        <p>Complete your exam and grading to receive a certificate.</p>
        <Link href="/" style={{ color: tokens.accent }}>← Dashboard</Link>
      </>
    );
  }

  const breakdown = cert.moduleBreakdown as Record<string, { scaled: number }>;

  return (
    <>
      <StatusBadge label="Certified" tone="success" />
      <PageTitle title="dMAT Mathematics" subtitle={`Issued ${new Date(cert.issuedAt as string).toLocaleDateString()}`} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: tokens.accentLight, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, color: tokens.text.muted }}>Scaled score</div>
          <div style={{ fontSize: 36, fontWeight: 500, color: tokens.accent }}>{cert.scaledScore as number}</div>
        </div>
        <div style={{ backgroundColor: tokens.surface1, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, color: tokens.text.muted }}>Percentile rank</div>
          <div style={{ fontSize: 36, fontWeight: 500 }}>{cert.percentileRank as number}th</div>
        </div>
      </div>
      {Object.entries(breakdown).map(([key, val]) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>{key}</span>
            <span>{val.scaled}%</span>
          </div>
          <ProgressBar value={val.scaled} />
        </div>
      ))}
      <Button>Download PDF</Button>
      <Link href="/" style={{ display: 'block', marginTop: 24, color: tokens.accent }}>← Dashboard</Link>
    </>
  );
}
