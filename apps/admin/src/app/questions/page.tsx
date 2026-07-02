'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, StaffNav, StatusBadge, tokens } from '@dmat/ui';
import { api } from '@dmat/api-client';

type Module = { id: string; code: string; name: string };
type QuestionRow = {
  id: string;
  type: string;
  stem: string;
  sortOrder: number;
  subjectModule?: { code: string; name: string };
};

const IMPORT_EXAMPLE = `[
  {
    "moduleCode": "MATH",
    "type": "MCQ",
    "stem": "What is 2 + 2?",
    "content": { "options": [ { "id": "a", "label": "3" }, { "id": "b", "label": "4" } ] },
    "correctAnswer": { "selectedId": "b" }
  },
  {
    "moduleCode": "MATH",
    "type": "FREE_TEXT",
    "stem": "Explain the central limit theorem.",
    "content": { "minWords": 100, "maxWords": 250 },
    "rubric": { "criteria": [ { "name": "Accuracy", "max": 5 }, { "name": "Clarity", "max": 5 } ] }
  }
]`;

export default function QuestionsPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Single question form
  const [moduleId, setModuleId] = useState('');
  const [type, setType] = useState<'MCQ' | 'FIGURE' | 'FREE_TEXT'>('MCQ');
  const [stem, setStem] = useState('');
  const [contentJson, setContentJson] = useState('{\n  "options": [\n    { "id": "a", "label": "" },\n    { "id": "b", "label": "" }\n  ]\n}');
  const [answerJson, setAnswerJson] = useState('{ "selectedId": "a" }');
  const [rubricJson, setRubricJson] = useState('{ "criteria": [ { "name": "Accuracy", "max": 5 } ] }');

  // Bulk import
  const [importJson, setImportJson] = useState('');

  useEffect(() => {
    setLoggedIn(!!api.getToken());
  }, []);

  const refresh = useCallback(async () => {
    const [mods, qs] = await Promise.all([api.getModules(), api.getAdminQuestions()]);
    setModules(mods as Module[]);
    setQuestions(qs as unknown as QuestionRow[]);
    if (!moduleId && mods.length) setModuleId(mods[0]!.id);
  }, [moduleId]);

  useEffect(() => {
    if (loggedIn) refresh().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [loggedIn, refresh]);

  const parse = (label: string, raw: string): Record<string, unknown> => {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`${label} is not valid JSON`);
    }
  };

  const createQuestion = async () => {
    setError('');
    setMessage('');
    try {
      const payload: Record<string, unknown> = {
        subjectModuleId: moduleId,
        type,
        stem,
        content: parse('Content', contentJson),
      };
      if (type === 'FREE_TEXT') payload.rubric = parse('Rubric', rubricJson);
      else payload.correctAnswer = parse('Correct answer', answerJson);

      await api.createAdminQuestion(payload);
      setStem('');
      setMessage('Question created');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create question');
    }
  };

  const runImport = async () => {
    setError('');
    setMessage('');
    try {
      const items = JSON.parse(importJson) as Record<string, unknown>[];
      const res = await api.importAdminQuestions(items);
      setMessage(`Imported ${res.imported} question(s)`);
      setImportJson('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed — check the JSON');
    }
  };

  const remove = async (id: string) => {
    setError('');
    setMessage('');
    try {
      await api.deleteAdminQuestion(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 32 }}>
        <p>
          Sign in on the <Link href="/">admin dashboard</Link> first.
        </p>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: 8,
    borderRadius: 8,
    border: `0.5px solid ${tokens.border}`,
    fontFamily: 'inherit',
    fontSize: 13,
    boxSizing: 'border-box' as const,
  };
  const monoStyle = { ...inputStyle, fontFamily: 'ui-monospace, monospace' };

  return (
    <>
      <StaffNav title="Question bank" subtitle="Author and import exam questions" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>
        <Link href="/" style={{ color: tokens.accent, display: 'inline-block', marginBottom: 16 }}>
          ← Back to overview
        </Link>

        {message && (
          <p style={{ backgroundColor: tokens.success.bg, padding: 12, borderRadius: 8 }}>{message}</p>
        )}
        {error && (
          <p style={{ backgroundColor: tokens.danger.bg, color: tokens.danger.text, padding: 12, borderRadius: 8 }}>
            {error}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <Card title="New question">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13 }}>
                Module
                <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} style={inputStyle}>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                Type
                <select value={type} onChange={(e) => setType(e.target.value as typeof type)} style={inputStyle}>
                  <option value="MCQ">MCQ</option>
                  <option value="FIGURE">Figure</option>
                  <option value="FREE_TEXT">Free text</option>
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                Stem (question text)
                <textarea rows={2} value={stem} onChange={(e) => setStem(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ fontSize: 13 }}>
                Content (JSON)
                <textarea rows={6} value={contentJson} onChange={(e) => setContentJson(e.target.value)} style={monoStyle} />
              </label>
              {type === 'FREE_TEXT' ? (
                <label style={{ fontSize: 13 }}>
                  Rubric (JSON)
                  <textarea rows={3} value={rubricJson} onChange={(e) => setRubricJson(e.target.value)} style={monoStyle} />
                </label>
              ) : (
                <label style={{ fontSize: 13 }}>
                  Correct answer (JSON)
                  <textarea rows={2} value={answerJson} onChange={(e) => setAnswerJson(e.target.value)} style={monoStyle} />
                </label>
              )}
              <Button onClick={createQuestion} disabled={!stem.trim() || !moduleId}>
                Create question
              </Button>
            </div>
          </Card>

          <Card title="Bulk import (JSON array)">
            <textarea
              rows={14}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder={IMPORT_EXAMPLE}
              style={monoStyle}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button onClick={runImport} disabled={!importJson.trim()}>
                Import
              </Button>
              <Button variant="secondary" onClick={() => setImportJson(IMPORT_EXAMPLE)}>
                Load example
              </Button>
            </div>
          </Card>
        </div>

        <Card title={`Question bank (${questions.length})`}>
          {questions.length === 0 ? (
            <p style={{ fontSize: 14 }}>No questions yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: `1px solid ${tokens.border}` }}>
                  <th style={{ padding: '8px 4px' }}>Module</th>
                  <th style={{ padding: '8px 4px' }}>Type</th>
                  <th style={{ padding: '8px 4px' }}>Stem</th>
                  <th style={{ padding: '8px 4px' }} />
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} style={{ borderBottom: `0.5px solid ${tokens.border}` }}>
                    <td style={{ padding: '8px 4px', whiteSpace: 'nowrap' }}>{q.subjectModule?.code ?? '—'}</td>
                    <td style={{ padding: '8px 4px' }}>
                      <StatusBadge tone={q.type === 'FREE_TEXT' ? 'warning' : 'success'} label={q.type} />
                    </td>
                    <td style={{ padding: '8px 4px' }}>{q.stem}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                      <Button variant="secondary" onClick={() => remove(q.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
