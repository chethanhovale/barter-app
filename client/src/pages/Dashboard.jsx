// pages/Dashboard.jsx — account settings
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user, setUser }         = useContext(AuthContext);
  const [form, setForm]           = useState({ username: '', email: '', bio: '', location: '' });
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email:    user.email    || '',
        bio:      user.bio      || '',
        location: user.location || '',
      });
    }
  }, [user]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSaved(false);
    try {
      const res = await api.patch('/users/me', form);
      setUser(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '1.75rem 1.5rem' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Account Settings</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Update your profile information and preferences</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '680px' }}>
        {/* Profile card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--teal-5)', marginBottom: '1.5rem' }}>
            <div className="avatar avatar-xl" style={{ fontSize: '1.375rem', fontWeight: 800 }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user?.username} />
                : user?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{user?.username}</p>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>Avatar upload — coming soon</p>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" className="form-input" value={form.username} onChange={set('username')} required minLength={3} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" placeholder="e.g. Koramangala" value={form.location} onChange={set('location')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">
                Bio <span style={{ fontWeight: 400, color: 'var(--gray)' }}>optional</span>
              </label>
              <textarea
                className="form-textarea" style={{ minHeight: '90px' }}
                placeholder="Tell other traders a bit about yourself…"
                value={form.bio} onChange={set('bio')}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && (
                <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Changes saved
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Security info card */}
        <div className="card-bg">
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.875rem' }}>Security</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Password', value: 'Change your account password', action: 'Change password' },
              { label: 'Two-Factor Authentication', value: 'Not yet available in this build', action: null },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--teal-10)' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</p>
                  <p style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>{item.value}</p>
                </div>
                {item.action && (
                  <button className="btn btn-ghost btn-sm">{item.action}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
