'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, PageTitle, tokens } from '@dmat/ui';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <>
      <PageTitle title="Sign in" subtitle="Demo: alex@example.com / password123" />
      <Card>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ padding: 10, borderRadius: 8, border: `0.5px solid ${tokens.border}` }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ padding: 10, borderRadius: 8, border: `0.5px solid ${tokens.border}` }}
          />
          {error && <p style={{ color: tokens.danger.text, fontSize: 13 }}>{error}</p>}
          <Button type="submit">Sign in</Button>
        </form>
      </Card>
    </>
  );
}
