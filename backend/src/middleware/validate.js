import { ZodError } from 'zod';

// Hono middleware: validate c.req.json() against a Zod schema
export const validate = (schema) => async (c, next) => {
  try {
    const body = await c.req.json();
    c.set('body', schema.parse(body));
    await next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
      return c.json({ message: errors[0]?.message || 'Validation failed.', errors }, 422);
    }
    // Bad JSON body
    if (error instanceof SyntaxError) {
      return c.json({ message: 'Invalid JSON in request body.' }, 400);
    }
    throw error;
  }
};
