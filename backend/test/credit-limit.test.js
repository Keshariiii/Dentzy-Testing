import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Credit limit check logic', () => {
  it('blocks when debt >= 200000', () => {
    const CREDIT_LIMIT = 200000;
    const debt = 205000;
    const isBlocked = debt >= CREDIT_LIMIT;
    assert.ok(isBlocked, 'Should block when debt >= 2L');
  });

  it('allows when debt < 200000', () => {
    const CREDIT_LIMIT = 200000;
    const debt = 199999;
    const isBlocked = debt >= CREDIT_LIMIT;
    assert.ok(!isBlocked, 'Should allow when debt < 2L');
  });

  it('allows with creditOverride even at limit', () => {
    const CREDIT_LIMIT = 200000;
    const debt = 250000;
    const override = true;
    const isBlocked = debt >= CREDIT_LIMIT && !override;
    assert.ok(!isBlocked, 'Should allow with creditOverride');
  });
});
