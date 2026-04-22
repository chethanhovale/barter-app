const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/users/:id — public profile
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, username, avatar_url, bio, location, rating, total_reviews, created_at
       FROM users WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/users/me — update own profile
router.put('/me', auth, async (req, res, next) => {
  try {
    const { bio, location, avatar_url } = req.body;
    const result = await db.query(
      'UPDATE users SET bio=$1, location=$2, avatar_url=$3 WHERE id=$4 RETURNING id, username, bio, location, avatar_url',
      [bio, location, avatar_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
