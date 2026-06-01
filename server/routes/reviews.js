const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReviewSchema } = require('../middleware/schemas');

router.post('/', auth, validate(createReviewSchema), async (req, res, next) => {
  try {
    const { trade_id, reviewee_id, rating, comment } = req.body;

    // Ensure reviewer is a party to the trade and it's completed
    const tradeRes = await db.query(
      'SELECT * FROM trades WHERE id=$1 AND status=$2 AND (requester_id=$3 OR owner_id=$3)',
      [trade_id, 'completed', req.user.id]
    );
    if (!tradeRes.rows.length)
      return res.status(403).json({ message: 'You can only review completed trades you were part of' });

    const result = await db.query(
      `INSERT INTO reviews (trade_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [trade_id, req.user.id, reviewee_id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
