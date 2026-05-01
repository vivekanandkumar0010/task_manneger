import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Signup failed';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div className="auth-card page-enter">
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1>Get started</h1>
          <p>Create your TaskFlow account</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="field">
            <label>Full Name</label>
            <input className="input" name="name" value={form.name}
              onChange={handle} placeholder="Jane Smith" required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" name="email" value={form.email}
              onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" name="password" value={form.password}
              onChange={handle} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button className="btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
