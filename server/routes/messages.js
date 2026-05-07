const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createMessageSchema } = require('../middleware/schemas');

// GET /api/messages/:tradeId
router.get('/:tradeId', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT m.*, u.username, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.trade_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.tradeId]
    );
    await db.query(
      'UPDATE messages SET is_read=TRUE WHERE trade_id=$1 AND sender_id != $2',
      [req.params.tradeId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/messages
router.post('/', auth, validate(createMessageSchema), async (req, res, next) => {
  try {
    const { trade_id, content } = req.body;
    const result = await db.query(
      'INSERT INTO messages (trade_id, sender_id, content) VALUES ($1,$2,$3) RETURNING *',
      [trade_id, req.user.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
