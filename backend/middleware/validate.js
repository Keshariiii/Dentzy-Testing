import { ZodError } from 'zod';

/**
 * Validation middleware factory.
 * Validates req.body against the given Zod schema.
 * Returns 422 Unprocessable Entity with structured errors on validation failure.
 *
 * Usage in routes:
 *   import { validate } from '../middleware/validate.js';
 *   import { registerSchema } from '../validators/authValidators.js';
 *   router.post('/register', validate(registerSchema), register);
 */
export const validate = (schema) => (req, res, next) => {
  try {
    // Parse and replace req.body with the validated + transformed data
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(422).json({
        message: errors[0]?.message || 'Validation failed.',
        errors,
      });
    }
    // Unexpected error — pass to global error handler
    next(error);
  }
};
