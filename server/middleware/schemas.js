const { z } = require('zod');

// ── Auth ─────────────────────────────────────────────────────
const registerSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(255),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1),
});

// ── Listings ─────────────────────────────────────────────────
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];
const LISTING_STATUSES = ['active', 'pending', 'traded', 'archived'];

const createListingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title must be at most 150 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters'),
  condition: z.enum(CONDITIONS, { required_error: 'Condition is required' }),
  category_id: z.coerce.number().int().positive().optional().nullable(),
  estimated_value: z.coerce.number().min(0).max(999999).optional().nullable(),
  looking_for: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
});

const updateListingSchema = createListingSchema.extend({
  status: z.enum(LISTING_STATUSES).optional(),
});

// ── Trades ───────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidField = (label) =>
  z
    .string({ required_error: `${label} is required` })
    .regex(UUID_REGEX, `${label} must be a valid UUID`);

const createTradeSchema = z.object({
  requested_listing_id: uuidField('requested_listing_id'),
  offered_listing_id: uuidField('offered_listing_id').optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
  cash_adjustment: z.coerce.number().min(0).max(999999).optional().default(0),
});

const updateTradeStatusSchema = z.object({
  status: z.enum(['accepted', 'declined', 'cancelled', 'completed'], {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status value',
  }),
});

// ── Messages ─────────────────────────────────────────────────
const createMessageSchema = z.object({
  trade_id: uuidField('trade_id'),
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be at most 2000 characters'),
});

// ── Reviews ──────────────────────────────────────────────────
const createReviewSchema = z.object({
  trade_id: uuidField('trade_id'),
  reviewee_id: uuidField('reviewee_id'),
  rating: z.coerce
    .number({ required_error: 'Rating is required' })
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000).optional().nullable(),
});

// ── Users ────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  avatar_url: z.string().url('Invalid avatar URL').max(500).optional().nullable(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  createListingSchema,
  updateListingSchema,
  createTradeSchema,
  updateTradeStatusSchema,
  createMessageSchema,
  createReviewSchema,
  updateProfileSchema,
};
