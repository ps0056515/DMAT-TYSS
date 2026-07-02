'use client';

import { useEffect, useState } from 'react';
import { Button, Card, StaffNav, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';
import Link from 'next/link';

export default function GradingPage() {
  const [email, setEmail] = useState('grader@dmat.de');
  const [password, setPassword] = useState('password123');
  const [loggedIn, setLoggedIn] = useState(!!api.getToken());
  const [queue, setQueue] = useState<Record<string, unknown>[]>([]);
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [scores, setScores] = useState([3, 2, 2]);

  const load = () =>
    api.getGradingQueue().then((q) => {
      setQueue(q);
      setItem(q[0] ?? null);
    });

  useEffect(() => {
    if (loggedIn) load().catch(console.error);
  }, [loggedIn]);

  const login = async () => {
    const res = await api.login(email, password);
    api.setToken(res.accessToken);
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 32 }}>
        <h1>Grader login</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8 }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', marginBottom: 8, padding: 8 }} />
        <Button onClick={login}>Sign in</Button>
      </div>
    );
  }

  const submit = async () => {
    if (!item) return;
    const rubric = item.rubric as { criteria: { name: string; max: number }[] };
    const criteriaScores: Record<string, number> = {};
    rubric.criteria.forEach((c, i) => {
      criteriaScores[c.name] = scores[i] ?? 0;
    });
    await api.submitGrade({
      sessionId: item.sessionId as string,
      questionId: item.questionId as string,
      criteriaScores,
      totalScore: scores.reduce((a, b) => a + b, 0),
    });
    load();
  };

  return (
    <>
      <StaffNav title="Grading queue" subtitle={`${queue.length} responses remaining`} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 32px' }}>
        {item ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Card title="Question">
              <p>{item.stem as string}</p>
              <Card title="Response">
                <p style={{ fontSize: 13 }}>{item.responseText as string || '(empty)'}</p>
                <p style={{ fontSize: 12, color: tokens.text.muted }}>{item.wordCount as number} words</p>
              </Card>
            </Card>
            <div>
              <Card title="Rubric scoring">
                {((item.rubric as { criteria: { name: string; max: number }[] })?.criteria ?? []).map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span>{c.name}</span>
                    <span>
                      <button type="button" onClick={() => setScores((s) => s.map((v, j) => (j === i ? Math.max(0, v - 1) : v)))}>−</button>
                      {' '}{scores[i]} / {c.max}{' '}
                      <button type="button" onClick={() => setScores((s) => s.map((v, j) => (j === i ? Math.min(c.max, v + 1) : v)))}>+</button>
                    </span>
                  </div>
                ))}
              </Card>
              <Button fullWidth style={{ marginTop: 16 }} onClick={submit}>Submit and continue</Button>
            </div>
          </div>
        ) : (
          <p>Grading queue empty — resolve proctoring and submit exams first.</p>
        )}
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: tokens.accent }}>← Admin</Link>
      </div>
    </>
  );
}
