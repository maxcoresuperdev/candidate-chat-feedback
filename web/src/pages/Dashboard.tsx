import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';

type SessionListItem = {
  id: string;
  status: 'in_progress' | 'submitted';
  createdAt: string;
  submittedAt: string | null;
  hasFeedback: boolean;
};

export default function Dashboard() {
  const nav = useNavigate();
  const [items, setItems] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const data = await api.listSessions();
      setItems(data);
    } catch (ex: any) {
      setErr(ex.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function startNew() {
    setErr(null);
    try {
      const created = await api.createSession();
      nav(`/sessions/${created.id}/chat`);
    } catch (ex: any) {
      setErr(ex.message || 'Failed to create session');
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Your interviews</h2>
            <div className="muted" style={{ marginTop: 6 }}>
              Start a new chat interview or revisit submitted feedback.
            </div>
          </div>
          <button className="btn" onClick={startNew}>Start new interview</button>
        </div>

        {err ? <div style={{ color: '#b91c1c', marginTop: 10 }}>{err}</div> : null}
      </div>

      <div className="card">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="muted">No sessions yet. Click "Start new interview".</div>
        ) : (
          <div className="grid">
            {items.map((s) => (
              <div key={s.id} className="card" style={{ padding: 12 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      Session {s.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      Created {new Date(s.createdAt).toLocaleString()}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      Status: {s.status}
                    </div>
                  </div>

                  {s.status === 'submitted' ? (
                    <Link className="btn secondary" to={`/sessions/${s.id}`}>View feedback</Link>
                  ) : (
                    <Link className="btn secondary" to={`/sessions/${s.id}/chat`}>Continue</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
