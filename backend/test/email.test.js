import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// email.js imports 'cloudflare:sockets' which only exists on Workers.
// Extract and test htmlToPlainText as a standalone pure function here.

function htmlToPlainText(html) {
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

// ── htmlToPlainText ─────────────────────────────────────────────────────────

describe('htmlToPlainText', () => {
  it('strips HTML tags', () => {
    assert.equal(htmlToPlainText('<p>Hello <strong>World</strong></p>'), 'Hello World');
  });

  it('converts <br> to newline', () => {
    assert.ok(htmlToPlainText('Line1<br>Line2').includes('Line1\nLine2'));
  });

  it('converts </p> to double newline', () => {
    const result = htmlToPlainText('<p>Para 1</p><p>Para 2</p>');
    assert.ok(result.includes('Para 1'));
    assert.ok(result.includes('Para 2'));
  });

  it('decodes &amp; &lt; &gt; &nbsp;', () => {
    const result = htmlToPlainText('A &amp; B &lt; C &gt; D &nbsp; E');
    assert.ok(result.includes('A & B'));
    assert.ok(result.includes('< C'));
    assert.ok(result.includes('> D'));
  });

  it('strips <style> and <script> blocks', () => {
    const html = '<style>.x{color:red}</style><script>alert(1)</script><p>Clean</p>';
    const result = htmlToPlainText(html);
    assert.ok(!result.includes('color'));
    assert.ok(!result.includes('alert'));
    assert.ok(result.includes('Clean'));
  });

  it('returns empty string for empty/null input', () => {
    assert.equal(htmlToPlainText(''), '');
    assert.equal(htmlToPlainText(null), '');
    assert.equal(htmlToPlainText(undefined), '');
  });

  it('collapses excessive blank lines', () => {
    const result = htmlToPlainText('<p>A</p><p></p><p></p><p>B</p>');
    const newlineCount = (result.match(/\n/g) || []).length;
    assert.ok(newlineCount <= 4, `Too many newlines: ${newlineCount}`);
  });
});

// ── Testing Website Notice Banner Tests ─────────────────────────────────────

import { renderDentzyEmailLayout } from '../src/utils/email.js';

describe('renderDentzyEmailLayout - Testing Website Notice', () => {
  it('includes the "Sent from testing website" notice banner by default', () => {
    const html = renderDentzyEmailLayout({
      heading: 'Test Subject',
      bodyHtml: '<p>Testing body</p>',
    });

    assert.ok(html.includes('Sent from testing website'), 'Email HTML should contain "Sent from testing website"');
    assert.ok(html.includes('dentzy-testing.pages.dev'), 'Email HTML should contain domain reference');
    assert.ok(html.includes('Notice'), 'Email HTML should contain Notice badge');
  });

  it('prefixes preheader with [Sent from testing website]', () => {
    const html = renderDentzyEmailLayout({
      preheader: 'Your verification code is 123456',
      heading: 'Test Subject',
      bodyHtml: '<p>Testing body</p>',
    });

    assert.ok(html.includes('[Sent from testing website] Your verification code is 123456'), 'Preheader should be prefixed');
  });

  it('includes "Sent from testing website" in the footer area', () => {
    const html = renderDentzyEmailLayout({
      heading: 'Test Subject',
      bodyHtml: '<p>Testing body</p>',
    });

    assert.ok(html.includes('Sent from testing website &bull;'), 'Footer should indicate sent from testing website');
  });

  it('preserves existing preheader if it already mentions testing website', () => {
    const html = renderDentzyEmailLayout({
      preheader: '[Sent from testing website] Important alert',
      heading: 'Test Subject',
      bodyHtml: '<p>Testing body</p>',
    });

    assert.ok(html.includes('[Sent from testing website] Important alert'));
    // Should not double-prefix
    assert.ok(!html.includes('[Sent from testing website] [Sent from testing website]'));
  });

  it('allows disabling testing notice when showTestingNotice is false', () => {
    const html = renderDentzyEmailLayout({
      heading: 'Test Subject',
      bodyHtml: '<p>Testing body</p>',
      showTestingNotice: false,
    });

    assert.ok(!html.includes('background-color: #fffbeb; border-radius: 10px; padding: 12px 16px; margin: 0;'), 'Notice banner should not be present');
  });
});

import { sendEmail } from '../src/utils/email.js';

describe('sendEmail - Configuration check', () => {
  it('returns failure error when GMAIL_APP_PASSWORD is missing', async () => {
    const res = await sendEmail({
      env: {},
      to: 'test@example.com',
      subject: 'Test Subject',
      htmlContent: '<p>Test</p>',
    });

    assert.equal(res.success, false);
    assert.ok(res.error.includes('GMAIL_APP_PASSWORD missing'));
  });
});


