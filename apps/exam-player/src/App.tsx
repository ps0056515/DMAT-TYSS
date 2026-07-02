import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@dmat/api-client';
import { Button, InfoBanner, ProgressBar, tokens } from '@dmat/ui';

type Question = {
  id: string;
  sortOrder: number;
  type: string;
  stem: string;
  content: Record<string, unknown>;
  flagged: boolean;
  response?: unknown;
};

/* ------------------------------------------------------------------ */
/* Offline sync buffer                                                 */
/* ------------------------------------------------------------------ */

const QUEUE_KEY = 'dmat_offline_responses';

type QueuedSave = { sessionId: string; questionId: string; answerPayload: unknown; queuedAt: number };

function readQueue(): QueuedSave[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedSave[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSave[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function enqueueSave(item: QueuedSave) {
  // Keep only the latest answer per question.
  const queue = readQueue().filter(
    (q) => !(q.sessionId === item.sessionId && q.questionId === item.questionId),
  );
  queue.push(item);
  writeQueue(queue);
}

async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;
  const remaining: QueuedSave[] = [];
  let flushed = 0;
  for (const item of queue) {
    try {
      await api.saveResponse(item.sessionId, item.questionId, item.answerPayload);
      flushed++;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return flushed;
}

function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(() => readQueue().length);
  const [online, setOnline] = useState(() => navigator.onLine);

  const refresh = useCallback(() => setPendingCount(readQueue().length), []);

  useEffect(() => {
    const flush = async () => {
      setOnline(true);
      await flushQueue();
      refresh();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', flush);
    window.addEventListener('offline', goOffline);
    // Retry any leftovers periodically while the exam is open.
    const interval = setInterval(async () => {
      if (navigator.onLine && readQueue().length > 0) {
        await flushQueue();
        refresh();
      }
    }, 10000);
    return () => {
      window.removeEventListener('online', flush);
      window.removeEventListener('offline', goOffline);
      clearInterval(interval);
    };
  }, [refresh]);

  return { pendingCount, online, refresh };
}

/* ------------------------------------------------------------------ */
/* Lockdown mode                                                       */
/* ------------------------------------------------------------------ */

const EVENT_THROTTLE_MS = 10000;

function useLockdown(sessionId: string, active: boolean) {
  const lastSent = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!active) return;

    const report = (eventType: string, description: string) => {
      const now = Date.now();
      if (now - (lastSent.current[eventType] ?? 0) < EVENT_THROTTLE_MS) return;
      lastSent.current[eventType] = now;
      api.logExamEvent(sessionId, eventType, description).catch(() => {});
    };

    const isTextInput = (target: EventTarget | null) =>
      target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;

    const onVisibility = () => {
      if (document.hidden) report('tab_switch', 'Candidate switched tabs or minimized the window');
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      report('copy_attempt', 'Copy attempt blocked');
    };
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      report('copy_attempt', 'Cut attempt blocked');
    };
    const onPaste = (e: ClipboardEvent) => {
      if (isTextInput(e.target)) {
        e.preventDefault();
        report('paste_attempt', 'Paste into answer field blocked');
      }
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      report('context_menu', 'Context menu blocked');
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) report('fullscreen_exit', 'Candidate exited fullscreen');
    };
    const onBlur = () => report('tab_switch', 'Exam window lost focus');

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [sessionId, active]);
}

async function enterFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  } catch {
    // Browser may reject without a user gesture; lockdown events still fire.
  }
}

/* ------------------------------------------------------------------ */
/* Timer (server-authoritative via heartbeat)                          */
/* ------------------------------------------------------------------ */

const HEARTBEAT_INTERVAL_MS = 15000;

function useExamTimer(sessionId: string, active: boolean, onExpired: () => void) {
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const beat = async () => {
      try {
        const res = await api.examHeartbeat(sessionId);
        setRemainingSec(res.timeRemainingSec);
        if (res.expired && !expiredRef.current) {
          expiredRef.current = true;
          onExpired();
        }
      } catch {
        // Offline: local countdown keeps running; server re-syncs on reconnect.
      }
    };

    beat();
    const heartbeat = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    const tick = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev === null) return prev;
        const next = Math.max(0, prev - 1);
        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpired();
        }
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(heartbeat);
      clearInterval(tick);
    };
  }, [sessionId, active, onExpired]);

  return remainingSec;
}

function formatTime(sec: number | null): string {
  if (sec === null) return '--:--:--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/* ------------------------------------------------------------------ */
/* Webcam proctoring tile                                              */
/* ------------------------------------------------------------------ */

function CameraTile({ sessionId }: { sessionId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'pending' | 'on' | 'denied'>('pending');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setState('on');
      })
      .catch(() => {
        if (cancelled) return;
        setState('denied');
        api.logExamEvent(sessionId, 'camera_denied', 'Candidate denied webcam access').catch(() => {});
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [sessionId]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 160,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        backgroundColor: '#111',
        zIndex: 50,
      }}
    >
      {state === 'denied' ? (
        <div style={{ padding: 12, color: '#fff', fontSize: 12, textAlign: 'center' }}>
          Camera off — this has been reported to the proctor
        </div>
      ) : (
        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', display: 'block' }} />
      )}
      <div style={{ padding: '4px 8px', fontSize: 11, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: state === 'on' ? '#e33' : '#888',
            display: 'inline-block',
          }}
        />
        {state === 'on' ? 'Recording' : state === 'pending' ? 'Starting camera…' : 'No camera'}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

function ExamLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(email, password);
      api.setToken(res.accessToken);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 400, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Sign in to start your exam</h1>
      <p style={{ fontSize: 14, color: tokens.text.secondary, marginBottom: 16 }}>
        The exam player runs on a separate port from the candidate portal, so sign in here once.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <Button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in & continue'}</Button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        Or sign in at{' '}
        <a href="http://localhost:3200/login" style={{ color: tokens.accent }}>
          candidate portal
        </a>{' '}
        and use &quot;Start exam&quot; from the dashboard.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Exam shell                                                          */
/* ------------------------------------------------------------------ */

function ExamShell() {
  const [params] = useSearchParams();
  const sessionId = params.get('session') ?? '';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const navigate = useNavigate();
  const { pendingCount, online, refresh } = useOfflineSync();

  useEffect(() => {
    api.importTokenFromUrl();
    setAuthed(!!api.getToken());
  }, []);

  const load = useCallback(async () => {
    if (!sessionId) {
      setError('Missing ?session= query param. Open from candidate dashboard.');
      return;
    }
    if (!api.getToken()) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    setError('');
    try {
      const session = await api.getExamSession(sessionId);
      const status = String(session.status ?? '');
      if (status !== 'IN_PROGRESS') {
        await api.startExam(sessionId);
      }
      setStarted(true);
      enterFullscreen();
      const qs = await api.getExamQuestions(sessionId);
      setQuestions(qs as Question[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load exam');
    }
  }, [sessionId]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const onExpired = useCallback(() => {
    setTimeUp(true);
  }, []);

  const lockdownActive = started && !timeUp && !error;
  useLockdown(sessionId, lockdownActive);
  const remainingSec = useExamTimer(sessionId, lockdownActive, onExpired);

  const q = questions[index];
  const save = async (answerPayload: unknown) => {
    if (!q) return;
    try {
      await api.saveResponse(sessionId, q.id, answerPayload);
      if (pendingCount > 0) {
        await flushQueue();
        refresh();
      }
    } catch {
      enqueueSave({ sessionId, questionId: q.id, answerPayload, queuedAt: Date.now() });
      refresh();
    }
  };

  if (!sessionId) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: tokens.danger.text }}>Missing exam session. Open from the candidate dashboard.</p>
        <a href="http://localhost:3200">Go to dashboard</a>
      </div>
    );
  }

  if (!authed) {
    return <ExamLogin onSuccess={() => setAuthed(true)} />;
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: tokens.danger.text }}>{error}</p>
        <Button variant="secondary" onClick={() => load()}>Retry</Button>
      </div>
    );
  }

  if (timeUp) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Time is up</h1>
        <p>Your exam was submitted automatically with the answers saved so far.</p>
        <Button onClick={() => (window.location.href = 'http://localhost:3200')}>Back to dashboard</Button>
      </div>
    );
  }

  if (!started || !q) return <p style={{ padding: 32 }}>Loading exam…</p>;

  const statusBar = (
    <>
      {!online && (
        <div style={{ backgroundColor: tokens.warning.bg, padding: '6px 32px', fontSize: 13 }}>
          You are offline — answers are saved locally and will sync when the connection returns.
        </div>
      )}
      {online && pendingCount > 0 && (
        <div style={{ backgroundColor: tokens.warning.bg, padding: '6px 32px', fontSize: 13 }}>
          Syncing {pendingCount} saved answer(s)…
        </div>
      )}
    </>
  );

  const questionProps = {
    q,
    index,
    total: questions.length,
    remainingSec,
    onSave: save,
    onNext: () => setIndex((i) => Math.min(i + 1, questions.length - 1)),
    // Preserve ?session=... when switching routes, otherwise the session ID is lost.
    onReview: () => navigate({ pathname: '/review', search: params.toString() }),
  };

  return (
    <>
      <CameraTile sessionId={sessionId} />
      <Routes>
        <Route
          path="/"
          element={
            <>
              {statusBar}
              {q.type === 'FREE_TEXT' ? (
                <FreeTextView {...questionProps} />
              ) : q.type === 'MCQ' ? (
                <MCQView {...questionProps} />
              ) : (
                <FigureView {...questionProps} />
              )}
            </>
          }
        />
        <Route
          path="/review"
          element={
            <>
              {statusBar}
              <ReviewView
                questions={questions}
                remainingSec={remainingSec}
                onSubmit={async () => {
                  await flushQueue();
                  await api.submitExam(sessionId);
                  alert('Exam submitted!');
                  window.location.href = 'http://localhost:3200';
                }}
                onGoTo={(i) => {
                  setIndex(i);
                  navigate({ pathname: '/', search: params.toString() });
                }}
              />
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Question views                                                      */
/* ------------------------------------------------------------------ */

type QuestionViewProps = {
  q: Question;
  index: number;
  total: number;
  remainingSec: number | null;
  onSave: (a: unknown) => Promise<void>;
  onNext: () => void;
  onReview: () => void;
};

function TopBar({ index, total, remainingSec }: { index: number; total: number; remainingSec: number | null }) {
  const low = remainingSec !== null && remainingSec < 300;
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 32px', borderBottom: `0.5px solid ${tokens.border}` }}>
      <span>🔒 Secure mode active · recording on</span>
      <span>Question {index + 1} of {total}</span>
      <span style={{ color: low ? tokens.danger.text : undefined, fontVariantNumeric: 'tabular-nums' }}>
        Timer: {formatTime(remainingSec)}
      </span>
    </header>
  );
}

function QuestionFooter({ onReview, onNext }: { onReview: () => void; onNext: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
      <Button variant="secondary" onClick={onReview}>Review & submit</Button>
      <Button onClick={onNext}>Next question</Button>
    </div>
  );
}

function MCQView({ q, index, total, remainingSec, onSave, onNext, onReview }: QuestionViewProps) {
  const content = q.content as { options?: { id: string; label: string }[] };
  const [selected, setSelected] = useState<string | null>(
    (q.response as { selectedId?: string })?.selectedId ?? null,
  );

  const select = async (id: string) => {
    setSelected(id);
    await onSave({ selectedId: id });
  };

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <TopBar index={index} total={total} remainingSec={remainingSec} />
      <ProgressBar value={index + 1} max={total} height={8} />
      <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
        <p style={{ fontSize: 17, marginBottom: 24 }}>{q.stem}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} role="radiogroup">
          {(content.options ?? []).map((opt, i) => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => select(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  textAlign: 'left',
                  padding: '0 16px',
                  border: active ? `2px solid ${tokens.accent}` : `0.5px solid ${tokens.border}`,
                  backgroundColor: active ? tokens.accentLight : '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 15,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 13,
                    backgroundColor: active ? tokens.accent : tokens.surface1,
                    color: active ? '#fff' : undefined,
                    flexShrink: 0,
                  }}
                >
                  {letters[i] ?? i + 1}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
        <QuestionFooter onReview={onReview} onNext={onNext} />
      </div>
    </div>
  );
}

function FigureView({ q, index, total, remainingSec, onSave, onNext, onReview }: QuestionViewProps) {
  const content = q.content as { grid?: string[][]; options?: { id: string; symbol: string; label: string }[] };
  const [selected, setSelected] = useState<string | null>(
    (q.response as { selectedId?: string })?.selectedId ?? null,
  );

  const select = async (id: string) => {
    setSelected(id);
    await onSave({ selectedId: id });
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <TopBar index={index} total={total} remainingSec={remainingSec} />
      <ProgressBar value={index + 1} max={total} height={8} />
      <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ fontSize: 16, marginBottom: 24 }}>{q.stem}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: 16, backgroundColor: tokens.surface1, borderRadius: 12 }}>
            {(content.grid ?? []).flat().map((cell, i) => (
              <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, backgroundColor: cell === '?' ? tokens.accentLight : '#fff' }}>
                {cell}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(content.options ?? []).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => select(opt.id)}
                style={{
                  minHeight: 52,
                  textAlign: 'left',
                  padding: '0 16px',
                  border: selected === opt.id ? `2px solid ${tokens.accent}` : `0.5px solid ${tokens.border}`,
                  backgroundColor: selected === opt.id ? tokens.accentLight : '#fff',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {opt.symbol} {opt.label}
              </button>
            ))}
          </div>
        </div>
        <QuestionFooter onReview={onReview} onNext={onNext} />
      </div>
    </div>
  );
}

function FreeTextView({ q, index, total, remainingSec, onSave, onNext, onReview }: QuestionViewProps) {
  const [text, setText] = useState((q.response as { text?: string })?.text ?? '');
  const words = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-save while typing (debounced), plus on blur.
  const onChange = (value: string) => {
    setText(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSave({ text: value }), 2000);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <TopBar index={index} total={total} remainingSec={remainingSec} />
      <ProgressBar value={index + 1} max={total} height={8} />
      <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontSize: 16 }}>{q.stem}</p>
        <textarea
          rows={9}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onSave({ text })}
          style={{ width: '100%', padding: 16, fontSize: 14, borderRadius: 8, border: `0.5px solid ${tokens.border}` }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
          <span>{words} words</span>
          <span>Autosaves while you type</span>
        </div>
        <InfoBanner>Responses are scored by two independent graders against a fixed rubric.</InfoBanner>
        <QuestionFooter onReview={onReview} onNext={onNext} />
      </div>
    </div>
  );
}

function ReviewView({
  questions,
  remainingSec,
  onSubmit,
  onGoTo,
}: {
  questions: Question[];
  remainingSec: number | null;
  onSubmit: () => Promise<void>;
  onGoTo: (i: number) => void;
}) {
  const unanswered = questions.filter((q) => q.response == null).length;

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Review before you submit</h1>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>Time left: {formatTime(remainingSec)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, margin: '24px 0' }}>
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => onGoTo(i)}
            style={{
              aspectRatio: '1',
              backgroundColor: q.response ? tokens.success.bg : tokens.surface1,
              border: q.flagged ? `1px solid ${tokens.warning.text}` : 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {unanswered > 0 && (
        <p style={{ backgroundColor: tokens.warning.bg, padding: 12, borderRadius: 8 }}>
          {unanswered} unanswered question(s)
        </p>
      )}
      <Button variant="danger" onClick={onSubmit}>Submit exam</Button>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ExamShell />
    </BrowserRouter>
  );
}
