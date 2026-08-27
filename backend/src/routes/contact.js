import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { submitContactSchema } from '../validators/contact.js';
import { newId, now } from '../utils/id.js';
import logger from '../utils/logger.js';

import { sendContactAdminNotification, sendContactUserConfirmation } from '../utils/email.js';

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

    // Send email notifications via Brevo in background
    if (c.env.BREVO_API_KEY) {
      const contactData = { name, email, phone, subject, message };
      // Use executionCtx.waitUntil or Promise.allSettled
      const emailPromises = [
        sendContactAdminNotification({
          apiKey: c.env.BREVO_API_KEY,
          senderEmail: c.env.BREVO_SENDER_EMAIL,
          adminNotificationEmail: c.env.ADMIN_NOTIFICATION_EMAIL,
          contact: contactData,
        }),
        sendContactUserConfirmation({
          apiKey: c.env.BREVO_API_KEY,
          senderEmail: c.env.BREVO_SENDER_EMAIL,
          contact: contactData,
        }),
      ];

      if (c.executionCtx && c.executionCtx.waitUntil) {
        c.executionCtx.waitUntil(Promise.allSettled(emailPromises));
      } else {
        await Promise.allSettled(emailPromises);
      }
    }

    return c.json({ success: true, message: 'Contact form submitted successfully' }, 201);
  } catch (error) {
    logger.error('Error saving contact form', { error: error.message });
    return c.json({ success: false, error: 'Server Error. Could not submit contact form.' }, 500);
  }
});

export default contact;
