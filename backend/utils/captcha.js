import crypto from 'crypto';

// Character set — excludes ambiguous chars: 0, O, I, 1, l
const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Generate a random N-character code */
export const generateCode = (length = 6) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
};

/** Generate a distorted SVG CAPTCHA in Dentzy brand colors */
export const generateCaptchaSVG = (text) => {
  const width  = 190;
  const height = 54;

  // Background noise dots
  let dots = '';
  for (let i = 0; i < 45; i++) {
    const cx      = Math.floor(Math.random() * width);
    const cy      = Math.floor(Math.random() * height);
    const r       = (Math.random() * 1.8 + 0.4).toFixed(1);
    const opacity = (Math.random() * 0.35 + 0.08).toFixed(2);
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#708c80" opacity="${opacity}"/>`;
  }

  // Noise lines
  let lines = '';
  for (let i = 0; i < 5; i++) {
    const x1     = Math.floor(Math.random() * width);
    const y1     = Math.floor(Math.random() * height);
    const x2     = Math.floor(Math.random() * width);
    const y2     = Math.floor(Math.random() * height);
    const stroke = i % 2 === 0 ? '#1e5038' : '#708c80';
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.2" opacity="0.3" stroke-dasharray="3 3"/>`;
  }

  // Distorted characters
  const colors    = ['#1e5038', '#2d3a34', '#708c80', '#166534', '#4a6a5a'];
  const charWidth = width / (text.length + 1);
  let chars = '';
  for (let i = 0; i < text.length; i++) {
    const x        = Math.floor((i + 0.75) * charWidth);
    const y        = Math.floor(height / 2 + (Math.random() * 8 - 4) + 5);
    const rotate   = Math.floor(Math.random() * 28 - 14);
    const color    = colors[i % colors.length];
    const fontSize = Math.floor(22 + Math.random() * 5);
    chars += `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" transform="rotate(${rotate},${x},${y})">${text[i]}</text>`;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#eef6f2;border-radius:8px;border:1.5px solid #c5ddd3;user-select:none;display:block;">${dots}${lines}${chars}</svg>`;
};

/**
 * Create HMAC-signed token  →  "{CODE}:{expiresAt}:{hmac}"
 * Valid for 5 minutes.
 */
export const createCaptchaToken = (text) => {
  const secret    = process.env.JWT_SECRET || 'dentzy-captcha-fallback';
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload   = `${text.toUpperCase()}:${expiresAt}`;
  const hmac      = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}:${hmac}`;
};

/**
 * Verify user input against a signed token.
 * Returns { valid: boolean, message?: string }
 */
export const verifyCaptchaToken = (token, userInput) => {
  if (!token || !userInput)
    return { valid: false, message: 'CAPTCHA code is required.' };

  const secret = process.env.JWT_SECRET || 'dentzy-captcha-fallback';
  const parts  = token.split(':');

  if (parts.length !== 3)
    return { valid: false, message: 'Invalid CAPTCHA. Please refresh and try again.' };

  const [expectedCode, expiresAtStr, hmac] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (Date.now() > expiresAt)
    return { valid: false, message: 'CAPTCHA expired. Please refresh and try again.' };

  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(`${expectedCode}:${expiresAtStr}`)
    .digest('hex');

  if (hmac !== expectedHmac)
    return { valid: false, message: 'CAPTCHA security check failed. Please refresh.' };

  if (userInput.trim().toUpperCase() !== expectedCode)
    return { valid: false, message: 'Incorrect CAPTCHA code. Please try again.' };

  return { valid: true };
};
