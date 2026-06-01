import React, { useState } from 'react';
import './TradeValueEstimator.css';

const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];
const CONDITION_MULTIPLIER = { new: 1.0, like_new: 0.85, good: 0.70, fair: 0.50, poor: 0.30 };

export default function TradeValueEstimator({ prefillItem1, prefillItem2, compact = false }) {
  const [item1, setItem1] = useState(prefillItem1 || { title: '', condition: 'good', value: '' });
  const [item2, setItem2] = useState(prefillItem2 || { title: '', condition: 'good', value: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [open, setOpen]     = useState(!compact);

  const analyze = async () => {
    if (!item1.title || !item2.title) {
      setError('Please fill in both item names.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    const prompt = `You are a fair trade value estimator. Analyze these two items being considered for a barter trade and give a clear, practical assessment.

Item A: "${item1.title}"
Condition: ${item1.condition.replace('_', ' ')}
${item1.value ? `Estimated value: ₹${item1.value}` : 'No value estimate provided'}

Item B: "${item2.title}"
Condition: ${item2.condition.replace('_', ' ')}
${item2.value ? `Estimated value: ₹${item2.value}` : 'No value estimate provided'}

Respond ONLY with a JSON object in this exact format, no markdown, no extra text:
{
  "verdict": "fair" | "item_a_higher" | "item_b_higher",
  "fairness_score": <number 0-100, where 100 is perfectly fair>,
  "item_a_estimated_value": <estimated INR value as number>,
  "item_b_estimated_value": <estimated INR value as number>,
  "suggested_cash_adjustment": <INR amount, positive means B should pay A, negative means A should pay B, 0 if fair>,
  "summary": "<2 sentences explaining the assessment>",
  "tips": ["<tip 1>", "<tip 2>"]
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setError('Could not get AI estimate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verdictLabel = {
    fair: '⚖️ Fair Trade',
    item_a_higher: '📈 Item A is Worth More',
    item_b_higher: '📈 Item B is Worth More',
  };

  const verdictColor = {
    fair: '#22c55e',
    item_a_higher: '#f59e0b',
    item_b_higher: '#f59e0b',
  };

  const getFairnessBar = (score) => {
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
    return { width: `${score}%`, background: color };
  };

  return (
    <div className={`tve-wrap ${compact ? 'tve-compact' : ''}`}>
      {compact && (
        <button className="tve-toggle" onClick={() => setOpen(o => !o)}>
          🤖 AI Trade Value Estimator {open ? '▲' : '▼'}
        </button>
      )}

      {open && (
        <div className="tve-body">
          {!compact && <div className="tve-header">
            <span className="tve-icon">🤖</span>
            <div>
              <h3>AI Trade Value Estimator</h3>
              <p>Get an instant AI-powered fairness assessment for any trade</p>
            </div>
          </div>}

          <div className="tve-items">
            {/* Item A */}
            <div className="tve-item">
              <div className="tve-item-label">Item A</div>
              <input
                className="tve-input"
                placeholder="e.g. iPhone 12, Bicycle, Guitar…"
                value={item1.title}
                onChange={e => setItem1({ ...item1, title: e.target.value })}
              />
              <div className="tve-row">
                <select
                  className="tve-select"
                  value={item1.condition}
                  onChange={e => setItem1({ ...item1, condition: e.target.value })}
                >
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
                <input
                  className="tve-input tve-value"
                  type="number"
                  placeholder="Value ₹ (optional)"
                  value={item1.value}
                  onChange={e => setItem1({ ...item1, value: e.target.value })}
                />
              </div>
            </div>

            <div className="tve-vs">⇄</div>

            {/* Item B */}
            <div className="tve-item">
              <div className="tve-item-label">Item B</div>
              <input
                className="tve-input"
                placeholder="e.g. Samsung TV, Camera, Books…"
                value={item2.title}
                onChange={e => setItem2({ ...item2, title: e.target.value })}
              />
              <div className="tve-row">
                <select
                  className="tve-select"
                  value={item2.condition}
                  onChange={e => setItem2({ ...item2, condition: e.target.value })}
                >
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
                <input
                  className="tve-input tve-value"
                  type="number"
                  placeholder="Value ₹ (optional)"
                  value={item2.value}
                  onChange={e => setItem2({ ...item2, value: e.target.value })}
                />
              </div>
            </div>
          </div>

          {error && <p className="tve-error">{error}</p>}

          <button
            className="tve-btn"
            onClick={analyze}
            disabled={loading}
          >
            {loading ? (
              <span className="tve-loading">
                <span className="tve-spinner" /> Analysing trade…
              </span>
            ) : '✨ Estimate Trade Fairness'}
          </button>

          {result && (
            <div className="tve-result">
              <div className="tve-verdict" style={{ borderColor: verdictColor[result.verdict] }}>
                <span className="tve-verdict-label" style={{ color: verdictColor[result.verdict] }}>
                  {verdictLabel[result.verdict]}
                </span>
                <div className="tve-fairness">
                  <span>Fairness Score</span>
                  <div className="tve-bar-bg">
                    <div className="tve-bar-fill" style={getFairnessBar(result.fairness_score)} />
                  </div>
                  <span className="tve-score">{result.fairness_score}/100</span>
                </div>
              </div>

              <div className="tve-values">
                <div className="tve-val-box">
                  <span className="tve-val-label">Item A Est. Value</span>
                  <span className="tve-val-num">₹{result.item_a_estimated_value?.toLocaleString()}</span>
                </div>
                <div className="tve-val-box">
                  <span className="tve-val-label">Item B Est. Value</span>
                  <span className="tve-val-num">₹{result.item_b_estimated_value?.toLocaleString()}</span>
                </div>
                {result.suggested_cash_adjustment !== 0 && (
                  <div className="tve-val-box tve-adj">
                    <span className="tve-val-label">Suggested Cash Top-up</span>
                    <span className="tve-val-num tve-adj-num">
                      {result.suggested_cash_adjustment > 0
                        ? `B pays A ₹${Math.abs(result.suggested_cash_adjustment).toLocaleString()}`
                        : `A pays B ₹${Math.abs(result.suggested_cash_adjustment).toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>

              <p className="tve-summary">{result.summary}</p>

              {result.tips?.length > 0 && (
                <div className="tve-tips">
                  <div className="tve-tips-title">💡 Tips</div>
                  {result.tips.map((tip, i) => (
                    <div key={i} className="tve-tip">• {tip}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
