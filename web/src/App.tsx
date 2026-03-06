import React, { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatInterview from './pages/ChatInterview';
import SessionDetails from './pages/SessionDetails';
import ProtectedRoute from './components/ProtectedRoute';
import { api } from './api/client';
import { clearToken, isAuthed } from './auth/auth';

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!isAuthed()) return;
      try {
        const me = await api.me();
        if (alive) setEmail(me.email);
      } catch {
        clearToken();
        if (alive) setEmail(null);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  return (
    <div className="container">
      <div className="topbar">
        <Link to={isAuthed() ? '/' : '/login'}>
          <div style={{ fontWeight: 700 }}>Candidate Chat Feedback</div>
          <div className="muted" style={{ fontSize: 12 }}>Minimal chat interview with stored feedback</div>
        </Link>

        <div className="row" style={{ alignItems: 'center' }}>
          {email ? <div className="muted" style={{ fontSize: 14 }}>{email}</div> : null}
          {isAuthed() ? (
            <button
              className="btn secondary"
              onClick={() => {
                clearToken();
                setEmail(null);
                nav('/login');
              }}
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>

      <Routes>
        <Route path="/login" element={<Login onAuthed={(e) => setEmail(e)} />} />
        <Route path="/register" element={<Register onAuthed={(e) => setEmail(e)} />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:id/chat"
          element={
            <ProtectedRoute>
              <ChatInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/:id"
          element={
            <ProtectedRoute>
              <SessionDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
