import { Hono } from 'hono';
import { validate } from '../middleware/validate.js';
import { submitContactSchema } from '../validators/contact.js';
import { newId, now } from '../utils/id.js';
import logger from '../utils/logger.js';
import { generateCode, generateCaptchaSVG } from '../utils/captcha.js';
import { createCaptchaToken, verifyCaptchaToken } from '../utils/crypto.js';
import { checkRateLimit, getClientIP } from '../utils/rateLimit.js';

import { sendContactAdminNotification, sendContactUserConfirmation } from '../utils/email.js';

const contact = new Hono();

// GET /api/contact/captcha — reuses existing CAPTCHA infrastructure from auth
contact.get('/captcha', async (c) => {
  try {
    const code = generateCode(6);
    const captchaSvg = generateCaptchaSVG(code);
    const captchaToken = await createCaptchaToken(code, c.env.JWT_SECRET);
    return c.json({ captchaToken, captchaSvg });
  } catch (err) {
    logger.error('Contact CAPTCHA generation error', { error: err.message });
    return c.json({ message: 'Failed to generate CAPTCHA.' }, 500);
  }
});

// POST /api/contact
contact.post('/', validate(submitContactSchema), async (c) => {
  try {
    const { name, email, phone, subject, message, captchaInput, captchaToken, hp_website } = c.get('body');

    // Honeypot: if filled, silently fake success (don't tip off bot)
    if (hp_website) {
      return c.json({ success: true, message: 'Contact form submitted successfully' }, 201);
    }

    // CAPTCHA verification
    const captchaResult = await verifyCaptchaToken(captchaToken, captchaInput, c.env.JWT_SECRET);
    if (!captchaResult.valid)
      return c.json({ success: false, error: captchaResult.message, invalidCaptcha: true }, 400);

    // Rate limit: 5 submissions per 15 min per IP
    const ip = getClientIP(c);
    const rl = await checkRateLimit(c.env.DB, `contact:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 });
    if (!rl.allowed) {
      c.header('Retry-After', String(rl.retryAfterSecs));
      return c.json({ success: false, error: 'Too many submissions. Please try again later.', retryAfter: rl.retryAfterSecs }, 429);
    }

    const id = newId();
    const ts = now();

    await c.env.DB.prepare(
      'INSERT INTO contacts (id, name, email, phone, subject, message, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, name, email, phone || '', subject || '', message, ts, ts).run();

    logger.info('Contact form submitted', { contactId: id });

    // Send email notifications in background (Gmail SMTP / Brevo)
    if (c.env.GMAIL_APP_PASSWORD || c.env.BREVO_API_KEY) {
      const contactData = { name, email, phone, subject, message };
      const emailPromises = [
        sendContactAdminNotification({
          env: c.env,
          contact: contactData,
        }),
        sendContactUserConfirmation({
          env: c.env,
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
