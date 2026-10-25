import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderAmount, RATE_CARD, SERVICE_TYPE_RATES } from '../src/utils/pricing.js';

describe('Pricing Engine Utility', () => {
  it('defaults unit count to 1 when teeth_data is null, empty string, empty array, or invalid JSON', () => {
    assert.deepEqual(calculateOrderAmount({ serviceType: 'Crown', teeth_data: null }), { amount: 750, teethCount: 1 });
    assert.deepEqual(calculateOrderAmount({ serviceType: 'Crown', teeth_data: '' }), { amount: 750, teethCount: 1 });
    assert.deepEqual(calculateOrderAmount({ serviceType: 'Crown', teeth_data: '[]' }), { amount: 750, teethCount: 1 });
    assert.deepEqual(calculateOrderAmount({ serviceType: 'Crown', teeth_data: 'invalid-json' }), { amount: 750, teethCount: 1 });
    assert.deepEqual(calculateOrderAmount({ serviceType: 'Crown', teeth_data: [] }), { amount: 750, teethCount: 1 });
  });

  it('multiplies base rate by number of parsed teeth in array or JSON string', () => {
    assert.deepEqual(calculateOrderAmount({ serviceType: 'Crown', teeth_data: '["11","12","13"]' }), { amount: 2250, teethCount: 3 });
    assert.deepEqual(calculateOrderAmount({ serviceType: 'Bridge', teeth_data: ['14', '15'] }), { amount: 1500, teethCount: 2 });
  });

  it('calculates price using specific productId if available', () => {
    assert.deepEqual(calculateOrderAmount({ productId: 'zircon_zahn', teeth_data: '["21"]' }), { amount: 1800, teethCount: 1 });
    assert.deepEqual(calculateOrderAmount({ productId: 'white_metal', teeth_data: '["31","32"]' }), { amount: 500, teethCount: 2 });
  });

  it('falls back to Other service rate for unknown service types and ensures amount > 0', () => {
    const res = calculateOrderAmount({ serviceType: 'UnknownType', teeth_data: null });
    assert.equal(res.teethCount, 1);
    assert.ok(res.amount > 0);
  });
});
