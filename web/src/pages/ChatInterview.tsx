import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ChatBubble } from '../components/ChatBubble';

type SessionDto = {
  id: string;
  status: 'in_progress' | 'submitted';
  questions: string[];
  answers: string[];
  feedback: any | null;
  createdAt: string;
  submittedAt: string | null;
};

export default function ChatInterview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState<SessionDto | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentIndex = useMemo(() => {
    if (!session) return 0;
    const idx = session.answers.findIndex((a) => !a || a.trim().length === 0);
    return idx === -1 ? session.questions.length : idx;
  }, [session]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setErr(null);
      try {
        const s = await api.getSession(id as string);
        if (!alive) return;
        setSession(s);
        setDraft('');
      } catch (ex: any) {
        if (!alive) return;
        setErr(ex.message || 'Failed to load session');
      }
    }
    if (id) load();
    return () => { alive = false; };
  }, [id]);

  async function saveAnswer() {
    if (!session) return;
    setErr(null);

    const idx = currentIndex;
    if (idx >= session.questions.length) return;
    if (draft.trim().length === 0) {
      setErr('Please enter an answer.');
      return;
    }

    const nextAnswers = [...session.answers];
    nextAnswers[idx] = draft;

    setSaving(true);
    try {
      const updated = await api.updateAnswers(session.id, nextAnswers);
      setSession(updated);
      setDraft('');
    } catch (ex: any) {
      setErr(ex.message || 'Failed to save answer');
    } finally {
      setSaving(false);
    }
  }

  async function submitAll() {
    if (!session) return;
    setErr(null);
    setSubmitting(true);
    try {
      const submitted = await api.submitSession(session.id);
      setSession(submitted);
      nav(`/sessions/${session.id}`);
    } catch (ex: any) {
      setErr(ex.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return <div className="card">{err ? <div style={{ color: '#b91c1c' }}>{err}</div> : <div className="muted">Loading...</div>}</div>;
  }

  if (session.status === 'submitted') {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Session already submitted</h2>
        <div className="row">
          <Link className="btn secondary" to={`/sessions/${session.id}`}>View feedback</Link>
          <Link className="btn secondary" to="/">Back</Link>
        </div>
      </div>
    );
  }

  const done = currentIndex >= session.questions.length;

  return (
    <div className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Chat interview</h2>
            <div className="muted" style={{ marginTop: 6 }}>
              Answer 5 questions. Your progress is saved after each message.
            </div>
          </div>
          <Link className="btn secondary" to="/">Back</Link>
        </div>

        {err ? <div style={{ color: '#b91c1c', marginTop: 10 }}>{err}</div> : null}

        <div className="chat">
          {session.questions.map((q, i) => (
            <React.Fragment key={i}>
              <ChatBubble type="q" text={q} />
              {session.answers[i] && session.answers[i].trim().length > 0 ? (
                <ChatBubble type="a" text={session.answers[i]} />
              ) : null}
            </React.Fragment>
          ))}
        </div>

        {!done ? (
          <div style={{ marginTop: 12 }}>
            <label className="label">Your answer</label>
            <textarea
              className="input"
              style={{ minHeight: 110, resize: 'vertical' }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your response..."
            />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn" onClick={saveAnswer} disabled={saving}>
                {saving ? 'Saving...' : 'Send'}
              </button>
              <div className="muted" style={{ alignSelf: 'center' }}>
                Question {currentIndex + 1} of {session.questions.length}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 10 }}>
              All questions answered. Submit to receive feedback.
            </div>
            <button className="btn" onClick={submitAll} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit and get feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
