import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Form.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>Create Account</h1>
        <p className="form-sub">Join the community and start bartering.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" required value={form.username} onChange={handleChange} placeholder="cooltrader42" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} placeholder="Min 8 characters" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
        </form>
        <p className="form-footer">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
