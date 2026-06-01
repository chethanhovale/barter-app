// components/ItemConditionAnalyser.jsx
// Vision-based condition analysis component.
// Props:
//   images      – array of { url } objects already uploaded (from CreateListing)
//   setImages   – setter (optional; only needed when showValuation=true / standalone use)
//   category    – string e.g. 'Electronics'
//   showValuation – bool; when true, also calls /ai/condition endpoint and renders result
import { useState } from 'react';
import api from '../services/api';

export default function ItemConditionAnalyser({ images = [], setImages, category = 'Other', showValuation = false }) {
  const [uploading, setUploading]   = useState(false);
  const [analysing, setAnalysing]   = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');

  /* ── Image upload (only when setImages is provided) ── */
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !setImages) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.post('/images/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data; // { url, public_id, ... }
      }));
      setImages(prev => [...prev, ...uploaded]);
    } catch {
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Vision analysis ── */
  const handleAnalyse = async () => {
    if (!images.length) { setError('Upload at least one image first.'); return; }
    setAnalysing(true);
    setResult(null);
    setError('');
    try {
      const res = await api.post('/ai/condition/analyse', {
        image_urls: images.map(img => img.url || img),
        category,
      });
      setResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed. Check that the AI service is running.';
      setError(msg);
    } finally {
      setAnalysing(false);
    }
  };

  const conditionColor = (grade) => {
    const map = { Excellent: 'var(--teal)', Good: 'var(--blue)', Fair: '#f59e0b', Poor: 'var(--coral)' };
    return map[grade] || 'var(--gray)';
  };

  return (
    <div>
      {/* Image grid (readonly when no setImages) */}
      {setImages && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.625rem' }}>
            Upload item photos
          </label>

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', border: '2px dashed var(--teal-20)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', background: 'var(--bg)', transition: 'border-color 0.15s',
          }}>
            <input type="file" multiple accept="image/*" onChange={handleFiles} style={{ display: 'none' }} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>
              {uploading ? 'Uploading…' : 'Click to add photos'}
            </span>
          </label>

          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginTop: '0.875rem' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={img.url || img}
                    alt={`item-${i}`}
                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--teal-10)' }}
                  />
                  <button
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px',
                      borderRadius: '50%', background: 'var(--coral)', border: 'none', color: 'white',
                      fontSize: '10px', lineHeight: '18px', textAlign: 'center', cursor: 'pointer', padding: 0,
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Readonly image strip (when images come from parent, no setImages) */}
      {!setImages && images.length > 0 && (
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {images.map((img, i) => (
            <img key={i} src={img.url || img} alt={`item-${i}`}
              style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--teal-10)' }} />
          ))}
        </div>
      )}

      {/* No-image placeholder when readonly */}
      {!setImages && images.length === 0 && (
        <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          No images uploaded yet. Add photos in step 2 to enable vision analysis.
        </p>
      )}

      {/* Analyse button — only when showValuation */}
      {showValuation && (
        <button
          className="btn btn-primary"
          onClick={handleAnalyse}
          disabled={analysing || uploading || !images.length}
          style={{ marginBottom: '1.25rem' }}
        >
          {analysing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin-slow 0.8s linear infinite' }} />
              Analysing…
            </span>
          ) : 'Analyse with Claude Vision'}
        </button>
      )}

      {error && (
        <p style={{ color: 'var(--coral)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '1rem' }}>{error}</p>
      )}

      {/* Result card */}
      {result && (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--teal-10)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span className="section-label">Vision Analysis</span>
            {result.condition_grade && (
              <span className="badge badge-mono" style={{ background: `${conditionColor(result.condition_grade)}18`, color: conditionColor(result.condition_grade), fontSize: '0.7rem' }}>
                {result.condition_grade}
              </span>
            )}
          </div>

          {result.estimated_value != null && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                Estimated Value
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--blue)', letterSpacing: '-0.01em' }}>
                ₹{Number(result.estimated_value).toLocaleString('en-IN')}
              </p>
              {result.confidence != null && (
                <>
                  <div style={{ height: '4px', background: 'var(--teal-10)', borderRadius: '2px', marginTop: '0.5rem' }}>
                    <div style={{ height: '100%', width: `${Math.round(result.confidence * 100)}%`, background: 'var(--teal)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                    {Math.round(result.confidence * 100)}% confidence
                  </p>
                </>
              )}
            </div>
          )}

          {result.damage_report && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.375rem' }}>Damage Report</p>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', lineHeight: 1.7 }}>{result.damage_report}</p>
            </div>
          )}

          {result.reasoning && (
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.375rem' }}>AI Assessment</p>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', lineHeight: 1.7 }}>{result.reasoning}</p>
            </div>
          )}

          {result.issues?.length > 0 && (
            <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {result.issues.map((issue, i) => (
                <span key={i} className="badge badge-warn badge-mono" style={{ fontSize: '0.7rem' }}>{issue}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
