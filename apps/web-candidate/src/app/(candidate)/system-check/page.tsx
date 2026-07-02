'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, PageTitle, StatusBadge, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';
import { useAuth } from '@/lib/auth';

export default function SystemCheckPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [checks, setChecks] = useState({ webcam: true, microphone: true, connection: true, browser: true });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    api.getDashboard().then((d) => {
      const upcoming = d.upcomingBooking as { id: string } | null;
      if (upcoming) setBookingId(upcoming.id);
    });
  }, [user, loading, router]);

  const submit = async () => {
    if (!bookingId) return;
    setSubmitting(true);
    try {
      await api.submitSystemCheck(bookingId, { checks, consent, idDocumentUrl: 'uploads/demo-id.jpg' });
      router.push('/');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <PageTitle title="System and ID check" subtitle="Complete within 48 hours · takes about 5 minutes" />
      {!bookingId && <p>No upcoming booking found. <Link href="/booking">Book an exam</Link></p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ backgroundColor: '#111', borderRadius: 12, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', marginBottom: 16 }}>
            Webcam preview (simulated)
          </div>
          {Object.entries(checks).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `0.5px solid ${tokens.border}` }}>
              <span style={{ textTransform: 'capitalize' }}>{key}</span>
              <StatusBadge label={val ? 'Pass' : 'Fail'} tone={val ? 'success' : 'danger'} />
            </div>
          ))}
        </div>
        <div>
          <Button variant="secondary" fullWidth style={{ marginBottom: 16 }}>Choose ID file (simulated)</Button>
          <label style={{ display: 'flex', gap: 10, fontSize: 13, marginBottom: 16 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I consent to recording, biometric verification, and data handling per the proctoring policy.
          </label>
          <Button fullWidth disabled={!consent || !bookingId || submitting} onClick={submit}>
            Submit check
          </Button>
        </div>
      </div>
      <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: tokens.accent }}>← Dashboard</Link>
    </>
  );
}
