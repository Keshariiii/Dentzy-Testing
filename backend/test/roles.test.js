import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_STAFF_DESIGNATIONS,
  EXECUTIVE_ROLES,
  RECEPTIONIST_ROLES,
  PRODUCTION_ROLES,
  DELIVERY_ROLES,
  normalizeDesignation,
  inferDepartment,
  isExecutiveRole,
  isReceptionistRole,
  isProductionRole,
  isDeliveryRole,
} from '../src/utils/roles.js';

describe('Staff Designation & Role Normalization', () => {
  test('has exactly 10 canonical staff designations', () => {
    assert.equal(CANONICAL_STAFF_DESIGNATIONS.length, 10);
    assert.deepEqual(CANONICAL_STAFF_DESIGNATIONS, [
      'CEO', 'CTO', 'Receptionist', 'Acrylic', 'Ceramic',
      'CAD/CAM', 'Milling', 'Sintering', '3D Printing', 'Delivery'
    ]);
  });

  test('normalizes legacy and variant designation names', () => {
    assert.equal(normalizeDesignation('Ceramist'), 'Ceramic');
    assert.equal(normalizeDesignation('Ceramic Staff'), 'Ceramic');
    assert.equal(normalizeDesignation('Acrylic Tech'), 'Acrylic');
    assert.equal(normalizeDesignation('Acrylic Staff'), 'Acrylic');
    assert.equal(normalizeDesignation('CAD/CAM Specialist'), 'CAD/CAM');
    assert.equal(normalizeDesignation('CAD/CAM Tech'), 'CAD/CAM');
    assert.equal(normalizeDesignation('Delivery Staff'), 'Delivery');
    assert.equal(normalizeDesignation('Rider'), 'Delivery');
    assert.equal(normalizeDesignation('CEO'), 'CEO');
    assert.equal(normalizeDesignation('CTO'), 'CTO');
    assert.equal(normalizeDesignation('Receptionist'), 'Receptionist');
    assert.equal(normalizeDesignation('Unknown Role'), 'Ceramic');
    assert.equal(normalizeDesignation(null), 'Ceramic');
    assert.equal(normalizeDesignation(''), 'Ceramic');
  });

  test('correctly identifies role tiers', () => {
    assert.equal(isExecutiveRole('CEO'), true);
    assert.equal(isExecutiveRole('CTO'), true);
    assert.equal(isExecutiveRole('Receptionist'), false);

    assert.equal(isReceptionistRole('Receptionist'), true);
    assert.equal(isReceptionistRole('Ceramic'), false);

    assert.equal(isProductionRole('Ceramist'), true);
    assert.equal(isProductionRole('Milling'), true);
    assert.equal(isProductionRole('3D Printing'), true);
    assert.equal(isProductionRole('Delivery'), false);

    assert.equal(isDeliveryRole('Rider'), true);
    assert.equal(isDeliveryRole('Delivery'), true);
    assert.equal(isDeliveryRole('CEO'), false);
  });

  test('infers department from service category and type', () => {
    assert.equal(inferDepartment('Acrylic', 'Crown'), 'Acrylic');
    assert.equal(inferDepartment('', 'Denture'), 'Acrylic');
    assert.equal(inferDepartment('Zirconia', ''), 'CAD/CAM');
    assert.equal(inferDepartment('Ceramic', 'Crown'), 'Ceramic');
    assert.equal(inferDepartment('', ''), 'Ceramic');
  });
});
