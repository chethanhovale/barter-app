const db = require('../config/db');

/**
 * Create a notification for a user.
 * @param {string} userId  - recipient user UUID
 * @param {string} type    - e.g. 'trade_received', 'trade_accepted', 'new_message', 'review_received'
 * @param {string} message - human-readable text
 * @param {string} [linkId] - optional related entity ID (trade ID, listing ID, etc.)
 */
async function createNotification(userId, type, message, linkId = null) {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, message, link_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, type, message, linkId]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = { createNotification };
