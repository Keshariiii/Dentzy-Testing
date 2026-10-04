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
export async function sendGmailSMTP({ user, pass, to, subject, htmlContent, textContent, senderName = 'Dentzy Dental Solutions', fromEmail, replyTo }) {
  const cleanUser = (user || '').trim();
  const cleanPass = (pass || '').replace(/\s+/g, '');
  const cleanFromEmail = (fromEmail || user || '').trim();
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
    await sendCommand('EHLO dentzy-testing.pages.dev');
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
    await sendCommand(`MAIL FROM:<${cleanFromEmail}>`);
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

    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@gmail.com>`;

    const msg = [
      `From: "${senderName}" <${cleanFromEmail}>`,
      `To: ${toName ? `"${toName}" ` : ''}<${toAddress}>`,
      `Reply-To: ${replyTo ? (replyTo.includes('<') ? replyTo : `<${replyTo}>`) : `"${senderName}" <${cleanFromEmail}>`}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `List-Unsubscribe: <mailto:${cleanFromEmail}?subject=unsubscribe>`,
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
 * Send an email via Gmail SMTP (App Password authentication).
 */
export async function sendEmail({ env, to, subject, htmlContent, textContent, senderName = 'Dentzy Dental Solutions', fromEmail, replyTo }) {
  if (!env.GMAIL_APP_PASSWORD) {
    return { success: false, error: 'No email provider configured (GMAIL_APP_PASSWORD missing)' };
  }
  const formattedSubject = subject.startsWith('[Testing Website]')
    ? subject
    : (subject.startsWith('[Testing Version]')
        ? subject.replace('[Testing Version]', '[Testing Website]')
        : `[Testing Website] ${subject}`);

  const formattedText = textContent
    ? (textContent.includes('testing website') || textContent.includes('testing version')
        ? textContent
        : `[Notice: Sent from testing website (dentzy-testing.pages.dev)]\n\n${textContent}`)
    : (htmlContent ? htmlToPlainText(htmlContent) : '');

  return sendGmailSMTP({
    user: env.GMAIL_USER || 'support@dentzy.in',
    pass: env.GMAIL_APP_PASSWORD,
    to,
    subject: formattedSubject,
    htmlContent,
    textContent: formattedText,
    senderName,
    fromEmail: fromEmail || 'support@dentzy.in',
    replyTo,
  });
}

/**
 * Unified 21st.dev Email Layout Generator for Dentzy.
 * Impeccable typography, mobile-responsive, anti-spam optimized, cross-client compatible.
 */
export function renderDentzyEmailLayout({
  preheader = '',
  badge = '',
  badgeColor = '#1e5038',
  badgeBg = '#eef6f2',
  heading = '',
  subheading = '',
  bodyHtml = '',
  ctaText = '',
  ctaUrl = '',
  noteHtml = '',
  showTestingNotice = true,
}) {
  const formattedPreheader = preheader
    ? (preheader.includes('testing website') || preheader.includes('testing version')
        ? preheader
        : `[Sent from testing website] ${preheader}`)
    : '[Sent from testing website]';

  const preheaderHtml = formattedPreheader
    ? `<div style="display:none;font-size:1px;color:#f0f5f2;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(formattedPreheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';

  const testingNoticeHtml = showTestingNotice
    ? `<tr>
        <td style="padding-bottom: 16px;">
          <div style="background-color: #fffbeb; border-radius: 10px; padding: 12px 16px; margin: 0;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="font-size: 12px; font-weight: 700; color: #92400e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <span style="display: inline-block; background-color: #f59e0b; color: #ffffff; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-right: 6px;">Notice</span>
                  Sent from testing website
                </td>
                <td align="right" style="font-size: 11px; color: #b45309; font-weight: 500;">
                  dentzy-testing.pages.dev
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>`
    : '';

  const badgeHtml = badge
    ? `<tr>
        <td align="left" style="padding-bottom: 12px;">
          <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 4px 12px; border-radius: 99px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${escapeHtml(badge)}
          </span>
        </td>
      </tr>`
    : '';

  const subheadingHtml = subheading
    ? `<p class="dz-subheading" style="margin: 4px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${escapeHtml(subheading)}</p>`
    : '';

  const ctaHtml = (ctaText && ctaUrl)
    ? `<tr>
        <td align="center" style="padding: 24px 0 16px 0;">
          <table border="0" cellspacing="0" cellpadding="0" class="dz-cta-table">
            <tr>
              <td align="center" style="border-radius: 50px; background-color: #1e5038; box-shadow: 0 4px 14px rgba(30, 80, 56, 0.25);">
                <a href="${escapeHtml(ctaUrl)}" target="_blank" class="dz-cta-btn" style="display: inline-block; padding: 13px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 50px; letter-spacing: 0.3px;">
                  ${escapeHtml(ctaText)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const noteBlock = noteHtml
    ? `<tr>
        <td style="padding-top: 16px;">
          ${noteHtml}
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(heading || 'Dentzy Notification')}</title>
  <style>
    /* Reset & Client Normalization */
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    
    /* Screen Size Responsive Optimizations (Mobile Devices <= 600px) */
    @media only screen and (max-width: 600px) {
      .dz-outer-wrapper {
        padding: 12px 6px 20px 6px !important;
      }
      .dz-main-card {
        width: 100% !important;
        max-width: 100% !important;
      }
      .dz-header-cell {
        padding: 16px 0 12px 0 !important;
      }
      .dz-brand-title {
        font-size: 18px !important;
      }
      .dz-brand-sub {
        font-size: 9px !important;
      }
      .dz-portal-badge {
        font-size: 10px !important;
      }
      .dz-content-cell {
        padding: 16px 0 18px 0 !important;
      }
      .dz-heading {
        font-size: 18px !important;
        line-height: 1.3 !important;
      }
      .dz-subheading {
        font-size: 12px !important;
      }
      .dz-footer-cell {
        padding: 18px 0 !important;
        font-size: 11px !important;
      }
      .dz-otp-code {
        font-size: 26px !important;
        letter-spacing: 5px !important;
        padding-left: 5px !important;
      }
      .dz-otp-box {
        padding: 16px 10px !important;
        margin: 18px 0 16px 0 !important;
      }
      .dz-cta-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
        padding: 14px 16px !important;
        font-size: 14px !important;
      }
      .dz-cta-table {
        width: 100% !important;
      }
      .dz-data-table td {
        padding: 8px 10px !important;
        font-size: 13px !important;
      }
      .dz-data-label {
        width: 80px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e2824; line-height: 1.6;">
  ${preheaderHtml}
  <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-outer-wrapper" style="background-color: #ffffff; padding: 24px 16px 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Content Area (Clean & Borderless) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-main-card" style="max-width: 580px; background-color: #ffffff; border: none;">
          
          <!-- Brand Header -->
          <tr>
            <td class="dz-header-cell" style="padding: 20px 0 16px 0; border: none; background-color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <div class="dz-brand-title" style="font-size: 20px; font-weight: 800; letter-spacing: 0.8px; color: #1e5038; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      DENTZY
                    </div>
                    <div class="dz-brand-sub" style="font-size: 10px; font-weight: 600; letter-spacing: 1.2px; color: #708c80; text-transform: uppercase; margin-top: 2px;">
                      Namrata Dental Solutions
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span class="dz-portal-badge" style="font-size: 11px; color: #8fa398; font-weight: 500;">Clinical Lab Portal</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="dz-content-cell" style="padding: 20px 0 24px 0; border: none;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${testingNoticeHtml}
                ${badgeHtml}
                <tr>
                  <td align="left" style="padding-bottom: 18px;">
                    <h1 class="dz-heading" style="margin: 0; color: #143525; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      ${escapeHtml(heading)}
                    </h1>
                    ${subheadingHtml}
                  </td>
                </tr>
                <tr>
                  <td style="color: #2d3b34; font-size: 14px; line-height: 1.65;">
                    ${bodyHtml}
                  </td>
                </tr>
                ${ctaHtml}
                ${noteBlock}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="dz-footer-cell" style="padding: 24px 0 16px 0; background-color: #ffffff; border: none; color: #788c82; font-size: 12px; line-height: 1.6; text-align: center;">
              <div style="margin-bottom: 8px; font-weight: 500; color: #4a5d54;">
                Dentzy by Namrata Dental Solutions &bull; Vasai-Virar, Maharashtra
              </div>
              <div style="margin-bottom: 12px; color: #8fa398;">
                Support: <a href="mailto:support@dentzy.in" style="color: #1e5038; text-decoration: none; font-weight: 600;">support@dentzy.in</a> &bull; Phone: <a href="tel:+919503668112" style="color: #1e5038; text-decoration: none;">+91 95036 68112</a>
              </div>
              <div style="font-size: 11px; color: #a4b5ad;">
                Sent from testing website &bull; &copy; ${new Date().getFullYear()} Dentzy Dental Solutions. All rights reserved. &bull; <a href="https://dentzy-testing.pages.dev" style="color: #708c80; text-decoration: underline;">dentzy-testing.pages.dev</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends Registration Email Verification 6-Digit OTP.
 */
export async function sendRegistrationOtpEmail({ env, to, name = 'Dentist', otp }) {
  const subject = `[Testing Website] Dentzy — Verify your email address`;
  const textContent = `[Notice: Sent from testing website (dentzy-testing.pages.dev)]\n\nDENTZY - Email Verification\n\nHello ${name},\n\nThank you for registering on the Dentzy Clinical Lab Portal. Please use the verification code below to confirm your email address:\n\nVerification Code: ${otp}\n(Valid for 5 minutes)\n\nEnvironment: Sent from testing website (https://dentzy-testing.pages.dev)\n\nIf you did not create an account on Dentzy, you can safely ignore this email.\n\nDentzy Dental Solutions Team\nhttps://dentzy-testing.pages.dev`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(name)}</strong>,<br><br>
      Thank you for registering on the <strong>Dentzy Clinical Lab Portal</strong>. Please use the verification code below to verify your email address:
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Recipient:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(to)}" style="color: #1e5038; font-weight: 500; text-decoration: underline;">${escapeHtml(to)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Purpose:</td>
        <td style="padding: 10px 14px; color: #1e2824;">Clinical Lab Portal Registration Verification</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>

    <div class="dz-otp-box" style="background-color: #f0f7f3; border-radius: 12px; padding: 22px; text-align: center; margin: 20px 0 18px 0;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4a5d54; font-weight: 600; margin-bottom: 8px;">Verification Code</div>
      <div class="dz-otp-code" style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1e5038; padding-left: 10px;">
        ${otp}
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #708c80; font-weight: 500;">
        Expires in 5 minutes &bull; Do not share this code
      </div>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
      If you did not request this verification, you can safely ignore this email.
    </p>

    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Your Dentzy verification code is ${otp} (valid for 5 minutes)`,
    badge: 'Email Verification',
    badgeColor: '#1e5038',
    badgeBg: '#eef6f2',
    heading: 'Verify Your Email Address',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Open Registration Portal →',
    ctaUrl: 'https://dentzy-testing.pages.dev/register',
  });

  return sendEmail({ env, to, subject, htmlContent, textContent, fromEmail: 'noreply@dentzy.in' });
}

/**
 * Sends Password Reset 6-Digit OTP Email.
 */
export async function sendOtpEmail({ env, to, name = 'Dentist', otp }) {
  const subject = `[Testing Website] Dentzy — Reset your password`;
  const textContent = `[Notice: Sent from testing website (dentzy-testing.pages.dev)]\n\nDENTZY - Password Reset\n\nHello ${name},\n\nWe received a request to reset the password for your Dentzy portal account. Use the verification code below to proceed:\n\nVerification Code: ${otp}\n(Valid for 5 minutes)\n\nEnvironment: Sent from testing website (https://dentzy-testing.pages.dev)\n\nIf you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.\n\nDentzy Dental Solutions Team\nhttps://dentzy-testing.pages.dev`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(name)}</strong>,<br><br>
      We received a request to reset the password for your Dentzy portal account. Enter the verification code below to set a new password:
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Account:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(to)}" style="color: #1e5038; font-weight: 500; text-decoration: underline;">${escapeHtml(to)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Request:</td>
        <td style="padding: 10px 14px; color: #1e2824;">Password Reset Request</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>

    <div class="dz-otp-box" style="background-color: #fef7ed; border-radius: 12px; padding: 22px; text-align: center; margin: 20px 0 18px 0;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #b45309; font-weight: 600; margin-bottom: 8px;">Password Reset Code</div>
      <div class="dz-otp-code" style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #b45309; padding-left: 10px;">
        ${otp}
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #92400e; font-weight: 500;">
        Expires in 5 minutes &bull; Keep this code secure
      </div>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
      If you did not request a password reset, you can safely ignore this email. Your account remains secure.
    </p>

    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Your Dentzy password reset code is ${otp} (valid for 5 minutes)`,
    badge: 'Security Alert',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    heading: 'Reset Your Password',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Reset Password →',
    ctaUrl: 'https://dentzy-testing.pages.dev/forgot-password',
  });

  return sendEmail({ env, to, subject, htmlContent, textContent, fromEmail: 'noreply@dentzy.in' });
}

/**
 * Sends Admin Alert when someone submits Contact Us form.
 */
export async function sendContactAdminNotification({ env, contact }) {
  const targetEmail = env.ADMIN_NOTIFICATION_EMAIL || 'dentzycore@gmail.com';
  const subject = `[Testing Website] New Contact Inquiry: ${escapeHtml(contact.name)} (${escapeHtml(contact.subject) || 'General'})`.replace(/[\r\n]/g, ' ');

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px;">
      A new customer inquiry was submitted on the Dentzy testing portal:
    </p>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Sender:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(contact.name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(contact.email)}" style="color: #1e5038; font-weight: 500; text-decoration: underline;">${escapeHtml(contact.email)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Phone:</td>
        <td style="padding: 10px 14px; color: #1e2824;">${contact.phone ? `<a href="tel:${escapeHtml(contact.phone)}" style="color: #1e5038; text-decoration: none;">${escapeHtml(contact.phone)}</a>` : '<span style="color: #94a3b8;">Not provided</span>'}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Subject:</td>
        <td style="padding: 10px 14px; font-weight: 500; color: #1e2824;">${escapeHtml(contact.subject) || 'General Inquiry'}</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>
    <div style="font-size: 13px; font-weight: 600; color: #4a5d54; margin: 18px 0 6px 0;">Message:</div>
    <div style="background-color: #f8faf9; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e2824;">
      ${contact.message ? escapeMultiline(contact.message) : '&mdash;'}
    </div>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Inquiry from ${escapeHtml(contact.name)}: ${escapeHtml(contact.subject || 'General Inquiry')}`,
    badge: 'Customer Inquiry',
    badgeColor: '#1e5038',
    badgeBg: '#eef6f2',
    heading: 'New Contact Form Submission',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: `Reply to ${escapeHtml(contact.name)}`,
    ctaUrl: `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent('Re: ' + (contact.subject || 'Dentzy Dental Solutions inquiry'))}`,
  });

  return sendEmail({
    env,
    to: targetEmail,
    subject,
    htmlContent,
    replyTo: contact.email,
  });
}

/**
 * Sends User Acknowledgment Confirmation for Contact Us.
 */
export async function sendContactUserConfirmation({ env, contact }) {
  const subject = `[Testing Website] Thank you for contacting Dentzy Dental Solutions`;
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(contact.name)}</strong>,<br><br>
      Thank you for reaching out to <strong>Dentzy Dental Solutions</strong>. We have successfully received your inquiry:
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Sender:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(contact.name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(contact.email)}" style="color: #1e5038; font-weight: 500; text-decoration: underline;">${escapeHtml(contact.email)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Subject:</td>
        <td style="padding: 10px 14px; font-weight: 500; color: #1e2824;">${escapeHtml(contact.subject) || 'General Inquiry'}</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>

    <div style="font-size: 13px; font-weight: 600; color: #4a5d54; margin: 18px 0 6px 0;">Your Inquiry:</div>
    <div style="background-color: #f8faf9; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e2824; margin-bottom: 20px;">
      ${contact.message ? escapeMultiline(contact.message) : '&mdash;'}
    </div>

    <div style="background-color: #f0f7f3; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #1e5038; margin-bottom: 4px;">Need urgent lab support?</div>
      <div style="font-size: 13px; color: #4a5d54; line-height: 1.5;">
        You can reach our lab desk directly at <a href="tel:+919503668112" style="color: #1e5038; font-weight: 600; text-decoration: none;">+91 95036 68112</a> (Mon&ndash;Sat, 9 AM &ndash; 6 PM).
      </div>
    </div>

    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] We have received your inquiry regarding "${escapeHtml(contact.subject || 'your message')}"`,
    badge: 'Inquiry Received',
    badgeColor: '#1e5038',
    badgeBg: '#eef6f2',
    heading: 'Thank You for Reaching Out',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Visit Dentzy Portal',
    ctaUrl: 'https://dentzy-testing.pages.dev',
  });

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
  const targetEmail = env.ADMIN_NOTIFICATION_EMAIL || env.GMAIL_USER || 'support@dentzy.in';
  const subject = `[Testing Website] New Dentist Registration: ${user.name} (${user.email})`.replace(/[\r\n]/g, ' ');

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px;">
      A new dentist has registered on the Dentzy Portal and is awaiting your approval:
    </p>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Name:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(user.name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(user.email)}" style="color: #1e5038; font-weight: 500;">${escapeHtml(user.email)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Registered:</td>
        <td style="padding: 10px 14px; color: #64748b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] New dentist registration: Dr. ${user.name} (${user.email}) is awaiting approval`,
    badge: 'Account Approval Required',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    heading: 'New Dentist Registration',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Review in Admin Panel →',
    ctaUrl: 'https://dentzy-testing.pages.dev/admin/dashboard',
  });

  return sendEmail({ env, to: targetEmail, subject, htmlContent });
}

/**
 * User Confirmation — Registration Pending.
 */
export async function sendRegistrationPendingEmail({ env, user }) {
  const subject = `[Testing Website] Welcome to Dentzy — Registration Received`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(user.name)}</strong>,<br><br>
      Thank you for registering on the <strong>Dentzy Clinical Lab Portal</strong>. Your account has been received and is currently under review by our administration team:
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Dentist:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(user.name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(user.email)}" style="color: #1e5038; font-weight: 500;">${escapeHtml(user.email)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Status:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #b45309;">Pending Administration Approval</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>

    <div style="background-color: #fffbeb; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 6px;">What happens next?</div>
      <div style="font-size: 13px; color: #78350f; line-height: 1.5;">
        Our team verifies each clinic account to maintain high laboratory standards. You will receive an email as soon as your account is approved and ready for case submissions.
      </div>
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
      If you have questions in the meantime, contact us at <a href="mailto:support@dentzy.in" style="color: #1e5038; font-weight: 500;">support@dentzy.in</a>.
    </p>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Welcome Dr. ${user.name} — Registration received and under review`,
    badge: 'Registration Received',
    heading: 'Welcome to Dentzy!',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Visit Dentzy Portal',
    ctaUrl: 'https://dentzy-testing.pages.dev',
  });

  return sendEmail({ env, to: user.email, subject, htmlContent, fromEmail: 'noreply@dentzy.in' });
}

/**
 * User Notification — Account Approved.
 */
export async function sendUserApprovedEmail({ env, user }) {
  const subject = `[Testing Website] Your Dentzy Account Has Been Approved`;

  const bodyHtml = `
    <p style="margin: 0 0 18px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(user.name)}</strong>,<br><br>
      Great news! Your Dentzy clinical portal account has been approved and activated. You can now log in and access full laboratory workflow features:
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Dentist:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(user.name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(user.email)}" style="color: #1e5038; font-weight: 500;">${escapeHtml(user.email)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Status:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #15803d;">Active &amp; Verified</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>

    <div style="background-color: #f0f7f3; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #1e5038; margin-bottom: 10px;">Available on your portal:</div>
      <table border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #2d3b34; line-height: 1.6;">
        <tr><td style="padding: 3px 8px 3px 0; color: #16a34a; font-weight: bold;">&bull;</td><td>Submit new digital cases and prescription specifications</td></tr>
        <tr><td style="padding: 3px 8px 3px 0; color: #16a34a; font-weight: bold;">&bull;</td><td>Track real-time fabrication stages in the production pipeline</td></tr>
        <tr><td style="padding: 3px 8px 3px 0; color: #16a34a; font-weight: bold;">&bull;</td><td>Manage clinic invoices, case histories, and receipts</td></tr>
      </table>
    </div>

    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Congratulations Dr. ${user.name}! Your Dentzy account is active`,
    badge: 'Account Approved',
    badgeColor: '#15803d',
    badgeBg: '#dcfce7',
    heading: 'Your Account is Active!',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Log In to Portal →',
    ctaUrl: 'https://dentzy-testing.pages.dev/login',
  });

  return sendEmail({ env, to: user.email, subject, htmlContent, fromEmail: 'noreply@dentzy.in' });
}

/**
 * User Notification — Account Rejected.
 */
export async function sendUserRejectedEmail({ env, user, note }) {
  const reasonBlock = note
    ? `<div style="background-color: #fef2f2; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #991b1b; margin-bottom: 4px;">Reason Provided:</div>
        <div style="font-size: 13px; color: #7f1d1d; line-height: 1.5;">${escapeMultiline(note)}</div>
      </div>`
    : '';

  const subject = `[Testing Website] Dentzy — Account Registration Update`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(user.name)}</strong>,<br><br>
      Thank you for your interest in the Dentzy Clinical Lab Portal. After reviewing your registration, our administration is unable to approve your application at this time:
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 110px; color: #4a5d54;">Dentist:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(user.name)}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Email:</td>
        <td style="padding: 10px 14px;"><a href="mailto:${escapeHtml(user.email)}" style="color: #1e5038; font-weight: 500;">${escapeHtml(user.email)}</a></td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Review Status:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #991b1b;">Not Approved</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>

    ${reasonBlock}
    <p style="margin: 0 0 16px 0; color: #4a5d54; font-size: 13px; line-height: 1.6;">
      If you believe this was an error or would like to provide additional documentation, please contact our support team directly.
    </p>
    <div style="background-color: #f0f7f3; border-radius: 10px; padding: 14px 18px; font-size: 13px; color: #1e5038;">
      Reach us at <a href="mailto:support@dentzy.in" style="color: #1e5038; font-weight: 600;">support@dentzy.in</a> or call <a href="tel:+919503668112" style="color: #1e5038; font-weight: 600; text-decoration: none;">+91 95036 68112</a>.
    </div>

    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Dentzy — Update regarding your account registration`,
    badge: 'Application Update',
    badgeColor: '#991b1b',
    badgeBg: '#fef2f2',
    heading: 'Account Registration Update',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Contact Support',
    ctaUrl: 'mailto:support@dentzy.in',
  });

  return sendEmail({ env, to: user.email, subject, htmlContent, fromEmail: 'noreply@dentzy.in' });
}

/**
 * Admin-triggered Payment Reminder Email to Dentist.
 */
export async function sendPaymentReminderEmail({ env, dentist, order, payment }) {
  const amount = payment?.amount || 0;
  const amountStr = amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Amount to be confirmed';
  const subject = `[Testing Website] Dentzy: Payment Reminder for Case ${escapeHtml(order.caseId)}`.replace(/[\r\n]/g, ' ');

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(dentist.name)}</strong>,<br><br>
      This is a friendly reminder regarding an outstanding balance for your dental laboratory case on the Dentzy portal:
    </p>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 120px; color: #4a5d54;">Case ID:</td>
        <td style="padding: 10px 14px;"><code style="background-color: #f0f7f3; color: #1e5038; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-family: monospace;">${escapeHtml(order.caseId)}</code></td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Patient:</td>
        <td style="padding: 10px 14px; font-weight: 500; color: #1e2824;">${escapeHtml(order.patientName)}</td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Service:</td>
        <td style="padding: 10px 14px; color: #1e2824;">${escapeHtml(order.serviceType || 'Other')}</td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 12px 14px; font-weight: 700; color: #4a5d54;">Amount Due:</td>
        <td style="padding: 12px 14px; font-weight: 800; font-size: 16px; color: #dc2626;">${amountStr}</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>
    <div style="background-color: #f8faf9; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="font-weight: 700; color: #1e5038; font-size: 13px; margin-bottom: 8px;">Accepted Payment Methods:</div>
      <table border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #4a5d54; line-height: 1.6;">
        <tr><td style="padding: 2px 8px 2px 0; color: #1e5038; font-weight: bold;">&bull;</td><td><strong>Direct UPI:</strong> Transfer to lab bank account via UPI ID. Contact lab desk for QR details.</td></tr>
        <tr><td style="padding: 2px 8px 2px 0; color: #1e5038; font-weight: bold;">&bull;</td><td><strong>Cash / Cheque:</strong> Cash at lab or cheque in favour of <em>Dentzy Dental Solutions</em>.</td></tr>
      </table>
    </div>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Payment Reminder for Case ${order.caseId} — Amount Due: ${amountStr}`,
    badge: 'Payment Reminder',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    heading: 'Outstanding Invoice Reminder',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'View Case in Portal →',
    ctaUrl: 'https://dentzy-testing.pages.dev/dashboard/pipeline',
  });

  return sendEmail({ env, to: dentist.email, subject, htmlContent });
}

/**
 * Staff Welcome — Registration Confirmation Email.
 */
export async function sendStaffWelcomeEmail({ env, staffMember }) {
  const subject = `[Testing Website] Welcome to Dentzy Staff Portal — You have been registered`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #2d3b34; font-size: 14px; line-height: 1.6;">
      Hello <strong>${escapeHtml(staffMember.displayName)}</strong>,<br><br>
      You have been registered as a staff team member on the <strong>Dentzy Clinical Lab Portal</strong>. Here are your credentials:
    </p>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" class="dz-data-table" style="margin: 16px 0; border-radius: 10px; overflow: hidden; font-size: 14px;">
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; width: 120px; color: #4a5d54;">Employee ID:</td>
        <td style="padding: 10px 14px;"><code style="background-color: #f0f7f3; color: #1e5038; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-family: monospace;">${escapeHtml(staffMember.employeeId)}</code></td>
      </tr>
      <tr>
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Designation:</td>
        <td style="padding: 10px 14px; font-weight: 600; color: #1e2824;">${escapeHtml(staffMember.designation)}</td>
      </tr>
      <tr style="background-color: #fbfdfc;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #4a5d54;">Username:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #1e5038;">${escapeHtml(staffMember.username)}</td>
      </tr>
      <tr style="background-color: #fefce8;">
        <td class="dz-data-label" style="padding: 10px 14px; font-weight: 600; color: #854d0e;">Environment:</td>
        <td style="padding: 10px 14px; font-weight: 700; color: #92400e; font-size: 13px;">Sent from testing website (dentzy-testing.pages.dev)</td>
      </tr>
    </table>
    <div style="background-color: #f0f7f3; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #1e5038; line-height: 1.5;">
      <strong>Getting Started:</strong><br>
      Log in to the Staff Portal using your username above and the temporary password provided by your lab administrator.
    </div>
    <div style="font-size: 12px; color: #94a3b8; margin-top: 16px; text-align: right;">
      Sent from testing website &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
    </div>
  `;

  const htmlContent = renderDentzyEmailLayout({
    preheader: `[Sent from testing website] Welcome to Dentzy Staff Team — Employee ID: ${staffMember.employeeId}`,
    badge: 'Staff Onboarding',
    heading: 'Welcome to the Team!',
    subheading: 'Sent from testing website (dentzy-testing.pages.dev)',
    bodyHtml,
    ctaText: 'Log In to Staff Portal →',
    ctaUrl: 'https://dentzy-testing.pages.dev/login',
  });

  return sendEmail({ env, to: staffMember.email, subject, htmlContent });
}

