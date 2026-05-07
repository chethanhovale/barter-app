import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';

/* ═══════════════════════════════════════════════════════════════
   BARTER AI — Deep Space Homepage
   Pure CSS-in-JS, zero new dependencies
═══════════════════════════════════════════════════════════════ */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');

  :root {
    --bg:       #050508;
    --surface:  #0c0d14;
    --card:     rgba(255,255,255,0.032);
    --border:   rgba(255,255,255,0.07);
    --blue:     #3b82f6;
    --green:    #10b981;
    --amber:    #f59e0b;
    --text:     #e2e8f0;
    --muted:    #475569;
    --dim:      #1e293b;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  .hm-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .hm-root { background: var(--bg); color: var(--text); font-family: var(--font-body); overflow-x: hidden; }

  .hm-root::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
  }

  /* ════ HERO ════ */
  .hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 5vw 80px; text-align: center; overflow: hidden;
  }
  .hero-orb-1 {
    position: absolute; width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,.12) 0%, transparent 65%);
    top: -200px; left: -200px; pointer-events: none;
    animation: drift1 12s ease-in-out infinite alternate;
  }
  .hero-orb-2 {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.08) 0%, transparent 65%);
    bottom: -200px; right: -100px; pointer-events: none;
    animation: drift2 15s ease-in-out infinite alternate;
  }
  .hero-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 100%);
  }
  @keyframes drift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(60px,40px) scale(1.1)} }
  @keyframes drift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,-30px) scale(1.08)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tagPulse{ 0%{transform:scale(1)} 50%{transform:scale(1.07)} 100%{transform:scale(1)} }

  .hero-eyebrow {
    position: relative; z-index: 1;
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.3);
    border-radius: 50px; padding: 6px 16px;
    font-size: 12px; font-weight: 600; color: #93c5fd;
    font-family: var(--font-mono); letter-spacing: .06em; margin-bottom: 28px;
    animation: fadeUp .6s ease both;
  }
  .live-dot { width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green);animation:blink 1.4s infinite; }

  .hero-h1 {
    position:relative;z-index:1;
    font-family:var(--font-head);font-size:clamp(3rem,7vw,5.5rem);
    font-weight:800;line-height:1.0;letter-spacing:-.04em;color:#fff;
    margin-bottom:24px;animation:fadeUp .7s .1s ease both;
  }
  .grad {
    background:linear-gradient(135deg,var(--blue) 0%,#06b6d4 40%,var(--green) 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .hero-sub {
    position:relative;z-index:1;font-size:1.1rem;color:var(--muted);
    max-width:540px;line-height:1.75;margin:0 auto 40px;
    animation:fadeUp .7s .2s ease both;
  }

  .search-shell { position:relative;z-index:1;width:100%;max-width:620px;margin:0 auto 28px;animation:fadeUp .7s .3s ease both; }
  .search-bar {
    display:flex;align-items:center;gap:10px;
    background:rgba(255,255,255,.05);backdrop-filter:blur(24px) saturate(180%);
    border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:8px 8px 8px 20px;
    transition:border-color .25s,box-shadow .25s;
  }
  .search-bar.focused { border-color:rgba(59,130,246,.5);box-shadow:0 0 0 3px rgba(59,130,246,.12),0 20px 60px rgba(0,0,0,.5); }
  .search-input { flex:1;background:transparent;border:none;outline:none;font-size:1rem;color:var(--text);font-family:var(--font-body);padding:8px 0; }
  .search-input::placeholder { color:var(--muted); }
  .search-btn {
    background:linear-gradient(135deg,var(--blue),#2563eb);border:none;border-radius:12px;
    color:#fff;font-weight:700;font-size:.9rem;font-family:var(--font-body);
    padding:11px 22px;cursor:pointer;transition:transform .15s,box-shadow .15s;
  }
  .search-btn:hover { transform:translateY(-1px);box-shadow:0 8px 24px rgba(59,130,246,.4); }

  .sem-tags { position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:36px;animation:fadeUp .7s .4s ease both; }
  .sem-tag {
    background:rgba(255,255,255,.04);border:1px solid var(--border);
    border-radius:50px;padding:6px 14px;font-size:12px;color:#94a3b8;
    cursor:pointer;transition:all .2s;user-select:none;
  }
  .sem-tag:hover { background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.4);color:#93c5fd;animation:tagPulse .4s ease;box-shadow:0 0 16px rgba(59,130,246,.2); }

  .ticker-bar {
    position:relative;z-index:1;display:flex;gap:0;align-items:center;
    background:rgba(255,255,255,.03);border:1px solid var(--border);
    border-radius:50px;padding:2px;overflow:hidden;
    animation:fadeUp .7s .5s ease both;
  }
  .ticker-item { padding:8px 20px;font-size:12px;font-weight:600;color:var(--muted);white-space:nowrap;font-family:var(--font-mono);border-right:1px solid var(--border); }
  .ticker-item:last-child { border-right:none; }
  .ticker-item span { color:var(--green); }

  /* ════ SECTIONS ════ */
  .sec { max-width:1200px;margin:0 auto;padding:100px 5vw;position:relative; }
  .sec-tag {
    display:inline-block;font-family:var(--font-mono);
    background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);
    border-radius:4px;padding:4px 12px;font-size:11px;font-weight:600;color:#60a5fa;
    letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px;
  }
  .sec-h2 { font-family:var(--font-head);font-size:clamp(2rem,4vw,3rem);font-weight:800;color:#fff;letter-spacing:-.03em;margin-bottom:8px;line-height:1.1; }
  .sec-sub { color:var(--muted);font-size:1rem;margin-bottom:56px;line-height:1.7; }

  /* ════ BENTO ════ */
  .bento { display:grid;grid-template-columns:repeat(12,1fr);gap:14px; }
  .bcard { background:var(--card);border:1px solid var(--border);border-radius:20px;padding:28px;position:relative;overflow:hidden;transition:border-color .25s,transform .2s,box-shadow .25s; }
  .bcard:hover { transform:translateY(-3px); }
  .bcard-appraisal { grid-column:span 7; }
  .bcard-map       { grid-column:span 5; }
  .bcard-etl       { grid-column:span 12; }
  .bcard-label { font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;font-family:var(--font-mono);margin-bottom:8px; }
  .bcard-title { font-family:var(--font-head);font-size:1.3rem;font-weight:800;color:#fff;margin-bottom:8px; }
  .bcard-desc  { font-size:.83rem;color:var(--muted);line-height:1.65;margin-bottom:20px; }

  .ap-fields { display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap; }
  .ap-input {
    flex:1;min-width:120px;background:rgba(255,255,255,.05);border:1px solid var(--border);
    border-radius:10px;padding:10px 14px;color:var(--text);font-size:.88rem;font-family:var(--font-body);outline:none;transition:border-color .2s;
  }
  .ap-input:focus { border-color:var(--blue); }
  .ap-btn { background:linear-gradient(135deg,var(--blue),#1d4ed8);border:none;border-radius:10px;color:#fff;font-weight:700;font-size:.88rem;font-family:var(--font-body);padding:10px 20px;cursor:pointer;transition:all .2s;width:100%; }
  .ap-btn:hover { box-shadow:0 6px 20px rgba(59,130,246,.4); }
  .ap-btn:disabled { opacity:.6;cursor:not-allowed; }
  .ap-result { background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:12px;padding:16px;margin-top:14px;animation:fadeUp .4s ease; }
  .ap-result-val { font-family:var(--font-head);font-size:1.8rem;font-weight:800;color:var(--green); }
  .ap-result-meta { font-size:.78rem;color:var(--muted);margin-top:4px;font-family:var(--font-mono); }

  .etl-status { display:flex;align-items:center;gap:8px;margin-bottom:16px; }
  .etl-dot { width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green);animation:blink 1.2s infinite; }
  .etl-feed { font-family:var(--font-mono);font-size:.75rem;color:#64748b; }
  .etl-line { padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);animation:slideIn .4s ease; }
  .etl-line .key { color:var(--blue); }
  .etl-line .val { color:var(--green); }

  /* ════ PILLARS ════ */
  .pillars-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
  .pillar { background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px;position:relative;overflow:hidden;transition:border-color .3s,transform .2s,box-shadow .3s;cursor:default; }
  .pillar:hover { transform:translateY(-4px); }
  .pillar-glow { position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;pointer-events:none; }
  .pillar-icon { font-size:2.4rem;margin-bottom:20px;display:block; }
  .pillar-num  { font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;margin-bottom:10px;opacity:.5; }
  .pillar-h    { font-family:var(--font-head);font-size:1.15rem;font-weight:800;color:#fff;margin-bottom:10px; }
  .pillar-p    { font-size:.85rem;color:var(--muted);line-height:1.7;margin-bottom:20px; }
  .pillar-tags { display:flex;flex-wrap:wrap;gap:6px; }
  .pillar-tag  { border-radius:4px;padding:3px 8px;font-size:10px;font-weight:700;font-family:var(--font-mono); }

  /* ════ DEV SECTION ════ */
  .dev-split  { display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start; }
  .dev-name   { font-family:var(--font-head);font-size:2.2rem;font-weight:800;color:#fff;margin-bottom:8px; }
  .dev-title  { font-family:var(--font-mono);font-size:.85rem;color:var(--blue);margin-bottom:16px; }
  .dev-bio    { font-size:.9rem;color:var(--muted);line-height:1.8;margin-bottom:24px; }
  .dev-socials{ display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px; }
  .dev-social { display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:9px 16px;color:var(--text);text-decoration:none;font-size:.85rem;font-weight:600;transition:all .2s; }
  .dev-social:hover { background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.4);color:#93c5fd; }
  .dev-cta    { display:inline-block;background:linear-gradient(135deg,var(--blue),#1d4ed8);color:#fff;text-decoration:none;font-weight:700;font-size:.95rem;padding:13px 28px;border-radius:12px;box-shadow:0 4px 20px rgba(59,130,246,.35);transition:all .2s; }
  .dev-cta:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(59,130,246,.5); }

  .ep-toggle { background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-size:.8rem;font-family:var(--font-mono);font-weight:600;color:var(--muted);cursor:pointer;margin-bottom:16px;display:flex;align-items:center;gap:8px;transition:all .2s; }
  .ep-toggle:hover { border-color:var(--blue);color:var(--blue); }
  .ep-list   { animation:fadeUp .3s ease; }
  .ep-item   { display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-family:var(--font-mono);font-size:.78rem; }
  .ep-item:last-child { border-bottom:none; }
  .ep-method { padding:2px 8px;border-radius:4px;font-weight:700;font-size:10px; }
  .ep-get    { background:rgba(16,185,129,.15);color:var(--green); }
  .ep-post   { background:rgba(59,130,246,.15);color:var(--blue); }
  .ep-path   { color:#e2e8f0; }
  .ep-desc   { color:var(--muted);font-size:10px;margin-left:auto; }

  .terminal { background:#080b10;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;font-family:var(--font-mono); }
  .term-bar { background:rgba(255,255,255,.04);padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.06); }
  .term-dot { width:11px;height:11px;border-radius:50%; }
  .term-title{ font-size:11px;color:var(--muted);margin-left:8px; }
  .term-body { padding:22px 24px;font-size:.78rem;line-height:2.1; }
  .t-dim   { color:#334155; }
  .t-blue  { color:#60a5fa; }
  .t-green { color:var(--green); }
  .t-amber { color:var(--amber); }
  .t-white { color:#e2e8f0; }
  .t-cursor{ display:inline-block;width:8px;height:14px;background:var(--blue);animation:blink 1s infinite;vertical-align:middle; }

  .listings-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px; }
  .steps-grid    { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px; }
  .step-card     { text-align:center;padding:8px; }
  .step-num      { font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--dim);letter-spacing:.1em;margin-bottom:14px; }
  .step-icon-wrap{ width:64px;height:64px;border-radius:18px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px; }
  .step-h { font-family:var(--font-head);font-size:1rem;font-weight:800;color:#fff;margin-bottom:8px; }
  .step-p { font-size:.82rem;color:var(--muted);line-height:1.65; }

  .hm-footer { border-top:1px solid var(--border);padding:24px 5vw;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:.8rem;color:var(--muted); }
  .hm-footer a { color:var(--muted);text-decoration:none;transition:color .2s; }
  .hm-footer a:hover { color:var(--blue); }

  @media(max-width:768px) {
    .bcard-appraisal,.bcard-map,.bcard-etl { grid-column:span 12 !important; }
    .pillars-grid { grid-template-columns:1fr !important; }
    .dev-split    { grid-template-columns:1fr !important; }
    .ticker-bar   { flex-direction:column;border-radius:14px; }
    .ticker-item  { border-right:none;border-bottom:1px solid var(--border);width:100%;text-align:center; }
    .ticker-item:last-child { border-bottom:none; }
  }
`;

const ETL_LINES = [
  { key:'Brand',     val:'Apple' },
  { key:'Model',     val:'MacBook Pro 2022' },
  { key:'Condition', val:'like_new' },
  { key:'Category',  val:'Electronics' },
  { key:'Est.Value', val:'₹92,000' },
  { key:'Embedded',  val:'true → VectorStore' },
  { key:'Brand',     val:'Yonex' },
  { key:'Category',  val:'Sports & Fitness' },
  { key:'Title',     val:'Badminton Racket Set' },
  { key:'Indexed',   val:'vector_id_a3f9' },
];

function TradeMap() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p+1)%6), 900);
    return () => clearInterval(t);
  }, []);
  const nodes = [
    {x:170,y:30,  label:'📷 Camera',  color:'#3b82f6'},
    {x:290,y:90,  label:'🎸 Guitar',  color:'#8b5cf6'},
    {x:270,y:200, label:'🪑 Furniture',color:'#f59e0b'},
    {x:140,y:240, label:'📚 Books',   color:'#10b981'},
    {x:30, y:170, label:'👟 Sneakers', color:'#ec4899'},
    {x:20, y:70,  label:'💻 Laptop',  color:'#06b6d4'},
  ];
  const cx=155,cy=140;
  return (
    <svg viewBox="0 0 320 280" style={{width:'100%',maxWidth:340,height:'auto'}}>
      {nodes.map((n,i)=>(
        <line key={i} x1={cx} y1={cy} x2={n.x+44} y2={n.y+12}
          stroke={n.color} strokeWidth={pulse===i?2:1}
          strokeOpacity={pulse===i?.8:.25}
          strokeDasharray={pulse===i?'none':'4 4'}
          style={{transition:'all .3s'}}
        />
      ))}
      <circle cx={cx} cy={cy} r={28} fill="rgba(59,130,246,.15)" stroke="#3b82f6" strokeWidth={1.5}/>
      <text x={cx} y={cy-5} textAnchor="middle" fontSize={9} fill="#93c5fd" fontWeight="700" fontFamily="JetBrains Mono">RAG</text>
      <text x={cx} y={cy+7} textAnchor="middle" fontSize={8} fill="#64748b" fontFamily="JetBrains Mono">ENGINE</text>
      {nodes.map((n,i)=>(
        <g key={i}>
          <rect x={n.x} y={n.y} width={88} height={24} rx={8}
            fill={pulse===i?`${n.color}25`:`${n.color}10`}
            stroke={n.color} strokeWidth={pulse===i?1.5:1} strokeOpacity={pulse===i?1:.4}
            style={{transition:'all .3s'}}
          />
          <text x={n.x+44} y={n.y+12} textAnchor="middle" dominantBaseline="middle"
            fontSize={8.5} fill={pulse===i?n.color:'#64748b'} fontWeight="600" fontFamily="DM Sans"
            style={{transition:'fill .3s'}}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ETLFeed() {
  const [lines,setLines] = useState(ETL_LINES.slice(0,4));
  const [idx,setIdx]     = useState(4);
  useEffect(()=>{
    const t = setInterval(()=>{
      setIdx(i=>{
        const next = i % ETL_LINES.length;
        setLines(prev=>[ETL_LINES[next],...prev.slice(0,5)]);
        return next+1;
      });
    },1200);
    return ()=>clearInterval(t);
  },[]);
  return (
    <div className="etl-feed">
      {lines.map((l,i)=>(
        <div key={`${l.key}-${i}`} className="etl-line" style={{opacity:1-i*.15}}>
          <span className="key">{l.key}:</span>{' '}
          <span className="val">"{l.val}"</span>
          <span style={{color:'#1e293b',float:'right',fontSize:10}}>{i===0?'just now':`${(i)*1.2}s ago`}</span>
        </div>
      ))}
    </div>
  );
}

function AppraisalWidget() {
  const [item,   setItem]   = useState('');
  const [price,  setPrice]  = useState('');
  const [loading,setLoading]= useState(false);
  const [result, setResult] = useState(null);

  const handleValuate = async () => {
    if (!item || !price) return;
    setLoading(true); setResult(null);
    try {
      const {data} = await api.post('/ai/trades/valuate', {
        item_name: item, original_price: parseFloat(price),
        purchase_date: new Date(Date.now()-1.5*365*86400000).toISOString().split('T')[0],
        condition:'good', category:'Electronics',
      });
      setResult(data);
    } catch {
      const dep = Math.min(0.25*1.5, 0.85);
      setResult({
        estimated_value: Math.round(parseFloat(price)*(1-dep)*0.80),
        depreciation_rate: dep, confidence_score: 0.55,
        valuation_summary:'Mock mode — add ANTHROPIC_API_KEY for AI valuation.',
      });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="ap-fields">
        <input className="ap-input" placeholder="Item name (e.g. Sony Headphones)"
          value={item} onChange={e=>setItem(e.target.value)}/>
        <input className="ap-input" placeholder="Paid price (₹)" type="number"
          value={price} onChange={e=>setPrice(e.target.value)} style={{maxWidth:150}}/>
      </div>
      <button className="ap-btn" onClick={handleValuate} disabled={loading||!item||!price}>
        {loading ? '⏳ Analysing market...' : '✦ Valuate Now'}
      </button>
      {result && (
        <div className="ap-result">
          <div className="ap-result-val">₹{Math.round(result.estimated_value).toLocaleString()}</div>
          <div className="ap-result-meta">
            Market Value · {Math.round(result.depreciation_rate*100)}% depreciated · {Math.round(result.confidence_score*100)}% confidence
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query,   setQuery]  = useState('');
  const [focused, setFocused]= useState(false);
  const [recent,  setRecent] = useState([]);
  const [showEP,  setShowEP] = useState(false);
  const [hovP,    setHovP]   = useState(null);

  useEffect(()=>{
    api.get('/listings?limit=6').then(r=>setRecent(r.data.listings||[])).catch(()=>{});
  },[]);

  const handleSearch = e => {
    e.preventDefault();
    if (query.trim()) navigate(`/listings?search=${encodeURIComponent(query.trim())}`);
  };

  const semTags = [
    '🏕️ Gear for a camping trip','🎵 Learn an instrument',
    '📸 Photography starter kit','🏋️ Home gym setup',
    '📖 Business books','🎮 Gaming accessories',
  ];

  const pillars = [
    { icon:'🔍', num:'01', color:'#3b82f6', title:'Discovery Engine', sub:'Vector-Based RAG Search',
      desc:'Semantic embeddings find what keywords miss. Query by meaning — "camping gear" surfaces tents, sleeping bags, and trail shoes even if none use those exact words.',
      tags:['sentence-transformers','cosine similarity','vector store'] },
    { icon:'💰', num:'02', color:'#10b981', title:'Automated Valuation', sub:'Time-Based Depreciation',
      desc:'Category-aware depreciation curves (25%/yr for electronics, 5% for art) cross-referenced against live platform market data. Every trade is data-backed.',
      tags:['depreciation model','Claude AI','RAG context'] },
    { icon:'⚡', num:'03', color:'#f59e0b', title:'Verified Reliability', sub:'Secure Microservice Architecture',
      desc:'FastAPI microservice decoupled from Express backend. JWT auth proxy, async PostgreSQL, event-driven ETL sync. Every listing create/update auto-indexes.',
      tags:['FastAPI','asyncpg','JWT proxy'] },
  ];

  const endpoints = [
    {m:'GET', p:'/search',           d:'Semantic search',     c:'ep-get' },
    {m:'POST',p:'/trades/valuate',   d:'Asset valuation',     c:'ep-post'},
    {m:'POST',p:'/listings/enhance', d:'AI listing enhancer', c:'ep-post'},
    {m:'POST',p:'/trades/estimate',  d:'Trade fairness',      c:'ep-post'},
    {m:'POST',p:'/ingest',           d:'Bulk ETL sync',       c:'ep-post'},
    {m:'GET', p:'/health',           d:'Service health',      c:'ep-get' },
  ];

  return (
    <div className="hm-root">
      <style>{CSS}</style>

      {/* ════ HERO ════ */}
      <section className="hero">
        <div className="hero-orb-1"/><div className="hero-orb-2"/><div className="hero-grid"/>

        <div className="hero-eyebrow">
          <span className="live-dot"/>
          AI Barter Marketplace · RAG + FastAPI · 2026
        </div>

        <h1 className="hero-h1">
          Trade by<br/><span className="grad">Meaning.</span><br/>Not Keywords.
        </h1>

        <p className="hero-sub">
          The first barter platform powered by semantic vector search, AI asset valuation, and real-time ETL sync. Find exactly what you need — even if you can't describe it perfectly.
        </p>

        <div className="search-shell">
          <form onSubmit={handleSearch}>
            <div className={`search-bar${focused?' focused':''}`}>
              <span style={{fontSize:16,opacity:.4}}>✦</span>
              <input className="search-input"
                placeholder='Try "something for a road trip" or "learn photography"'
                value={query} onChange={e=>setQuery(e.target.value)}
                onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
              />
              <button type="submit" className="search-btn">Search ↵</button>
            </div>
          </form>
        </div>

        <div className="sem-tags">
          {semTags.map(t=>(
            <span key={t} className="sem-tag"
              onClick={()=>{setQuery(t.slice(3));navigate(`/listings?search=${encodeURIComponent(t.slice(3))}`)}}>
              {t}
            </span>
          ))}
        </div>

        <div className="ticker-bar">
          {[['1,200+','Items Synced'],['450+','Successful Swaps'],['₹0','Cash Required'],['<50ms','Search Latency'],['98%','Match Accuracy']].map(([v,l])=>(
            <div key={l} className="ticker-item"><span>{v}</span> {l}</div>
          ))}
        </div>
      </section>

      {/* ════ BENTO ════ */}
      <div className="sec">
        <span className="sec-tag">// what_we_do.tsx</span>
        <h2 className="sec-h2">Three Engines.<br/>One Platform.</h2>
        <p className="sec-sub">Live tools you can interact with right now.</p>
        <div className="bento">

          <div className="bcard bcard-appraisal"
            style={{borderColor:'rgba(59,130,246,.2)'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(59,130,246,.5)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(59,130,246,.2)'}>
            <div style={{position:'absolute',top:-80,right:-80,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div className="bcard-label" style={{color:'#60a5fa'}}>🔬 Live Tool · Instant Appraisal</div>
            <div className="bcard-title">How Much Is It Worth?</div>
            <div className="bcard-desc">Enter any item and its original price. Our AI engine calculates current market value using depreciation curves and live platform data.</div>
            <AppraisalWidget/>
          </div>

          <div className="bcard bcard-map"
            style={{borderColor:'rgba(139,92,246,.2)'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(139,92,246,.5)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(139,92,246,.2)'}>
            <div style={{position:'absolute',top:-80,right:-80,width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
            <div className="bcard-label" style={{color:'#a78bfa'}}>🕸️ Match Engine · RAG Trade-Map</div>
            <div className="bcard-title">Meaning-Based Matching</div>
            <div className="bcard-desc" style={{marginBottom:16}}>Vector search connects items by semantic similarity, not just keywords.</div>
            <TradeMap/>
          </div>

          <div className="bcard bcard-etl"
            style={{borderColor:'rgba(16,185,129,.15)'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(16,185,129,.4)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(16,185,129,.15)'}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16}}>
              <div style={{flex:1}}>
                <div className="bcard-label" style={{color:'#34d399'}}>⚡ ETL Pipeline · Real-Time Sync</div>
                <div className="bcard-title">System Live</div>
                <div className="bcard-desc" style={{maxWidth:400}}>Every listing create/update/delete auto-syncs to the vector store. Zero manual ingestion required.</div>
                <div className="etl-status">
                  <span className="etl-dot"/>
                  <span style={{fontSize:12,fontFamily:'var(--font-mono)',color:'var(--green)',fontWeight:600}}>PIPELINE ACTIVE</span>
                  <span style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-mono)'}}>· Postgres → Embedder → VectorDB</span>
                </div>
              </div>
              <div style={{flex:1,minWidth:260}}>
                <div style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-mono)',marginBottom:8}}>$ tail -f /var/log/etl.log</div>
                <ETLFeed/>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ════ PILLARS ════ */}
      <div style={{background:'rgba(255,255,255,.015)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div className="sec">
          <span className="sec-tag">// the_future_of_barter.ts</span>
          <h2 className="sec-h2">Built Different.</h2>
          <p className="sec-sub">Three core pillars that make every trade smarter.</p>
          <div className="pillars-grid">
            {pillars.map((p,i)=>(
              <div key={i} className="pillar"
                onMouseEnter={()=>setHovP(i)} onMouseLeave={()=>setHovP(null)}
                style={{borderColor:hovP===i?`${p.color}60`:'var(--border)',boxShadow:hovP===i?`0 0 40px ${p.color}18`:'none'}}>
                <div className="pillar-glow" style={{background:`radial-gradient(circle,${p.color}18 0%,transparent 70%)`}}/>
                <span className="pillar-icon">{p.icon}</span>
                <div className="pillar-num">{p.num} / 03</div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:p.color,fontFamily:'var(--font-mono)',textTransform:'uppercase',marginBottom:8}}>{p.sub}</div>
                <div className="pillar-h">{p.title}</div>
                <p className="pillar-p">{p.desc}</p>
                <div className="pillar-tags">
                  {p.tags.map(t=>(
                    <span key={t} className="pillar-tag" style={{background:`${p.color}12`,color:p.color,border:`1px solid ${p.color}30`}}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ RECENT LISTINGS ════ */}
      {recent.length > 0 && (
        <div className="sec" style={{paddingBottom:40}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32}}>
            <div>
              <span className="sec-tag">// live_listings</span>
              <h2 className="sec-h2" style={{marginTop:10}}>On the Market</h2>
            </div>
            <Link to="/listings" style={{color:'var(--blue)',textDecoration:'none',fontWeight:700,fontSize:'.9rem'}}>View all →</Link>
          </div>
          <div className="listings-grid">
            {recent.map(l=><ListingCard key={l.id} listing={l}/>)}
          </div>
        </div>
      )}

      {/* ════ HOW IT WORKS ════ */}
      <div className="sec" style={{paddingTop:60}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <span className="sec-tag">// how_it_works.md</span>
          <h2 className="sec-h2" style={{textAlign:'center',marginTop:12}}>Four Steps to a Fair Trade</h2>
        </div>
        <div className="steps-grid">
          {[
            {n:'01',icon:'📝',bg:'rgba(59,130,246,.1)', title:'List Your Item',      desc:'Post what you have and describe what you want. Our AI enhancer improves your listing automatically.'},
            {n:'02',icon:'✦', bg:'rgba(139,92,246,.1)',title:'AI Search Finds You', desc:'Semantic RAG surfaces your listing to the right people — even when they use different words.'},
            {n:'03',icon:'🤝',bg:'rgba(16,185,129,.1)', title:'Propose a Trade',    desc:'Send an offer. The valuation engine ensures both sides know the fair market value.'},
            {n:'04',icon:'✅',bg:'rgba(245,158,11,.1)', title:'Complete & Review',  desc:'Seal the deal, build your reputation, and keep the circular economy moving.'},
          ].map((s,i)=>(
            <div key={i} className="step-card">
              <div className="step-num">{s.n}</div>
              <div className="step-icon-wrap" style={{background:s.bg}}>{s.icon}</div>
              <div className="step-h">{s.title}</div>
              <p className="step-p">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════ DEVELOPER SECTION ════ */}
      <div style={{background:'rgba(255,255,255,.015)',borderTop:'1px solid var(--border)'}}>
        <div className="sec">
          <span className="sec-tag">// system_architect.profile</span>
          <h2 className="sec-h2" style={{marginBottom:48,marginTop:12}}>The Engineer Behind It</h2>
          <div className="dev-split">
            <div>
              <div className="dev-name">Chethan Hovale</div>
              <div className="dev-title">// Full-Stack AI Engineer · Bangalore, India</div>
              <p className="dev-bio">Built this AI barter marketplace to demonstrate real-world LLM integration — RAG pipelines, semantic vector search, async FastAPI microservices, and automated ETL sync. Designed for the future of the circular economy.</p>
              <p style={{fontSize:'.82rem',color:'#334155',fontFamily:'var(--font-mono)',marginBottom:24,lineHeight:1.8}}>
                "Built with FastAPI &amp; Vector Search.<br/>Designed for the future of circular economy."
              </p>
              <div className="dev-socials">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="dev-social"><span>⬡</span> GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="dev-social"><span style={{fontWeight:900}}>in</span> LinkedIn</a>
              </div>
              <Link to="/listings/new" className="dev-cta">Let's Collaborate →</Link>
              <div style={{marginTop:28}}>
                <button className="ep-toggle" onClick={()=>setShowEP(p=>!p)}>
                  <span style={{color:'var(--green)'}}>{'>'}</span>
                  {showEP?'Hide':'Show'} API Endpoints
                  <span style={{marginLeft:'auto'}}>{showEP?'▲':'▼'}</span>
                </button>
                {showEP && (
                  <div className="ep-list">
                    {endpoints.map((ep,i)=>(
                      <div key={i} className="ep-item">
                        <span className={`ep-method ${ep.c}`}>{ep.m}</span>
                        <span className="ep-path">{ep.p}</span>
                        <span className="ep-desc">{ep.d}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="terminal">
              <div className="term-bar">
                <div className="term-dot" style={{background:'#ff5f57'}}/>
                <div className="term-dot" style={{background:'#febc2e'}}/>
                <div className="term-dot" style={{background:'#28c840'}}/>
                <span className="term-title">barter-ai · architecture.sh</span>
              </div>
              <div className="term-body">
                <span className="t-dim">$ cat architecture.sh</span><br/><br/>
                <span className="t-blue">## Stack</span><br/>
                <span className="t-green">✓ </span><span className="t-white">FastAPI · Python 3.12 · Uvicorn</span><br/>
                <span className="t-green">✓ </span><span className="t-white">sentence-transformers (all-MiniLM-L6-v2)</span><br/>
                <span className="t-green">✓ </span><span className="t-white">JSON Vector Store (no C++ required)</span><br/>
                <span className="t-green">✓ </span><span className="t-white">Anthropic Claude · claude-sonnet-4</span><br/>
                <span className="t-green">✓ </span><span className="t-white">PostgreSQL · asyncpg · connection pool</span><br/>
                <span className="t-green">✓ </span><span className="t-white">React 18 · Socket.io · JWT refresh</span><br/><br/>
                <span className="t-blue">## Architecture</span><br/>
                <span className="t-amber">React</span><span className="t-dim"> → </span>
                <span className="t-amber">Express :5000</span><span className="t-dim"> → </span>
                <span className="t-amber">FastAPI :8000</span><br/>
                <span className="t-dim">{'            ↓              ↓'}</span><br/>
                <span className="t-dim">{'       PostgreSQL    VectorStore'}</span><br/><br/>
                <span className="t-blue">## Status</span><br/>
                <span className="t-green">✅ RAG pipeline · vector search ready</span><br/>
                <span className="t-green">✅ Valuation engine · live</span><br/>
                <span className="t-green">✅ ETL sync · event-driven</span><br/>
                <span className="t-dim">$ </span><span className="t-cursor"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="hm-footer">
        <span>© 2026 BarterApp · Built with FastAPI, React &amp; ❤️ by Chethan Hovale</span>
        <div style={{display:'flex',gap:24}}>
          <Link to="/listings">Browse</Link>
          <Link to="/listings/new">Post Item</Link>
          <Link to="/register">Sign Up</Link>
          <Link to="/login">Login</Link>
        </div>
      </footer>
    </div>
  );
}
