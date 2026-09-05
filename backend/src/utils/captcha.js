// SVG CAPTCHA generator — identical visual output to the original, zero deps.
const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateCode = (length = 6) => {
  // ponytail: 256 % 32 === 0, no modulo bias. Visual noise stays Math.random (cosmetic only).
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => CHARS[b % CHARS.length]).join('');
};

export const generateCaptchaSVG = (text) => {
  const width = 190, height = 54;

  let dots = '';
  for (let i = 0; i < 45; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = (Math.random() * 1.8 + 0.4).toFixed(1);
    const opacity = (Math.random() * 0.35 + 0.08).toFixed(2);
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#708c80" opacity="${opacity}"/>`;
  }

  let lines = '';
  for (let i = 0; i < 5; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const stroke = i % 2 === 0 ? '#1e5038' : '#708c80';
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.2" opacity="0.3" stroke-dasharray="3 3"/>`;
  }

  const colors = ['#1e5038', '#2d3a34', '#708c80', '#166534', '#4a6a5a'];
  const charWidth = width / (text.length + 1);
  let chars = '';
  for (let i = 0; i < text.length; i++) {
    const x = Math.floor((i + 0.75) * charWidth);
    const y = Math.floor(height / 2 + (Math.random() * 8 - 4) + 5);
    const rotate = Math.floor(Math.random() * 28 - 14);
    const color = colors[i % colors.length];
    const fontSize = Math.floor(22 + Math.random() * 5);
    chars += `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" transform="rotate(${rotate},${x},${y})">${text[i]}</text>`;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#eef6f2;border-radius:8px;border:1.5px solid #c5ddd3;user-select:none;display:block;">${dots}${lines}${chars}</svg>`;
};
