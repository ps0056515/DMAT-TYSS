export default function TestCenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#FAFAF9' }}>
        {children}
      </body>
    </html>
  );
}
