import { InfoBanner, tokens } from '@dmat/ui';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ActionBar, ExamTopBar, ScreenLabel } from './FigureQuestion';

export function FreeTextQuestion() {
  const [text, setText] = useState('');
  const [flagged, setFlagged] = useState(false);
  const words = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);
  const min = 150;
  const max = 300;
  const nearLimit = words >= max - 10 && words <= max;
  const overLimit = words > max;

  return (
    <div style={{ minHeight: '100vh', background: tokens.surface2, fontFamily: 'system-ui, sans-serif' }}>
      <ExamTopBar questionNum={18} total={40} time="00:04:32" timeTone="danger" />
      <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: tokens.text.muted, textTransform: 'uppercase', marginBottom: 8 }}>
          Economics · Analysis · Free response
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20 }}>
          Explain how supply-chain disruptions affect consumer price indices in open economies.{' '}
          <span style={{ color: tokens.text.muted }}>(150–300 words)</span>
        </p>
        <textarea
          rows={9}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your answer here."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: 16,
            fontSize: 14,
            fontFamily: 'system-ui, sans-serif',
            borderRadius: tokens.radius.sm,
            border: overLimit ? `2px solid ${tokens.warning.text}` : `0.5px solid ${tokens.border}`,
            resize: 'vertical',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            marginTop: 8,
            color: overLimit ? tokens.warning.text : nearLimit ? tokens.warning.text : tokens.text.secondary,
          }}
        >
          <span>{overLimit ? `${words} words — over limit` : `${words} words`}</span>
          <span>Autosaved 3s ago</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <InfoBanner>
            Responses are scored by two independent graders against a fixed rubric.
          </InfoBanner>
        </div>
        <ActionBar
          flagged={flagged}
          onFlag={() => setFlagged(!flagged)}
          backTo="/"
          nextTo="/review"
        />
      </div>
      <ScreenLabel n={5} />
    </div>
  );
}
