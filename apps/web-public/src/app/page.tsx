import { Button, Card } from '@dmat/ui';

export default function HomePage() {
  return (
    <>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        Digital Master Assessment Test
      </h1>
      <p style={{ color: '#475569', marginBottom: '2rem' }}>
        Phase 1a — Public marketing site (BRD §5.1). Multi-language support and CMS integration
        planned.
      </p>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <Card title="About the Test">
          <p>Standardized assessment for Master&apos;s program admissions across partner universities.</p>
        </Card>
        <Card title="Candidate Portal">
          <p>Register, book your exam, and track your results.</p>
          <div style={{ marginTop: '1rem' }}>
            <Button variant="primary">Go to Candidate Portal</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
