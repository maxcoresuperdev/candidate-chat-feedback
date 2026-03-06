import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { setToken } from '../auth/auth';

export default function Login({ onAuthed }: { onAuthed: (email: string) => void }) {
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
      const res = await api.login(email, password);
      setToken(res.token);
      const me = await api.me();
      onAuthed(me.email);
      nav('/');
    } catch (ex: any) {
      setErr(ex.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Login</h2>
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <Link className="btn secondary" to="/register">Create account</Link>
        </div>
      </form>
    </div>
  );
}
