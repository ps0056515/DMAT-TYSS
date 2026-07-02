import { Card } from '@dmat/ui';

export default function TakingExamPage() {
  return (
    <>
      <h1>Taking the Exam</h1>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        <Card title="Physical Test Center">
          <p>In-person supervised exam at an authorized test center.</p>
        </Card>
        <Card title="Remote Proctored">
          <p>Take the exam from home with AI + human proctoring. System check required before booking.</p>
        </Card>
      </div>
    </>
  );
}
