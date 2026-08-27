import { connect } from 'cloudflare:sockets';
import logger from './logger.js';

/**
 * Sends an email directly via Google's official Gmail SMTP (Port 465 TLS).
 * Zero third-party branding — 100% signed by gmail.com.
 * Compatible with Cloudflare Workers via cloudflare:sockets.
 */
export async function sendGmailSMTP({ user, pass, to, subject, htmlContent, senderName = 'Dentzy Dental Solutions' }) {
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

    // 2. EHLO
    await sendCommand('EHLO localhost');
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

    // 9. Send Email Message Content
    const msg = [
      `From: "${senderName}" <${cleanUser}>`,
      `To: ${toName ? `"${toName}" ` : ''}<${toAddress}>`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(htmlContent))),
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
 * Send an email via Gmail SMTP.
 */
export async function sendEmail({ env, to, subject, htmlContent, senderName = 'Dentzy Dental Solutions' }) {
  return sendGmailSMTP({
    user: env.GMAIL_USER || 'dentzyemail@gmail.com',
    pass: env.GMAIL_APP_PASSWORD,
    to,
    subject,
    htmlContent,
    senderName,
  });
}

/**
 * Sends Password Reset 6-Digit OTP Email.
 */
export async function sendOtpEmail({ env, to, name = 'Dentist', otp }) {
  const subject = `Dentzy — ${otp} is your verification code`;
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
                Hello <strong>${name}</strong>,<br>
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
  });
}

/**
 * Sends Admin Alert when someone submits Contact Us form.
 */
export async function sendContactAdminNotification({ env, contact }) {
  const targetEmail = env.ADMIN_NOTIFICATION_EMAIL || env.GMAIL_USER || 'dentzyemail@gmail.com';
  const subject = `🔔 New Contact Inquiry: ${contact.name} (${contact.subject || 'General'})`;

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
        <td style="padding: 8px 0;">${contact.name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${contact.email}" style="color: #1e5038;">${contact.email}</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Phone:</td>
        <td style="padding: 8px 0;">${contact.phone || 'Not provided'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef4f1;">
        <td style="padding: 8px 0; font-weight: bold; color: #4a5d54;">Subject:</td>
        <td style="padding: 8px 0;">${contact.subject || 'General Inquiry'}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 4px 0; font-weight: bold; color: #4a5d54;" colspan="2">Message:</td>
      </tr>
      <tr>
        <td colspan="2" style="background: #f8faf9; border-radius: 8px; padding: 15px; border: 1px solid #e2ece6; line-height: 1.6;">
          ${contact.message ? String(contact.message).replace(/\n/g, '<br>') : '—'}
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
      Hello <strong>${contact.name}</strong>,<br><br>
      We have received your message regarding <strong>"${contact.subject || 'your inquiry'}"</strong>. Our team is reviewing your request and will get back to you shortly.
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
