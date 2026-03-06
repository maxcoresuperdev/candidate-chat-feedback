import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ChatBubble } from '../components/ChatBubble';

export default function SessionDetails() {
  const { id } = useParams();
  const [session, setSession] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setErr(null);
      try {
        const s = await api.getSession(id as string);
        if (!alive) return;
        setSession(s);
      } catch (ex: any) {
        if (!alive) return;
        setErr(ex.message || 'Failed to load');
      }
    }
    if (id) load();
    return () => { alive = false; };
  }, [id]);

  if (!session) {
    return <div className="card">{err ? <div style={{ color: '#b91c1c' }}>{err}</div> : <div className="muted">Loading...</div>}</div>;
  }

  const feedback = session.feedback;

  return (
    <div className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Feedback</h2>
            <div className="muted" style={{ marginTop: 6 }}>
              Session {session.id.slice(-6).toUpperCase()} submitted {session.submittedAt ? new Date(session.submittedAt).toLocaleString() : ''}
            </div>
          </div>
          <Link className="btn secondary" to="/">Back</Link>
        </div>

        {!feedback ? (
          <div className="muted" style={{ marginTop: 12 }}>
            Not submitted yet.
            <div style={{ marginTop: 10 }}>
              <Link className="btn" to={`/sessions/${session.id}/chat`}>Continue interview</Link>
            </div>
          </div>
        ) : (
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Overall summary</div>
              <div>{feedback.overallSummary}</div>
            </div>

            <div className="grid two">
              {feedback.skills.map((s: any) => (
                <div key={s.skill} className="card">
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 700 }}>{s.skill}</div>
                    <div style={{ fontWeight: 700 }}>{s.score}/100</div>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>{s.explanation}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Transcript</div>
              <div className="chat">
                {session.questions.map((q: string, i: number) => (
                  <React.Fragment key={i}>
                    <ChatBubble type="q" text={q} />
                    <ChatBubble type="a" text={session.answers[i] || ''} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
