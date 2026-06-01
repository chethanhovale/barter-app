/**
 * ConditionWizard.jsx
 * client/src/components/ConditionWizard.jsx
 *
 * Interactive step-by-step condition assessment wizard.
 * Category-aware questions → condition score → estimated price
 * → triggers WhatCanIGet page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ══════════════════════════════════════════════════════════════
//  QUESTION CONFIG — one set per category
// ══════════════════════════════════════════════════════════════
const QUESTIONS = {
  Electronics: [
    { id: 'age',      label: 'How old is the device?',         type: 'choice', weight: 20,
      options: [{ label: 'Under 1 year', score: 100 }, { label: '1–2 years', score: 80 },
                { label: '3–4 years', score: 55 }, { label: '5+ years', score: 30 }] },
    { id: 'screen',   label: 'Screen / Display condition?',    type: 'choice', weight: 25,
      options: [{ label: 'Perfect — no scratches', score: 100 }, { label: 'Minor scratches', score: 75 },
                { label: 'Visible cracks', score: 40 }, { label: 'Severely damaged', score: 10 }] },
    { id: 'battery',  label: 'Battery health?',                type: 'slider', weight: 20,
      min: 0, max: 100, unit: '%' },
    { id: 'body',     label: 'Body / casing damage?',          type: 'choice', weight: 15,
      options: [{ label: 'No damage', score: 100 }, { label: 'Minor dents/scratches', score: 70 },
                { label: 'Significant damage', score: 35 }] },
    { id: 'functions',label: 'All features working?',          type: 'choice', weight: 15,
      options: [{ label: 'Everything works perfectly', score: 100 },
                { label: 'Minor issues (slow, glitchy)', score: 60 },
                { label: 'Major issues', score: 20 }] },
    { id: 'accessories', label: 'What\'s included?',           type: 'multi',  weight: 5,
      options: ['Original charger', 'Original box', 'Manual/accessories', 'Nothing extra'] },
  ],

  Clothing: [
    { id: 'age',     label: 'How long have you owned it?',     type: 'choice', weight: 15,
      options: [{ label: 'Less than 6 months', score: 100 }, { label: '6–12 months', score: 80 },
                { label: '1–3 years', score: 55 }, { label: '3+ years', score: 30 }] },
    { id: 'worn',    label: 'How many times worn?',            type: 'choice', weight: 25,
      options: [{ label: 'Never worn — tags on', score: 100 }, { label: '1–5 times', score: 85 },
                { label: '6–20 times', score: 60 }, { label: 'Worn regularly', score: 35 }] },
    { id: 'stains',  label: 'Any stains or marks?',            type: 'choice', weight: 30,
      options: [{ label: 'None', score: 100 }, { label: 'Very minor, barely visible', score: 70 },
                { label: 'Noticeable stains', score: 30 }] },
    { id: 'fabric',  label: 'Fabric condition?',               type: 'choice', weight: 20,
      options: [{ label: 'Like new — no pilling', score: 100 }, { label: 'Slight pilling/fading', score: 65 },
                { label: 'Heavy wear/fading', score: 30 }] },
    { id: 'tags',    label: 'Original tags attached?',         type: 'choice', weight: 10,
      options: [{ label: 'Yes', score: 100 }, { label: 'No', score: 70 }] },
  ],

  'Books & Media': [
    { id: 'cover',   label: 'Cover condition?',                type: 'choice', weight: 30,
      options: [{ label: 'Perfect', score: 100 }, { label: 'Minor wear', score: 75 },
                { label: 'Torn/damaged', score: 30 }] },
    { id: 'pages',   label: 'Pages condition?',                type: 'choice', weight: 40,
      options: [{ label: 'Clean — no marks', score: 100 }, { label: 'Light highlighting/notes', score: 70 },
                { label: 'Heavy writing/torn pages', score: 25 }] },
    { id: 'edition', label: 'Is it a recent edition?',         type: 'choice', weight: 30,
      options: [{ label: 'Latest edition', score: 100 }, { label: '1–3 years old', score: 75 },
                { label: '4+ years old', score: 50 }] },
  ],

  'Sports & Fitness': [
    { id: 'age',     label: 'How old is the equipment?',       type: 'choice', weight: 20,
      options: [{ label: 'Under 1 year', score: 100 }, { label: '1–2 years', score: 75 },
                { label: '3–5 years', score: 50 }, { label: '5+ years', score: 25 }] },
    { id: 'usage',   label: 'How often was it used?',          type: 'choice', weight: 30,
      options: [{ label: 'Rarely used', score: 100 }, { label: 'Occasional use', score: 75 },
                { label: 'Regular use', score: 45 }, { label: 'Heavy daily use', score: 20 }] },
    { id: 'damage',  label: 'Any physical damage?',            type: 'choice', weight: 35,
      options: [{ label: 'None', score: 100 }, { label: 'Minor scratches/scuffs', score: 70 },
                { label: 'Significant damage', score: 25 }] },
    { id: 'functional', label: 'Fully functional?',            type: 'choice', weight: 15,
      options: [{ label: 'Yes — works perfectly', score: 100 }, { label: 'Minor issues', score: 55 },
                { label: 'Needs repair', score: 15 }] },
  ],

  Furniture: [
    { id: 'age',     label: 'How old is the furniture?',       type: 'choice', weight: 15,
      options: [{ label: 'Under 2 years', score: 100 }, { label: '2–5 years', score: 70 },
                { label: '5–10 years', score: 45 }, { label: '10+ years', score: 25 }] },
    { id: 'surface', label: 'Surface condition?',              type: 'choice', weight: 35,
      options: [{ label: 'Perfect — no marks', score: 100 }, { label: 'Minor scratches', score: 70 },
                { label: 'Deep scratches/stains', score: 35 }] },
    { id: 'structure',label: 'Structural integrity?',          type: 'choice', weight: 35,
      options: [{ label: 'Solid — no wobble', score: 100 }, { label: 'Slight wobble', score: 60 },
                { label: 'Needs repair', score: 20 }] },
    { id: 'assembly',label: 'All parts present?',              type: 'choice', weight: 15,
      options: [{ label: 'Yes — complete', score: 100 }, { label: 'Missing minor parts', score: 65 },
                { label: 'Missing major parts', score: 20 }] },
  ],

  // Default for all other categories
  Other: [
    { id: 'age',     label: 'How old is the item?',            type: 'choice', weight: 25,
      options: [{ label: 'Under 1 year', score: 100 }, { label: '1–3 years', score: 70 },
                { label: '3–5 years', score: 45 }, { label: '5+ years', score: 25 }] },
    { id: 'condition',label: 'Overall physical condition?',    type: 'choice', weight: 40,
      options: [{ label: 'Like new', score: 100 }, { label: 'Good', score: 75 },
                { label: 'Fair — some wear', score: 50 }, { label: 'Poor', score: 20 }] },
    { id: 'functional',label: 'Is it fully functional?',       type: 'choice', weight: 35,
      options: [{ label: 'Yes — works perfectly', score: 100 }, { label: 'Minor issues', score: 55 },
                { label: 'Needs repair', score: 15 }] },
  ],
};

// Map score to condition label
function scoreToCondition(score) {
  if (score >= 88) return { label: 'Like New',  key: 'like_new', color: '#3b82f6', mult: 0.90 };
  if (score >= 70) return { label: 'Good',      key: 'good',     color: '#10b981', mult: 0.75 };
  if (score >= 48) return { label: 'Fair',       key: 'fair',     color: '#f59e0b', mult: 0.55 };
  return              { label: 'Poor',       key: 'poor',     color: '#ef4444', mult: 0.35 };
}

function computeScore(questions, answers) {
  let totalWeight = 0;
  let weightedScore = 0;
  questions.forEach(q => {
    const ans = answers[q.id];
    if (ans === undefined || ans === null) return;
    let qScore = 0;
    if (q.type === 'choice') {
      const opt = q.options.find(o => o.label === ans);
      qScore = opt ? opt.score : 0;
    } else if (q.type === 'slider') {
      qScore = ans;
    } else if (q.type === 'multi') {
      qScore = ans.includes('Nothing extra') ? 60 : Math.min(100, 60 + ans.length * 13);
    }
    weightedScore += (qScore * q.weight);
    totalWeight   += q.weight;
  });
  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

const CSS = `
  .wiz-root * { box-sizing: border-box; }
  .wiz-root { font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px 16px; }
  .wiz-progress { height: 4px; background: rgba(255,255,255,.08); border-radius: 50px; margin-bottom: 28px; overflow: hidden; }
  .wiz-progress-bar { height: 100%; border-radius: 50px; background: linear-gradient(90deg,#6366f1,#10b981); transition: width .4s ease; }
  .wiz-step { font-size: 11px; font-weight: 700; letter-spacing: .1em; color: #475569; margin-bottom: 6px; font-family: monospace; }
  .wiz-q { font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: 24px; line-height: 1.4; }
  .wiz-choices { display: flex; flex-direction: column; gap: 10px; }
  .wiz-choice {
    background: rgba(255,255,255,.04); border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 12px; padding: 14px 18px; cursor: pointer;
    font-size: .9rem; color: #94a3b8; font-weight: 500;
    transition: all .2s; text-align: left;
  }
  .wiz-choice:hover   { border-color: rgba(99,102,241,.5); color: #e2e8f0; background: rgba(99,102,241,.08); }
  .wiz-choice.selected{ border-color: #6366f1; color: #fff; background: rgba(99,102,241,.15); }
  .wiz-slider-wrap { padding: 8px 0 24px; }
  .wiz-slider { width: 100%; accent-color: #6366f1; cursor: pointer; height: 6px; }
  .wiz-slider-val { font-size: 2rem; font-weight: 800; color: #6366f1; text-align: center; margin-bottom: 12px; font-family: monospace; }
  .wiz-multi { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .wiz-multi-item {
    background: rgba(255,255,255,.04); border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 10px; padding: 10px 14px; cursor: pointer;
    font-size: .85rem; color: #94a3b8; transition: all .2s;
  }
  .wiz-multi-item.selected { border-color: #6366f1; color: #a5b4fc; background: rgba(99,102,241,.1); }
  .wiz-nav { display: flex; gap: 10px; margin-top: 28px; }
  .wiz-btn-next {
    flex: 1; background: linear-gradient(135deg,#6366f1,#4f46e5);
    border: none; border-radius: 12px; color: #fff;
    font-size: 1rem; font-weight: 700; padding: 14px;
    cursor: pointer; transition: all .2s; font-family: 'DM Sans',sans-serif;
  }
  .wiz-btn-next:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,.4); }
  .wiz-btn-next:disabled { opacity: .4; cursor: not-allowed; transform: none; }
  .wiz-btn-back {
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px; color: #64748b;
    font-size: .9rem; font-weight: 600; padding: 14px 20px;
    cursor: pointer; font-family: 'DM Sans',sans-serif; transition: all .2s;
  }
  .wiz-btn-back:hover { border-color: rgba(255,255,255,.2); color: #94a3b8; }
  .wiz-result { animation: fadeUp .5s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .wiz-score-ring { width: 120px; height: 120px; margin: 0 auto 20px; position: relative; }
  .wiz-breakdown { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 16px; margin: 16px 0; }
  .wiz-breakdown-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.04); font-size: .83rem; }
  .wiz-breakdown-row:last-child { border-bottom: none; }
  .wiz-price { text-align: center; padding: 20px; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2); border-radius: 16px; margin: 16px 0; }
  .wiz-price-val { font-size: 2.8rem; font-weight: 800; color: #10b981; font-family: monospace; }
  .wiz-price-label { font-size: .8rem; color: #64748b; margin-top: 4px; }
  .wiz-cta { width: 100%; background: linear-gradient(135deg,#10b981,#059669); border: none; border-radius: 12px; color: #fff; font-size: 1rem; font-weight: 700; padding: 16px; cursor: pointer; font-family: 'DM Sans',sans-serif; margin-top: 8px; transition: all .2s; }
  .wiz-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,.4); }
  .wiz-input { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 12px 16px; color: #e2e8f0; font-size: 1rem; font-family: 'DM Sans',sans-serif; outline: none; margin-bottom: 8px; transition: border-color .2s; }
  .wiz-input:focus { border-color: rgba(99,102,241,.5); }
  .wiz-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 10px; }
  .wiz-cat-btn {
    background: rgba(255,255,255,.04); border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 12px; padding: 16px 10px; cursor: pointer; text-align: center;
    transition: all .2s; font-family: 'DM Sans',sans-serif;
  }
  .wiz-cat-btn:hover   { border-color: rgba(99,102,241,.4); }
  .wiz-cat-btn.selected{ border-color: #6366f1; background: rgba(99,102,241,.12); }
  .wiz-cat-icon { font-size: 28px; margin-bottom: 6px; }
  .wiz-cat-name { font-size: .8rem; font-weight: 600; color: #94a3b8; }
  .wiz-cat-btn.selected .wiz-cat-name { color: #a5b4fc; }
`;

const CATEGORIES_CONFIG = [
  { id: 1,  name: 'Electronics',    icon: '💻' },
  { id: 2,  name: 'Clothing',       icon: '👕' },
  { id: 3,  name: 'Books & Media',  icon: '📚' },
  { id: 4,  name: 'Furniture',      icon: '🪑' },
  { id: 5,  name: 'Sports & Fitness',icon: '🏋️' },
  { id: 6,  name: 'Tools',          icon: '🔧' },
  { id: 7,  name: 'Services',       icon: '🤝' },
  { id: 8,  name: 'Food & Produce', icon: '🥦' },
  { id: 9,  name: 'Art & Crafts',   icon: '🎨' },
  { id: 10, name: 'Other',          icon: '📦' },
];

export default function ConditionWizard({ onComplete }) {
  const navigate  = useNavigate();
  const [phase,   setPhase]   = useState('intro');    // intro → questions → result
  const [itemName,setItemName]= useState('');
  const [origPrice,setOrigPrice]= useState('');
  const [category,setCategory]= useState('');
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const questions = QUESTIONS[category] || QUESTIONS.Other;
  const currentQ  = questions[step];
  const progress  = phase === 'questions' ? ((step) / questions.length) * 100 : phase === 'result' ? 100 : 0;

  const canNext = () => {
    if (phase === 'intro') return itemName.trim() && origPrice && category;
    if (!currentQ) return false;
    const ans = answers[currentQ.id];
    if (currentQ.type === 'multi') return ans && ans.length > 0;
    return ans !== undefined && ans !== null;
  };

  const handleNext = async () => {
    if (phase === 'intro') { setPhase('questions'); setStep(0); return; }
    if (step < questions.length - 1) { setStep(s => s + 1); return; }
    // Last question — compute result
    setLoading(true);
    try {
      const score     = computeScore(questions, answers);
      const condition = scoreToCondition(score);
      const price     = parseFloat(origPrice);
      // Call valuation API
      let estimated = Math.round(price * condition.mult);
      try {
        const purchaseDate = new Date(Date.now() - 2 * 365 * 86400000).toISOString().split('T')[0];
        const { data } = await api.post('/ai/trades/valuate', {
          item_name: itemName, original_price: price,
          purchase_date: purchaseDate, condition: condition.key,
          category, description: `Condition score: ${score}/100`,
        });
        estimated = Math.round(data.estimated_value);
      } catch {}
      setResult({ score, condition, estimated, originalPrice: price });
      setPhase('result');
    } finally { setLoading(false); }
  };

  const handleAnswer = (val) => setAnswers(prev => ({ ...prev, [currentQ.id]: val }));

  const handleMulti = (opt) => {
    const prev = answers[currentQ.id] || [];
    const next = prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt];
    setAnswers(a => ({ ...a, [currentQ.id]: next }));
  };

  const goWhatCanIGet = () => {
    if (onComplete) onComplete(result);
    navigate(`/what-can-i-get?value=${result.estimated}&item=${encodeURIComponent(itemName)}&category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="wiz-root">
      <style>{CSS}</style>

      {/* Progress bar */}
      <div className="wiz-progress">
        <div className="wiz-progress-bar" style={{ width: `${progress}%` }}/>
      </div>

      {/* ── INTRO ── */}
      {phase === 'intro' && (
        <div>
          <div className="wiz-step">STEP 1 OF {questions.length + 2}</div>
          <div className="wiz-q">Tell us about your item</div>
          <input className="wiz-input" placeholder="Item name (e.g. Samsung Galaxy S21)"
            value={itemName} onChange={e => setItemName(e.target.value)}/>
          <input className="wiz-input" placeholder="Original purchase price (₹)" type="number"
            value={origPrice} onChange={e => setOrigPrice(e.target.value)}/>
          <div style={{ fontSize: '.85rem', color: '#64748b', marginBottom: 14, fontWeight: 600 }}>
            Select category:
          </div>
          <div className="wiz-cat-grid">
            {CATEGORIES_CONFIG.map(c => (
              <div key={c.id} className={`wiz-cat-btn${category === c.name ? ' selected' : ''}`}
                onClick={() => setCategory(c.name)}>
                <div className="wiz-cat-icon">{c.icon}</div>
                <div className="wiz-cat-name">{c.name}</div>
              </div>
            ))}
          </div>
          <div className="wiz-nav">
            <button className="wiz-btn-next" onClick={handleNext} disabled={!canNext()}>
              Start Assessment →
            </button>
          </div>
        </div>
      )}

      {/* ── QUESTIONS ── */}
      {phase === 'questions' && currentQ && (
        <div>
          <div className="wiz-step">QUESTION {step + 1} OF {questions.length}</div>
          <div className="wiz-q">{currentQ.label}</div>

          {currentQ.type === 'choice' && (
            <div className="wiz-choices">
              {currentQ.options.map(opt => (
                <button key={opt.label}
                  className={`wiz-choice${answers[currentQ.id] === opt.label ? ' selected' : ''}`}
                  onClick={() => handleAnswer(opt.label)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === 'slider' && (
            <div className="wiz-slider-wrap">
              <div className="wiz-slider-val">{answers[currentQ.id] ?? 80}{currentQ.unit}</div>
              <input type="range" className="wiz-slider"
                min={currentQ.min} max={currentQ.max}
                value={answers[currentQ.id] ?? 80}
                onChange={e => handleAnswer(parseInt(e.target.value))}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 6 }}>
                <span>{currentQ.min}{currentQ.unit} (Replace soon)</span>
                <span>{currentQ.max}{currentQ.unit} (Perfect)</span>
              </div>
            </div>
          )}

          {currentQ.type === 'multi' && (
            <div className="wiz-multi">
              {currentQ.options.map(opt => (
                <div key={opt}
                  className={`wiz-multi-item${(answers[currentQ.id] || []).includes(opt) ? ' selected' : ''}`}
                  onClick={() => handleMulti(opt)}>
                  {opt}
                </div>
              ))}
            </div>
          )}

          <div className="wiz-nav">
            {step > 0 && (
              <button className="wiz-btn-back" onClick={() => setStep(s => s - 1)}>← Back</button>
            )}
            <button className="wiz-btn-next" onClick={handleNext}
              disabled={!canNext() || loading}>
              {loading ? 'Calculating...' : step === questions.length - 1 ? 'Get My Price →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === 'result' && result && (
        <div className="wiz-result">
          <div className="wiz-step">ASSESSMENT COMPLETE</div>
          <div className="wiz-q">Here's what your {itemName} is worth</div>

          {/* Condition badge */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{
              background: `${result.condition.color}20`,
              border: `1px solid ${result.condition.color}50`,
              borderRadius: 50, padding: '6px 18px',
              fontSize: 14, fontWeight: 700, color: result.condition.color,
            }}>
              {result.condition.label} · {result.score}/100
            </span>
          </div>

          {/* Score bar */}
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 50, height: 8, margin: '0 0 20px' }}>
            <div style={{
              width: `${result.score}%`, height: '100%', borderRadius: 50,
              background: result.condition.color, transition: 'width 1s ease',
            }}/>
          </div>

          {/* Price */}
          <div className="wiz-price">
            <div className="wiz-price-val">₹{result.estimated.toLocaleString()}</div>
            <div className="wiz-price-label">
              Estimated fair market value · Original: ₹{result.originalPrice.toLocaleString()}
            </div>
          </div>

          {/* Breakdown */}
          <div className="wiz-breakdown">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '.08em', marginBottom: 10 }}>
              SCORE BREAKDOWN
            </div>
            {questions.map(q => {
              const ans = answers[q.id];
              if (!ans) return null;
              let displayAns = Array.isArray(ans) ? ans.join(', ') : `${ans}${q.unit || ''}`;
              return (
                <div key={q.id} className="wiz-breakdown-row">
                  <span style={{ color: '#64748b' }}>{q.label}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{displayAns}</span>
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <button className="wiz-cta" onClick={goWhatCanIGet}>
            🔍 See What I Can Get for ₹{result.estimated.toLocaleString()} →
          </button>
          <button onClick={() => { setPhase('intro'); setAnswers({}); setStep(0); setResult(null); }}
            style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12, color: '#475569', padding: '12px', cursor: 'pointer',
              marginTop: 8, fontFamily: 'DM Sans,sans-serif', fontSize: '.85rem' }}>
            ↩ Start over
          </button>
        </div>
      )}
    </div>
  );
}
