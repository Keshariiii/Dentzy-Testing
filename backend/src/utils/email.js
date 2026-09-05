import { connect } from 'cloudflare:sockets';
import logger from './logger.js';

/** Escape user input for safe HTML interpolation. */
export const escapeHtml = (s) => {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
};

/** Escape then convert newlines to <br> for multiline user content. */
export const escapeMultiline = (s) => s ? escapeHtml(s).replace(/\n/g, '<br>') : '';

/**
 * Convert HTML to clean plain text for multipart/alternative email delivery.
 * Ensures strict spam filter compliance (prevents MIME_HTML_ONLY penalty).
 */
export function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '  ')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s+\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sends an email directly via Google's official Gmail SMTP (Port 465 TLS).
 * Uses multipart/alternative (plain text + HTML) for maximum inbox deliverability.
 */
export async function sendGmailSMTP({ user, pass, to, subject, htmlContent, textContent, senderName = 'Dentzy Dental Solutions' }) {
  const cleanUser = (user || '').trim();
  const cleanPass = (pass || '').replace(/\s+/g, '');
  const toAddress = typeof to === 'string' ? to : (Array.isArray(to) ? (to[0]?.email || to[0]) : to.email);
  const toName = (typeof to === 'object' && to?.name) ? to.name : '';

  try {
    const socket = connect({ hostname: 'smtp.gmail.com', port: 465 }, { secureTransport: 'on' });
    const reader = socket.readable.getReader();
    const writer = socket.writable.getWriter();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    let buffer = '';

    const readLine = async () => {
      while (!buffer.includes('\n')) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
      }
      const idx = buffer.indexOf('\n');
      if (idx === -1) return '';
      const line = buffer.slice(0, idx + 1);
      buffer = buffer.slice(idx + 1);
      return line.trim();
    };

    const sendCommand = async (cmd) => {
      await writer.write(enc.encode(cmd + '\r\n'));
    };

    // 1. Initial Greeting
    const greeting = await readLine();
    if (!greeting.startsWith('220')) {
      throw new Error(`SMTP Greeting failed: ${greeting}`);
    }

    // 2. EHLO with valid host
    await sendCommand('EHLO smtp.gmail.com');
    while (true) {
      const line = await readLine();
      if (line.startsWith('250 ') || !line.startsWith('250-')) break;
    }

    // 3. AUTH LOGIN
    await sendCommand('AUTH LOGIN');
    await readLine(); // 334 Username:

    // 4. Send Base64 Username
    await sendCommand(btoa(cleanUser));
    await readLine(); // 334 Password:

    // 5. Send Base64 Password
    await sendCommand(btoa(cleanPass));
    const authRes = await readLine();
    if (!authRes.startsWith('235')) {
      throw new Error(`SMTP Auth failed: ${authRes}`);
    }

    // 6. MAIL FROM
    await sendCommand(`MAIL FROM:<${cleanUser}>`);
    const mailFromRes = await readLine();
    if (!mailFromRes.startsWith('250')) {
      throw new Error(`SMTP MAIL FROM failed: ${mailFromRes}`);
    }

    // 7. RCPT TO
    await sendCommand(`RCPT TO:<${toAddress}>`);
    const rcptRes = await readLine();
    if (!rcptRes.startsWith('250')) {
      throw new Error(`SMTP RCPT TO failed: ${rcptRes}`);
    }

    // 8. DATA
    await sendCommand('DATA');
    const dataRes = await readLine();
    if (!dataRes.startsWith('354')) {
      throw new Error(`SMTP DATA failed: ${dataRes}`);
    }

    // 9. Send Multipart/Alternative Message Content (RFC 2045 / RFC 5321)
    const boundary = `_NextPart_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const plain = textContent || htmlToPlainText(htmlContent);

    const rawPlainB64 = btoa(unescape(encodeURIComponent(plain)));
    const wrappedPlainB64 = rawPlainB64.match(/.{1,76}/g)?.join('\r\n') || rawPlainB64;

    const rawHtmlB64 = btoa(unescape(encodeURIComponent(htmlContent)));
    const wrappedHtmlB64 = rawHtmlB64.match(/.{1,76}/g)?.join('\r\n') || rawHtmlB64;

    const msg = [
      `From: "${senderName}" <${cleanUser}>`,
      `To: ${toName ? `"${toName}" ` : ''}<${toAddress}>`,
      `Reply-To: "${senderName}" <${cleanUser}>`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Auto-Submitted: auto-generated`,
      `X-Auto-Response-Suppress: All`,
      `X-Priority: 1 (Highest)`,
      `Importance: High`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      wrappedPlainB64,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      wrappedHtmlB64,
      ``,
      `--${boundary}--`,
      ``,
      `.`,
      ``
    ].join('\r\n');

    await writer.write(enc.encode(msg));
    const finalRes = await readLine();
    if (!finalRes.startsWith('250')) {
      throw new Error(`SMTP Message Send failed: ${finalRes}`);
    }

    // 10. QUIT
    await sendCommand('QUIT');
    try {
      writer.releaseLock();
      reader.releaseLock();
      await socket.close();
    } catch {}

    logger.info('Gmail SMTP email delivered successfully', { to: toAddress });
    return { success: true };
  } catch (err) {
    logger.error('Gmail SMTP error', { error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Brevo (Sendinblue) REST API fallback — used when Gmail SMTP fails.
 */
async function sendBrevoEmail({ apiKey, to, subject, htmlContent, textContent, senderName = 'Dentzy Dental Solutions', senderEmail = 'dentzyemail@gmail.com' }) {
  const toAddress = typeof to === 'string' ? to : (Array.isArray(to) ? (to[0]?.email || to[0]) : to.email);
  const toName = (typeof to === 'object' && to?.name) ? to.name : '';
  const plain = textContent || htmlToPlainText(htmlContent);

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toAddress, ...(toName ? { name: toName } : {}) }],
        replyTo: { name: senderName, email: senderEmail },
        subject,
        htmlContent,
        textContent: plain,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Brevo ${res.status}: ${errBody}`);
    }
    logger.info('Brevo email delivered successfully', { to: toAddress });
    return { success: true };
  } catch (err) {
    logger.error('Brevo email error', { error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Send an email via Gmail SMTP, falling back to Brevo REST API on failure.
 */
export async function sendEmail({ env, to, subject, htmlContent, textContent, senderName = 'Dentzy Dental Solutions' }) {
  // Try Gmail SMTP first
  if (env.GMAIL_APP_PASSWORD) {
    const result = await sendGmailSMTP({
      user: env.GMAIL_USER || 'dentzyemail@gmail.com',
      pass: env.GMAIL_APP_PASSWORD,
      to, subject, htmlContent, textContent, senderName,
    });
    if (result.success) return result;
    logger.warn('Gmail SMTP failed, trying Brevo fallback', { error: result.error });
  }
  // Brevo fallback
  if (env.BREVO_API_KEY) {
    return sendBrevoEmail({
      apiKey: env.BREVO_API_KEY,
      to, subject, htmlContent, textContent, senderName,
      senderEmail: env.BREVO_SENDER_EMAIL || env.GMAIL_USER || 'dentzyemail@gmail.com',
    });
  }
  return { success: false, error: 'No email provider configured' };
}

/**
 * Sends Registration Email Verification 6-Digit OTP.
 */
export async function sendRegistrationOtpEmail({ env, to, name = 'Dentist', otp }) {
  const subject = `Dentzy: ${otp} is your verification code`;
  const textContent = `DENTZY - Email Verification

Hello ${name},

Thank you for registering on the Dentzy Clinical Lab Portal. Please use the verification code below to confirm your email address:

Verification Code: ${otp}
(Valid for 5 minutes)

If you did not create an account on Dentzy, you can safely ignore this email.

Dentzy Dental Solutions Team
https://dentzy-testing.pages.dev`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e2824;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2ece6;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px 30px; background: linear-gradient(180deg, #f0f7f3 0%, #ffffff 100%);">
              <h2 style="margin: 0; color: #1e5038; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">DENTZY</h2>
              <p style="margin: 4px 0 0 0; color: #6b8a7a; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">by Namrata Dental Solutions</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 20px 35px 30px 35px;">
              <h3 style="margin: 0 0 12px 0; color: #1e2824; font-size: 18px; font-weight: 700;">Verify Your Email Address</h3>
              <p style="margin: 0 0 20px 0; color: #4a5d54; font-size: 14px; line-height: 1.6;">
                Hello <strong>${escapeHtml(name)}</strong>,<br>
                Thank you for registering on the Dentzy Clinical Lab Portal. Please use the verification code below to confirm your email address:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f0f7f3; border: 2px dashed #9bc4b0; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-family: monospace, Courier; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e5038;">
                  ${otp}
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #6b8a7a; font-weight: 600;">
                  ⏱ Valid for 5 minutes
                </div>
              </div>

              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you did not create an account on Dentzy, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 30px; background-color: #fafcfb; border-top: 1px solid #eef4f1; color: #94a3b8; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Dentzy Dental Solutions. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({
    env,
    to,
    subject,
    htmlContent,
    textContent,
  });
}

/**
 * Sends Password Reset 6-Digit OTP Email.
 */
export async function sendOtpEmail({ env, to, name = 'Dentist', otp }) {
  const subject = `Dentzy: ${otp} is your password reset code`;
  const textContent = `DENTZY - Password Reset

Hello ${name},

We received a request to reset the password for your Dentzy portal account. Use the verification code below to proceed:

Verification Code: ${otp}
(Valid for 5 minutes)

If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.

Dentzy Dental Solutions Team
https://dentzy-testing.pages.dev`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e2824;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f5; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #e2ece6;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px 30px; background: linear-gradient(180deg, #f0f7f3 0%, #ffffff 100%);">
              <h2 style="margin: 0; color: #1e5038; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">DENTZY</h2>
              <p style="margin: 4px 0 0 0; color: #6b8a7a; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">by Namrata Dental Solutions</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 20px 35px 30px 35px;">
              <h3 style="margin: 0 0 12px 0; color: #1e2824; font-size: 18px; font-weight: 700;">Password Reset Request</h3>
              <p style="margin: 0 0 20px 0; color: #4a5d54; font-size: 14px; line-height: 1.6;">
                Hello <strong>${escapeHtml(name)}</strong>,<br>
                We received a request to reset the password for your Dentzy portal account. Use the verification code below to proceed:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f0f7f3; border: 2px dashed #9bc4b0; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                <div style="font-family: monospace, Courier; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e5038;">
                  ${otp}
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #6b8a7a; font-weight: 600;">
                  ⏱ Valid for 5 minutes
                </div>
              </div>

              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 30px; background-color: #fafcfb; border-top: 1px solid #eef4f1; color: #94a3b8; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Dentzy Dental Solutions. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({
    env,
    to,
    subject,
    htmlContent,
    textContent,
  });
}

/**
 * Sends Admin Alert when someone submits Contact Us form.
 */
export async function sendContactAdminNotification({ env, contact }) {
  const targetEmail = env.ADMIN_NOTIFICATION_EMAIL || env.GMAIL_USER || 'dentzyemail@gmail.com';
  const subject = `New Contact Inquiry: ${escapeHtml(contact.name)} (${escapeHtml(contact.subject) || 'General'})`.replace(/[\r\n]/g, ' ');

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f7f5; padding: 20px; color: #1e2824;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 25px; border: 1px solid #e2ece6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <h2 style="color: #1e5038; margin-top: 0;">New Contact Form Submission</h2>
    <p style="color: #64748b; font-size: 14px;">A new inquiry was submitted on the Dentzy website:</p>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #4a5d54;">Name:</td>
        <td style="padding: 8px 0;">${escapeHtml(contact.name)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(contact.email)}" style="color: #1e5038;">${escapeHtml(contact.email)}</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Phone:</td>
        <td style="padding: 8px 0;">${escapeHtml(contact.phone) || 'Not provided'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Subject:</td>
        <td style="padding: 8px 0;">${escapeHtml(contact.subject) || 'General Inquiry'}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 4px 0; font-weight: bold; color: #4a5d54;" colspan="2">Message:</td>
      </tr>
      <tr>
        <td colspan="2" style="background: #f8faf9; border-radius: 8px; padding: 15px; border: 1px solid #e2ece6; line-height: 1.6;">
          ${contact.message ? escapeMultiline(contact.message) : '\u2014'}
        </td>
      </tr>
    </table>

    <div style="font-size: 12px; color: #94a3b8; margin-top: 20px; text-align: center;">
      Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    env,
    to: targetEmail,
    subject,
    htmlContent,
  });
}

/**
 * Sends User Acknowledgment Confirmation for Contact Us.
 */
export async function sendContactUserConfirmation({ env, contact }) {
  const subject = `Thank you for contacting Dentzy Dental Solutions`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f7f5; padding: 20px; color: #1e2824;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; border: 1px solid #e2ece6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <h2 style="color: #1e5038; margin-top: 0;">Thank You for Reaching Out</h2>
    <p style="color: #4a5d54; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(contact.name)}</strong>,<br><br>
      We have received your message regarding <strong>"${escapeHtml(contact.subject) || 'your inquiry'}"</strong>. Our team is reviewing your request and will get back to you shortly.
    </p>
    
    <div style="background: #f0f7f3; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #1e5038;">
      <strong>Need immediate lab assistance?</strong><br>
      Feel free to reach our team directly at +91 95036 68112 or visit our portal.
    </div>

    <p style="color: #64748b; font-size: 13px;">Best regards,<br><strong>Dentzy Dental Solutions Team</strong></p>
  </div>
</body>
</html>
`;

  return sendEmail({
    env,
    to: contact.email,
    subject,
    htmlContent,
  });
}

/**
 * Admin Alert — New User Registration.
 */
export async function sendNewUserAdminAlert({ env, user }) {
  const targetEmail = env.ADMIN_NOTIFICATION_EMAIL || env.GMAIL_USER || 'dentzyemail@gmail.com';
  const subject = `New Dentist Registration: ${user.name} (${user.email})`.replace(/[\r\n]/g, ' ');
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f7f5; padding: 20px; color: #1e2824;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 25px; border: 1px solid #e2ece6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <h2 style="color: #1e5038; margin-top: 0;">New Dentist Registration</h2>
    <p style="color: #64748b; font-size: 14px;">A new dentist has registered on the Dentzy portal and is awaiting your approval:</p>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; width: 100px; color: #4a5d54;">Name:</td>
        <td style="padding: 8px 0;">${escapeHtml(user.name)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(user.email)}" style="color: #1e5038;">${escapeHtml(user.email)}</a></td>
      </tr>
    </table>

    <div style="text-align: center; margin: 25px 0;">
      <a href="https://dentzy-testing.pages.dev/admin/dashboard" style="display: inline-block; background: #1e5038; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">Review in Admin Panel →</a>
    </div>

    <div style="font-size: 12px; color: #94a3b8; margin-top: 20px; text-align: center;">
      Registered at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ env, to: targetEmail, subject, htmlContent });
}

/**
 * User Confirmation — Registration Pending.
 */
export async function sendRegistrationPendingEmail({ env, user }) {
  const subject = `Welcome to Dentzy — Registration Received`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f7f5; padding: 20px; color: #1e2824;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; border: 1px solid #e2ece6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <h2 style="color: #1e5038; margin-top: 0;">Welcome to Dentzy!</h2>
    <p style="color: #4a5d54; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(user.name)}</strong>,<br><br>
      Thank you for registering on the Dentzy Clinical Lab Portal. Your account is currently <strong>under review</strong> by our admin team.
    </p>

    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #92400e;">
      <strong>⏳ What happens next?</strong><br>
      Our team will review your registration and approve your account. You will receive an email notification once your account is activated.
    </div>

    <p style="color: #64748b; font-size: 13px;">
      If you have any questions, feel free to reach us at +91 95036 68112.<br><br>
      Best regards,<br><strong>Dentzy Dental Solutions Team</strong>
    </p>
  </div>
</body>
</html>
`;

  return sendEmail({ env, to: user.email, subject, htmlContent });
}

/**
 * User Notification — Account Approved.
 */
export async function sendUserApprovedEmail({ env, user }) {
  const subject = `Your Dentzy Account Has Been Approved!`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f7f5; padding: 20px; color: #1e2824;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; border: 1px solid #e2ece6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background: #dcfce7; border-radius: 50%; width: 60px; height: 60px; line-height: 60px;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="20 6 9 17 4 12"/></svg></div>
    </div>
    <h2 style="color: #1e5038; margin-top: 0; text-align: center;">Account Approved!</h2>
    <p style="color: #4a5d54; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(user.name)}</strong>,<br><br>
      Great news! Your Dentzy account has been approved. You can now log in to the portal and start managing your dental lab orders.
    </p>

    <div style="text-align: center; margin: 25px 0;">
      <a href="https://dentzy-testing.pages.dev/login" style="display: inline-block; background: #1e5038; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Log In to Portal →</a>
    </div>

    <div style="background: #f0f7f3; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #1e5038;">
      <strong>What you can do now:</strong><br>
      • View and track your lab orders<br>
      • Monitor order progress in real time<br>
      • Manage your profile and clinic details
    </div>

    <p style="color: #64748b; font-size: 13px;">Best regards,<br><strong>Dentzy Dental Solutions Team</strong></p>
  </div>
</body>
</html>
`;

  return sendEmail({ env, to: user.email, subject, htmlContent });
}

/**
 * User Notification — Account Rejected.
 */
export async function sendUserRejectedEmail({ env, user, note }) {
  const reasonBlock = note
    ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #991b1b;">
        <strong>Reason provided:</strong><br>${escapeMultiline(note)}
      </div>`
    : '';

  const subject = `Dentzy — Account Registration Update`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f7f5; padding: 20px; color: #1e2824;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; border: 1px solid #e2ece6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <h2 style="color: #1e2824; margin-top: 0;">Account Registration Update</h2>
    <p style="color: #4a5d54; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(user.name)}</strong>,<br><br>
      We appreciate your interest in Dentzy. After reviewing your registration, we are unable to approve your account at this time.
    </p>

    ${reasonBlock}

    <p style="color: #4a5d54; font-size: 14px; line-height: 1.6;">
      If you believe this was a mistake or would like more information, please don't hesitate to contact our team.
    </p>

    <div style="background: #f0f7f3; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #1e5038;">
      <strong>Need help?</strong><br>
      Reach us at +91 95036 68112 or reply to this email.
    </div>

    <p style="color: #64748b; font-size: 13px;">Best regards,<br><strong>Dentzy Dental Solutions Team</strong></p>
  </div>
</body>
</html>
`;

  return sendEmail({ env, to: user.email, subject, htmlContent });
}

/**
 * Admin-triggered Payment Reminder Email to Dentist.
 */
export async function sendPaymentReminderEmail({ env, dentist, order, payment }) {
  const amount = payment?.amount || 0;
  const amountStr = amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Amount to be confirmed';
  const subject = `Dentzy: Payment Reminder for Case ${escapeHtml(order.caseId)}`.replace(/[\r\n]/g, ' ');

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f7f5; padding: 20px; color: #1e2824;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; border: 1px solid #e2ece6; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <h2 style="color: #1e5038; margin-top: 0;">Payment Reminder</h2>
    <p style="color: #4a5d54; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(dentist.name)}</strong>,<br><br>
      This is a friendly reminder regarding an outstanding payment on the Dentzy portal.
    </p>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 20px 0;">
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #4a5d54;">Case ID:</td>
        <td style="padding: 8px 0;"><code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${escapeHtml(order.caseId)}</code></td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Patient:</td>
        <td style="padding: 8px 0;">${escapeHtml(order.patientName)}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Service:</td>
        <td style="padding: 8px 0;">${escapeHtml(order.serviceType || 'Other')}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Amount Due:</td>
        <td style="padding: 8px 0; font-weight: 700; color: #dc2626;">${amountStr}</td>
      </tr>
    </table>

    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #92400e;">
      <strong>Payment Method: Cheque</strong><br>
      Please submit a cheque in favour of <strong>Dentzy Dental Solutions</strong> at our lab or contact us for pickup arrangements.
    </div>

    <p style="color: #64748b; font-size: 13px;">
      If you have already submitted payment, please disregard this reminder.<br><br>
      Best regards,<br><strong>Dentzy Dental Solutions Team</strong>
    </p>
  </div>
</body>
</html>
`;

  return sendEmail({ env, to: dentist.email, subject, htmlContent });
}

