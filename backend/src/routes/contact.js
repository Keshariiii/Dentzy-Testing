import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { submitContactSchema } from '../validators/contact.js';
import { newId, now } from '../utils/id.js';
import logger from '../utils/logger.js';

const contact = new Hono();

// POST /api/contact
contact.post('/', validate(submitContactSchema), async (c) => {
  try {
    const { name, email, phone, subject, message } = c.get('body');
    const id = newId();
    const ts = now();

    await c.env.DB.prepare(
      'INSERT INTO contacts (id, name, email, phone, subject, message, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, name, email, phone || '', subject || '', message, ts, ts).run();

    logger.info('Contact form submitted', { contactId: id });
    return c.json({ success: true, message: 'Contact form submitted successfully' }, 201);
  } catch (error) {
    logger.error('Error saving contact form', { error: error.message });
    return c.json({ success: false, error: 'Server Error. Could not submit contact form.' }, 500);
  }
});

export default contact;
