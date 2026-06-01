// pages/Valuate.jsx
import { useState } from 'react';
import { useAI } from '../hooks/useAI';
import ConditionWizard from '../components/ConditionWizard';
import ItemConditionAnalyser from '../components/ItemConditionAnalyser';

const CATEGORIES = ['Electronics','Computers','Fitness','Books','Clothing','Furniture','Sports','Music','Other'];

export default function Valuate() {
  const [category, setCategory] = useState('Electronics');
  const [images, setImages]     = useState([]);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('wizard');
  const { valuateItem }         = useAI();

  const handleWizardComplete = async (data) => {
    setLoading(true); setResult(null);
    try {
      const res = await valuateItem({ ...data, category });
      setResult(res);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="main" style={{ background: 'var(--bg)' }}>
      <div style={{ background: 'white', borderBottom: '1px solid var(--teal-10)', padding: '1.75rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <span className="section-label">AI-Powered</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '0.25rem', marginTop: '0.5rem' }}>Item Valuation</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
            Get a market-accurate valuation using depreciation curves and live platform data.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
        {/* Category selector */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Item Category</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`badge badge-mono ${category === c ? 'badge-dark' : 'badge-gray'}`}
                style={{ cursor: 'pointer', border: 'none', padding: '0.375rem 0.875rem', fontSize: '0.8rem', transition: 'all 0.15s' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${tab === 'wizard' ? 'active' : ''}`} onClick={() => setTab('wizard')}>Condition Wizard</div>
          <div className={`tab ${tab === 'vision'  ? 'active' : ''}`} onClick={() => setTab('vision')}>Vision Analysis</div>
        </div>

        {tab === 'wizard' && (
          <div className="card animate-fadeIn">
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.65 }}>
              Answer a few guided questions about your item. The AI compares your answers against current platform listings to generate a market-accurate estimate.
            </p>
            <ConditionWizard category={category} onComplete={handleWizardComplete} />
          </div>
        )}

        {tab === 'vision' && (
          <div className="card animate-fadeIn">
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.65 }}>
              Upload photos of your item. Claude Vision will inspect condition, surface damage, and generate a valuation with confidence scoring.
            </p>
            <ItemConditionAnalyser images={images} setImages={setImages} category={category} showValuation />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="card animate-fadeIn" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '3rem 1.5rem', borderStyle: 'dashed', borderColor: 'var(--teal-30)' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid var(--teal-20)', borderTopColor: 'var(--teal)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin-slow 0.8s linear infinite' }} />
            <p style={{ fontWeight: 700, color: 'var(--dark)' }}>Running valuation analysis</p>
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Querying depreciation curves and market data</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="valuation-card animate-fadeIn" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span className="section-label">Valuation Result</span>
              {result.condition_grade && <span className="badge badge-teal badge-mono" style={{ fontSize: '0.7rem' }}>{result.condition_grade}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                  Estimated Market Value
                </p>
                <div className="valuation-score">
                  ₹{Number(result.estimated_value || 0).toLocaleString('en-IN')}
                </div>
                <div className="valuation-bar" style={{ marginTop: '1rem' }}>
                  <div className="valuation-bar__fill" style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.375rem' }}>
                  {Math.round((result.confidence || 0) * 100)}% confidence
                </p>

                {result.price_range && (
                  <div style={{ marginTop: '1.25rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', border: '1px solid var(--teal-10)' }}>
                    <p style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Market Range</p>
                    <p style={{ fontWeight: 800, color: 'var(--blue)', fontSize: '1.0625rem' }}>
                      ₹{Number(result.price_range.min).toLocaleString('en-IN')} – ₹{Number(result.price_range.max).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  {result.depreciation_pct && (
                    <span className="badge badge-warn badge-mono" style={{ fontSize: '0.7rem' }}>
                      -{result.depreciation_pct}% depreciation
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p style={{ fontWeight: 700, marginBottom: '0.625rem', fontSize: '0.9375rem' }}>AI Assessment</p>
                <p style={{ color: 'var(--gray)', fontSize: '0.875rem', lineHeight: 1.75 }}>{result.reasoning}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
