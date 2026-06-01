const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTradeSchema, updateTradeStatusSchema } = require('../middleware/schemas');

// POST /api/trades
router.post('/', auth, validate(createTradeSchema), async (req, res, next) => {
  try {
    const { requested_listing_id, offered_listing_id, message, cash_adjustment } = req.body;

    const listingRes = await db.query('SELECT user_id FROM listings WHERE id=$1', [requested_listing_id]);
    if (!listingRes.rows.length) return res.status(404).json({ message: 'Listing not found' });
    const owner_id = listingRes.rows[0].user_id;

    if (owner_id === req.user.id)
      return res.status(400).json({ message: 'Cannot trade with yourself' });

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

// PUT /api/trades/:id/status
router.put('/:id/status', auth, validate(updateTradeStatusSchema), async (req, res, next) => {
  try {
    const { status } = req.body;

    const tradeRes = await db.query('SELECT * FROM trades WHERE id=$1', [req.params.id]);
    if (!tradeRes.rows.length) return res.status(404).json({ message: 'Trade not found' });

    const trade = tradeRes.rows[0];
    const isOwner     = trade.owner_id === req.user.id;
    const isRequester = trade.requester_id === req.user.id;

    if (!isOwner && !isRequester)
      return res.status(403).json({ message: 'Not a party to this trade' });

    // Only owner can accept / decline
    if (['accepted', 'declined'].includes(status) && !isOwner)
      return res.status(403).json({ message: 'Only the listing owner can accept or decline' });

    // Only requester can cancel a pending trade; either party can cancel an accepted one
    if (status === 'cancelled' && !isOwner && !isRequester)
      return res.status(403).json({ message: 'Not authorised to cancel this trade' });

    // Completed requires the trade to already be accepted
    if (status === 'completed' && trade.status !== 'accepted')
      return res.status(400).json({ message: 'Trade must be accepted before it can be completed' });

    // Only owner can mark completed (prevents unilateral completion by requester)
    if (status === 'completed' && !isOwner)
      return res.status(403).json({ message: 'Only the listing owner can mark a trade as completed' });

    const completedAt = status === 'completed' ? new Date() : null;
    const result = await db.query(
      'UPDATE trades SET status=$1, completed_at=$2 WHERE id=$3 RETURNING *',
      [status, completedAt, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/trades
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
