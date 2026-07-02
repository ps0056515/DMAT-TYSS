'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, InfoBanner, PageTitle, StepProgress, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';
import { useAuth } from '@/lib/auth';

export default function BookingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pathway, setPathway] = useState<'REMOTE_PROCTORED' | 'PHYSICAL_CENTER'>('REMOTE_PROCTORED');
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [moduleId, setModuleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    api.getModules().then((m) => {
      setModules(m);
      setModuleId(m[0]?.id ?? '');
    });
  }, [user, loading, router]);

  const onContinue = async () => {
    setSubmitting(true);
    try {
      await api.createBooking({
        subjectModuleId: moduleId,
        pathway,
        scheduledAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      });
      router.push('/');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <StepProgress steps={['Module', 'Pathway', 'Date & time', 'Confirm']} current={1} />
      <PageTitle title="Choose your exam pathway" subtitle="Both pathways carry the same certificate validity." />

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 14 }}>Module: </label>
        <select
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          style={{ padding: 8, marginLeft: 8, borderRadius: 8 }}
        >
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {(
          [
            { id: 'REMOTE_PROCTORED' as const, title: 'Remote proctored', meta: '14 slots available', rec: true },
            { id: 'PHYSICAL_CENTER' as const, title: 'Physical test center', meta: '3 centers nearby', rec: false },
          ] as const
        ).map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setPathway(card.id)}
            style={{
              textAlign: 'left',
              padding: 24,
              borderRadius: tokens.radius.card,
              border: pathway === card.id ? `2px solid ${tokens.accent}` : `0.5px solid ${tokens.border}`,
              backgroundColor: tokens.surface2,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {card.rec && (
              <span style={{ backgroundColor: tokens.accent, color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 8 }}>
                Recommended
              </span>
            )}
            <div style={{ fontWeight: 500, marginTop: 8 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: tokens.text.muted, marginTop: 8 }}>{card.meta}</div>
          </button>
        ))}
      </div>

      <InfoBanner>Remote exams use webcam, screen, and audio recording reviewed by AI and human proctors.</InfoBanner>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <Link href="/"><Button variant="secondary">Back</Button></Link>
        <Button onClick={onContinue} disabled={submitting}>{submitting ? 'Booking…' : 'Continue'}</Button>
      </div>
    </>
  );
}
