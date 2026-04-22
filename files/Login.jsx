// ── Login.jsx ────────────────────────────────────────────────
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Form.css';

export function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>Welcome Back</h1>
        <p className="form-sub">Log in to your Barter account.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Logging in…' : 'Log In'}</button>
        </form>
        <p className="form-footer">Don't have an account? <Link to="/register">Sign up</Link></p>
      </div>
    </div>
  );
}

export default Login;
