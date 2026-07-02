import { Button, tokens } from '@dmat/ui';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ScreenLabel } from './FigureQuestion';

const QUESTIONS = Array.from({ length: 40 }, (_, i) => {
  const n = i + 1;
  if ([7, 12, 18, 25].includes(n)) return { n, status: 'flagged' as const };
  if ([9, 22, 33].includes(n)) return { n, status: 'unanswered' as const };
  return { n, status: 'answered' as const };
});

export function ReviewSubmit() {
  const [showModal, setShowModal] = useState(false);
  const unanswered = QUESTIONS.filter((q) => q.status === 'unanswered').length;
  const firstUnanswered = QUESTIONS.find((q) => q.status === 'unanswered')?.n ?? 1;

  const cellColor = (status: string) => {
    if (status === 'answered') return tokens.success.bg;
    if (status === 'flagged') return tokens.warning.bg;
    return tokens.surface1;
  };

  return (
    <div style={{ minHeight: '100vh', background: tokens.surface2, fontFamily: 'system-ui, sans-serif', padding: '32px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 8px' }}>Review before you submit</h1>
        <p style={{ fontSize: 14, color: tokens.text.secondary, marginBottom: 24 }}>
          Once submitted, you cannot return. Time remaining: 08:12
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 6,
            marginBottom: 16,
          }}
        >
          {QUESTIONS.map((q) => (
            <Link
              key={q.n}
              to="/"
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: cellColor(q.status),
                color: tokens.text.primary,
                borderRadius: 4,
                textDecoration: 'none',
                border: q.status === 'flagged' ? `1px solid ${tokens.warning.text}` : 'none',
              }}
              aria-label={`Question ${q.n}: ${q.status}`}
            >
              {q.n}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 24 }}>
          <span>● Answered ({QUESTIONS.filter((q) => q.status === 'answered').length})</span>
          <span style={{ color: tokens.warning.text }}>● Flagged ({QUESTIONS.filter((q) => q.status === 'flagged').length})</span>
          <span style={{ color: tokens.text.muted }}>● Unanswered ({unanswered})</span>
        </div>

        {unanswered > 0 && (
          <div
            style={{
              backgroundColor: tokens.warning.bg,
              color: tokens.warning.text,
              padding: 16,
              borderRadius: tokens.radius.sm,
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            You have {unanswered} unanswered question{unanswered > 1 ? 's' : ''}. Time is still running.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Go to question {firstUnanswered}</Button>
          </Link>
          <Button variant="danger" onClick={() => setShowModal(true)}>
            Submit exam
          </Button>
        </div>
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal
          aria-labelledby="submit-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: tokens.surface2,
              padding: 32,
              borderRadius: tokens.radius.card,
              maxWidth: 400,
              width: '90%',
            }}
          >
            <h2 id="submit-title" style={{ margin: '0 0 12px', fontSize: 16 }}>
              Are you sure?
            </h2>
            <p style={{ fontSize: 14, color: tokens.text.secondary, marginBottom: 24 }}>
              This cannot be undone. Your exam will be submitted for grading.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="danger">Confirm submit</Button>
            </div>
          </div>
        </div>
      )}

      <ScreenLabel n={6} />
    </div>
  );
}
