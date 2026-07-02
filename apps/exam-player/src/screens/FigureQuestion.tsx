import { Button, ProgressBar, tokens } from '@dmat/ui';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const GRID = [
  ['▲', '●', '■', '◆'],
  ['●', '?', '▲', '■'],
  ['■', '◆', '●', '▲'],
  ['◆', '▲', '■', '●'],
];

const OPTIONS = [
  { id: 'a', symbol: '■', label: 'Square' },
  { id: 'b', symbol: '▲', label: 'Triangle' },
  { id: 'c', symbol: '●', label: 'Circle' },
  { id: 'd', symbol: '◆', label: 'Diamond' },
];

export function FigureQuestion() {
  const [selected, setSelected] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: tokens.surface2, fontFamily: 'system-ui, sans-serif' }}>
      <ExamTopBar questionNum={7} total={40} time="02:45:00" timeTone="neutral" />
      <ProgressBar value={7} max={40} height={8} />
      <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: tokens.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Mathematics · Spatial reasoning · Figure-based
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.5, maxWidth: 720, marginBottom: 24 }}>
          Complete the Latin square by selecting the symbol that replaces the question mark.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
              backgroundColor: tokens.surface1,
              padding: 16,
              borderRadius: tokens.radius.card,
            }}
          >
            {GRID.flat().map((cell, i) => (
              <div
                key={i}
                aria-label={`Cell ${i + 1}: ${cell === '?' ? 'missing symbol' : cell}`}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  backgroundColor: cell === '?' ? tokens.accentLight : tokens.surface2,
                  color: cell === '?' ? tokens.accent : tokens.text.primary,
                  borderRadius: tokens.radius.sm,
                  fontWeight: cell === '?' ? 700 : 400,
                }}
              >
                {cell}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OPTIONS.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 52,
                    padding: '0 16px',
                    border: isSelected ? `2px solid ${tokens.accent}` : `0.5px solid ${tokens.border}`,
                    backgroundColor: isSelected ? tokens.accentLight : tokens.surface2,
                    borderRadius: tokens.radius.sm,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 15,
                  }}
                >
                  <input type="radio" readOnly checked={isSelected} aria-label={opt.label} />
                  <span style={{ fontSize: 20 }}>{opt.symbol}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <ActionBar
          flagged={flagged}
          onFlag={() => setFlagged(!flagged)}
          backTo="/"
          nextTo="/free-text"
        />
      </div>
      <ScreenLabel n={4} />
    </div>
  );
}

export function ExamTopBar({
  questionNum,
  total,
  time,
  timeTone = 'neutral',
}: {
  questionNum: number;
  total: number;
  time: string;
  timeTone?: 'neutral' | 'warning' | 'danger';
}) {
  const timeBg =
    timeTone === 'danger' ? tokens.danger.bg : timeTone === 'warning' ? tokens.warning.bg : 'transparent';
  const timeColor =
    timeTone === 'danger' ? tokens.danger.text : timeTone === 'warning' ? tokens.warning.text : tokens.text.primary;

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 32px',
        borderBottom: `0.5px solid ${tokens.border}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: tokens.text.secondary }}>
        🔒 Secure mode active · recording on
      </span>
      <span style={{ color: tokens.text.muted }}>
        Question {questionNum} of {total}
      </span>
      <span
        style={{
          fontWeight: 500,
          padding: '4px 12px',
          borderRadius: tokens.radius.sm,
          backgroundColor: timeBg,
          color: timeColor,
        }}
      >
        {time}
      </span>
    </header>
  );
}

export function ActionBar({
  flagged,
  onFlag,
  backTo,
  nextTo,
}: {
  flagged: boolean;
  onFlag: () => void;
  backTo: string;
  nextTo: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
      <Button variant="secondary" onClick={onFlag}>
        {flagged ? '★ Flagged for review' : 'Flag for review'}
      </Button>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to={backTo} style={{ textDecoration: 'none' }}>
          <Button variant="secondary" aria-label="Previous question">
            ←
          </Button>
        </Link>
        <Link to={nextTo} style={{ textDecoration: 'none' }}>
          <Button>Next question</Button>
        </Link>
      </div>
    </div>
  );
}

export function ScreenLabel({ n }: { n: number }) {
  return (
    <p style={{ textAlign: 'center', fontSize: 12, color: tokens.text.muted, padding: 16 }}>
      Screen {n} — Exam player · Design Spec v1.0 ·{' '}
      <Link to="/" style={{ color: tokens.accent }}>/figure</Link>
      {' · '}
      <Link to="/free-text" style={{ color: tokens.accent }}>/free-text</Link>
      {' · '}
      <Link to="/review" style={{ color: tokens.accent }}>/review</Link>
    </p>
  );
}
