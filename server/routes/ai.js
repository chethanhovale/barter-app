/**
 * server/routes/ai.js
 *
 * Thin proxy layer: React → Express /api/ai/* → FastAPI :8000
 *
 * Why proxy through Express instead of calling FastAPI directly from React?
 * 1. Single origin — React only needs to know about your Express server
 * 2. Auth stays in one place — we validate JWT before forwarding
 * 3. Easy to add rate-limiting, caching, or logging here later
 *
 * Add to server/index.js:
 *   const aiRoutes = require('./routes/ai');
 *   app.use('/api/ai', aiRoutes);
 */

const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');           // npm install node-fetch@2
const auth    = require('../middleware/auth');

const AI_URL  = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Helper: forward to FastAPI and stream the response back ─────
async function forwardToAI(req, res, next, path, method = 'POST') {
  try {
    const url  = `${AI_URL}${path}`;
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (method !== 'GET' && req.body) {
      opts.body = JSON.stringify(req.body);
    }

    const aiRes = await fetch(url, opts);
    const data  = await aiRes.json();

    if (!aiRes.ok) {
      return res.status(aiRes.status).json(data);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ── Semantic search (no auth required — public listings) ────────
// GET  /api/ai/search?q=vintage+camera
// POST /api/ai/search  { "query": "vintage camera", "top_k": 8 }
router.get('/search',  (req, res, next) => {
  const qs = new URLSearchParams(req.query).toString();
  forwardToAI(req, res, next, `/search?${qs}`, 'GET');
});

router.post('/search', (req, res, next) => {
  forwardToAI(req, res, next, '/search', 'POST');
});

// ── Listing enhancer (auth required) ───────────────────────────
// POST /api/ai/listings/enhance
// Body: { title, description, category?, condition? }
router.post('/listings/enhance', auth, (req, res, next) => {
  forwardToAI(req, res, next, '/listings/enhance', 'POST');
});

// ── Trade fairness estimator (auth required) ────────────────────
// POST /api/ai/trades/estimate
// Body: { offered_title, offered_description, offered_value?,
//         requested_title, requested_description, requested_value? }
router.post('/trades/estimate', auth, (req, res, next) => {
  forwardToAI(req, res, next, '/trades/estimate', 'POST');
});

// ── ETL: ingest a single listing (internal, no user auth) ───────
// Called automatically from listings routes after create/update
router.post('/ingest/listing', async (req, res, next) => {
  forwardToAI(req, res, next, '/ingest/listing', 'POST');
});

module.exports = router;
