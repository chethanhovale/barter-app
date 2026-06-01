/**
 * Add these routes to server/routes/ai.js
 * (append after the existing routes)
 */

// ── Recommendations ─────────────────────────────────────────
// GET /api/ai/recommendations/:userId
router.get('/recommendations/:userId', auth, (req, res, next) => {
  const qs = new URLSearchParams(req.query).toString();
  forwardToAI(req, res, next,
    `/recommendations/${req.params.userId}${qs ? '?' + qs : ''}`, 'GET');
});

// GET /api/ai/recommendations/:userId/similar/:listingId
router.get('/recommendations/:userId/similar/:listingId', auth, (req, res, next) => {
  forwardToAI(req, res, next,
    `/recommendations/${req.params.userId}/similar/${req.params.listingId}`, 'GET');
});

// GET /api/ai/recommendations/:userId/mutual
router.get('/recommendations/:userId/mutual', auth, (req, res, next) => {
  forwardToAI(req, res, next,
    `/recommendations/${req.params.userId}/mutual`, 'GET');
});
