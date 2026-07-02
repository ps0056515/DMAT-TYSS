import { Card } from '@dmat/ui';

export default function StructurePage() {
  return (
    <>
      <h1>Test Structure</h1>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        <Card title="Question Types">
          <ul>
            <li>Multiple-choice (MCQ)</li>
            <li>Figure / image-based reasoning</li>
            <li>Free-text / essay responses</li>
          </ul>
        </Card>
        <Card title="Modules">
          <p>Subject modules with configurable duration, breaks, and scoring — Phase 1b.</p>
        </Card>
      </div>
    </>
  );
}
