const { z } = require('zod');

/**
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On failure it responds 400 with a structured errors array.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  req.body = result.data; // use the parsed/coerced data
  next();
};

module.exports = validate;
