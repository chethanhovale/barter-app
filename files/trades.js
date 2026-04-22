const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/trades — propose a trade
router.post('/', auth, async (req, res, next) => {
  try {
    const { requested_listing_id, offered_listing_id, message, cash_adjustment } = req.body;

    // find the owner of the requested listing
    const listingRes = await db.query('SELECT user_id FROM listings WHERE id=$1', [requested_listing_id]);
    if (!listingRes.rows.length) return res.status(404).json({ message: 'Listing not found' });
    const owner_id = listingRes.rows[0].user_id;

    if (owner_id === req.user.id) return res.status(400).json({ message: 'Cannot trade with yourself' });

    const result = await db.query(
      `INSERT INTO trades (requested_listing_id, offered_listing_id, requester_id, owner_id, message, cash_adjustment)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [requested_listing_id, offered_listing_id, req.user.id, owner_id, message, cash_adjustment || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/trades/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.*,
              req.title AS requested_title, req.id AS requested_id,
              off.title AS offered_title,   off.id AS offered_id,
              u1.username AS requester_name,
              u2.username AS owner_name
       FROM trades t
       JOIN listings req ON t.requested_listing_id = req.id
       LEFT JOIN listings off ON t.offered_listing_id = off.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.owner_id = u2.id
       WHERE t.id=$1 AND (t.requester_id=$2 OR t.owner_id=$2)`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Trade not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/trades/:id/status — accept / decline / cancel
router.put('/:id/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body; // accepted | declined | cancelled | completed
    const allowed = ['accepted', 'declined', 'cancelled', 'completed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const tradeRes = await db.query('SELECT * FROM trades WHERE id=$1', [req.params.id]);
    if (!tradeRes.rows.length) return res.status(404).json({ message: 'Trade not found' });

    const trade = tradeRes.rows[0];
    // Only the owner can accept/decline; either party can cancel
    if (['accepted', 'declined'].includes(status) && trade.owner_id !== req.user.id)
      return res.status(403).json({ message: 'Only the listing owner can accept or decline' });

    const completedAt = status === 'completed' ? new Date() : null;
    const result = await db.query(
      'UPDATE trades SET status=$1, completed_at=$2 WHERE id=$3 RETURNING *',
      [status, completedAt, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/trades — my trades
router.get('/', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.*, req.title AS requested_title, off.title AS offered_title
       FROM trades t
       JOIN listings req ON t.requested_listing_id = req.id
       LEFT JOIN listings off ON t.offered_listing_id = off.id
       WHERE t.requester_id=$1 OR t.owner_id=$1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
