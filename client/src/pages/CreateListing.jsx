import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Form.css';

const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];
const CATEGORIES = [
  { id: 1, name: 'Electronics' }, { id: 2, name: 'Clothing' },
  { id: 3, name: 'Books & Media' }, { id: 4, name: 'Furniture' },
  { id: 5, name: 'Sports & Fitness' }, { id: 6, name: 'Tools' },
  { id: 7, name: 'Services' }, { id: 8, name: 'Food & Produce' },
  { id: 9, name: 'Art & Crafts' }, { id: 10, name: 'Other' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', condition: 'good',
    category_id: '', estimated_value: '', looking_for: '', location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/listings', form);
      navigate(`/listings/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>Post a New Listing</h1>
        <p className="form-sub">Tell people what you have and what you want in return.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Vintage Camera" />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" required rows={4} value={form.description} onChange={handleChange} placeholder="Describe the item in detail…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Condition *</label>
              <select name="condition" value={form.condition} onChange={handleChange}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Estimated Value (₹)</label>
              <input name="estimated_value" type="number" min="0" value={form.estimated_value} onChange={handleChange} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="City, State" />
            </div>
          </div>
          <div className="form-group">
            <label>Looking for in return</label>
            <input name="looking_for" value={form.looking_for} onChange={handleChange} placeholder="e.g. Smartphone, Guitar lessons, Bicycle…" />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Posting…' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
