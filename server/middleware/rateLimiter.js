const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for auth endpoints (login / register).
 * 10 attempts per IP per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many attempts from this IP, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // only count failures toward the limit
});

/**
 * General API limiter — applied to all routes.
 * 200 requests per IP per 15 minutes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
});

/**
 * Upload limiter — tighter limit for image upload routes.
 * 20 uploads per IP per hour.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Upload limit reached. Please try again in an hour.',
  },
});

module.exports = { authLimiter, apiLimiter, uploadLimiter };
