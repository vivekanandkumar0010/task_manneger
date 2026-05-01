import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div className="auth-card page-enter">
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1>Welcome back</h1>
          <p>Sign in to your TaskFlow account</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" name="email" value={form.email}
              onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" name="password" value={form.password}
              onChange={handle} placeholder="••••••••" required />
          </div>
          <button className="btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
