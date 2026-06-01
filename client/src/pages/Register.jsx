// pages/Register.jsx
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeIn">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div className="navbar__logo-icon" style={{ width: '2.5rem', height: '2.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </div>
            <span className="navbar__logo-text">Barter<span>App</span></span>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Create your account</h1>
          <p className="t-muted t-sm">Join Bangalore's AI-powered barter marketplace</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-input" placeholder="traderguru" value={form.username} onChange={set('username')} required minLength={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input type="text" className="form-input" placeholder="Koramangala" value={form.location} onChange={set('location')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
            <p className="form-hint">Use a strong, unique password.</p>
          </div>

          <button type="submit" className="btn btn-coral btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating account…' : 'Start Trading Free'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
