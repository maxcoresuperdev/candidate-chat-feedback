import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { setToken } from '../auth/auth';

export default function Register({ onAuthed }: { onAuthed: (email: string) => void }) {
  const nav = useNavigate();
  const [email, setEmailState] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.register(email, password);
      setToken(res.token);
      const me = await api.me();
      onAuthed(me.email);
      nav('/');
    } catch (ex: any) {
      setErr(ex.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Create account</h2>
      <div className="muted" style={{ marginBottom: 10 }}>
        Password must be at least 8 characters.
      </div>

      <form onSubmit={submit} className="grid">
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmailState(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {err ? <div style={{ color: '#b91c1c' }}>{err}</div> : null}

        <div className="row">
          <button className="btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
          <Link className="btn secondary" to="/login">Back to login</Link>
        </div>
      </form>
    </div>
  );
}
