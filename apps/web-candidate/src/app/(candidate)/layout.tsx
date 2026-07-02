import { AuthProvider } from '@/lib/auth';
import { CandidateNav } from '@dmat/ui';

export default function CandidateShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CandidateNav name="Alex" />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </AuthProvider>
  );
}
