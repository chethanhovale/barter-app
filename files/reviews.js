// ── reviews.js ───────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res, next) => {
  try {
    const { trade_id, reviewee_id, rating, comment } = req.body;
    const result = await db.query(
      `INSERT INTO reviews (trade_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [trade_id, req.user.id, reviewee_id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
