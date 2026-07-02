export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f8fafc' }}>
        <header
          style={{
            background: '#1e3a5f',
            color: '#fff',
            padding: '1rem 2rem',
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
          }}
        >
          <strong>dMAT Platform</strong>
          <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
            <a href="/" style={{ color: '#bfdbfe' }}>
              Home
            </a>
            <a href="/structure" style={{ color: '#bfdbfe' }}>
              Test Structure
            </a>
            <a href="/preparation" style={{ color: '#bfdbfe' }}>
              Preparation
            </a>
            <a href="/taking-the-exam" style={{ color: '#bfdbfe' }}>
              Taking the Exam
            </a>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>{children}</main>
      </body>
    </html>
  );
}
