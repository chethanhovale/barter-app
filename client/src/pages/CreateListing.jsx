// pages/CreateListing.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useAI } from '../hooks/useAI';
import ItemConditionAnalyser from '../components/ItemConditionAnalyser';

const CATEGORIES  = ['Electronics','Computers','Fitness','Books','Clothing','Furniture','Sports','Music','Other'];
const CONDITIONS  = ['Excellent','Good','Fair','Poor'];

export default function CreateListing() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { enhanceListing } = useAI();

  const [form, setForm] = useState({
    title: '', description: '', category: 'Electronics',
    condition: 'Good', estimated_value: '', looking_for: '', location: user?.location || '',
  });
  const [images, setImages]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing]   = useState(false);
  const [error, setError]           = useState('');
  const [step, setStep]             = useState(1); // 1=details, 2=images, 3=review

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleImageUpload = async (e) => {
    const files = [...e.target.files];
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.post('/images/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImages(prev => [...prev, res.data.url]);
      }
    } catch { setError('Image upload failed'); }
    finally { setUploading(false); }
  };

  const handleEnhance = async () => {
    if (!form.title) return;
    setEnhancing(true);
    try {
      const result = await enhanceListing({ title: form.title, description: form.description, category: form.category, condition: form.condition });
      setForm(f => ({ ...f, title: result.title || f.title, description: result.description || f.description }));
    } catch { /* silent */ }
    finally { setEnhancing(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      const payload = { ...form, estimated_value: Number(form.estimated_value) || null, images };
      const res = await api.post('/listings', payload);
      navigate(`/listings/${res.data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally { setSubmitting(false); }
  };

  const stepLabels = ['Details', 'Images', 'Review'];

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '1.75rem 1.5rem' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>List an Item</h1>
          <p className="t-muted t-sm">Use AI to enhance your listing for better trade matches</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '720px' }}>
        {/* Steps */}
        <div className="wizard-steps" style={{ marginBottom: '2rem' }}>
          {stepLabels.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div className="wizard-step">
                <div className={`wizard-step__num ${step === i+1 ? 'active' : step > i+1 ? 'complete' : ''}`}>{step > i+1 ? '' : i+1}</div>
                <span className={`wizard-step__label ${step === i+1 ? 'active' : ''}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`wizard-step__line ${step > i+1 ? 'done' : ''}`} style={{ margin: '0 0.75rem' }} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>{error}</div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="card animate-fadeIn">
            <div className="form-group">
              <label className="form-label">Title</label>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <input type="text" className="form-input" style={{ flex: 1 }} placeholder="e.g. iPhone 13 Pro 128GB" value={form.title} onChange={set('title')} required />
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleEnhance} disabled={enhancing || !form.title} title="AI enhance">
                  {enhancing ? '…' : ' Enhance'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Describe your item — condition, age, accessories included…" value={form.description} onChange={set('description')} />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select className="form-select" value={form.condition} onChange={set('condition')}>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Estimated Value (₹)</label>
                <input type="number" className="form-input" placeholder="15000" value={form.estimated_value} onChange={set('estimated_value')} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="form-input" placeholder="Koramangala" value={form.location} onChange={set('location')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Looking For</label>
              <input type="text" className="form-input" placeholder="e.g. MacBook Air, Gaming Keyboard, Camera lenses…" value={form.looking_for} onChange={set('looking_for')} required />
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setStep(2)} disabled={!form.title || !form.looking_for}>
              Continue to Images →
            </button>
          </div>
        )}

        {/* Step 2 — Images */}
        {step === 2 && (
          <div className="card animate-fadeIn">
            <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Add Photos</p>
            <p className="t-muted t-sm" style={{ marginBottom: '1.25rem' }}>Good photos get 3× more trade proposals. AI condition analysis uses these.</p>

            <label className="upload-zone" style={{ display: 'block' }}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{uploading ? 'Uploading…' : 'Click or drag photos here'}</p>
              <p className="t-muted t-xs">JPEG, PNG — up to 5MB each</p>
            </label>

            {images.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img} alt="" style={{ width: '5rem', height: '5rem', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--teal-10)' }} />
                    {i === 0 && <span className="badge badge-teal" style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '0.6rem', padding: '1px 4px' }}>Primary</span>}
                    <button onClick={() => setImages(images.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <ItemConditionAnalyser images={images} category={form.category} />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Review Listing →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="card animate-fadeIn">
            <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Review Before Publishing</p>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
              {images[0] && <img src={images[0]} alt="" style={{ width: '100%', height: '12rem', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '0.875rem' }} />}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-mono badge-blue" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{form.category}</span>
                <span className={`badge badge-mono condition-${form.condition.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{form.condition}</span>
              </div>
              <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{form.title}</h3>
              <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{form.description}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}> {form.location} · ₹{Number(form.estimated_value || 0).toLocaleString('en-IN')}</p>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--teal-5)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Looking For</span>
                <p style={{ fontWeight: 700 }}>{form.looking_for}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Edit</button>
              <button className="btn btn-coral" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Publishing…' : ' Publish Listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
