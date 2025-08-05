import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ username, password }),
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody.error || `Login failed (${res.status})`;
        throw new Error(msg);
      }

      const data = await res.json();
      if (!data.access_token) {
        throw new Error('No access token returned from server');
      }

      localStorage.setItem('access_token', data.access_token);
      // optionally decode token to get user info, or fetch profile
      onLogin(data);
    } catch (e) {
      if (e.name === 'AbortError') {
        setError('Request timed out. Please try again.'); 
      } else {
        setError(e.message || 'Login failed');
      }
      console.error('Login error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card">
        <form onSubmit={submit}>
          <div className="card-header">
            <h2 className="card-title">Login</h2>
          </div>
          <div className="card-content">
            {error && (
              <div className="alert" role="alert">
                <div className="title">{error}</div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter username"
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter password"
                className="input"
              />
            </div>

            <div className="form-group">
              <button type="submit" disabled={loading} className="button">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
