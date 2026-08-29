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
