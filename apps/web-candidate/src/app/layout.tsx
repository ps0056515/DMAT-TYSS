export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
          background: '#FAFAF9',
          color: '#1A1A1A',
        }}
      >
        {children}
      </body>
    </html>
  );
}
