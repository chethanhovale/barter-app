const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// GET /api/notifications — get my notifications
router.get('/', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', auth, async (req, res, next) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', auth, async (req, res, next) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) { next(err); }
});

// DELETE /api/notifications/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
