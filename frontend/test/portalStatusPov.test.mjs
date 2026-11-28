import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import {
  resolvePortalContext,
  getPortalFooterLinks,
  buildInvoiceStatusConfig,
  getNotFoundConfig,
  getRootErrorConfig,
  appendLabPortalHint,
} from '../src/utils/portalStatusPov.js';

describe('resolvePortalContext', () => {
  it('resolves dentist POV when dentist user is authenticated on /invoice', () => {
    const ctx = resolvePortalContext({
      pathname: '/invoice',
      user: { name: 'naman', clinicName: 'Smile Care' },
    });

    assert.equal(ctx.pov, 'dentist');
    assert.equal(ctx.isGuest, false);
    assert.equal(ctx.portalBadge, 'Clinical Portal');
    assert.equal(ctx.backHref, '/dashboard');
    assert.equal(ctx.backLabel, 'Back to Dashboard');
    assert.equal(ctx.paymentsHref, '/dashboard?tab=payments');
    assert.equal(ctx.ordersHref, '/dashboard?tab=orders');
    assert.equal(ctx.navUser.name, 'Dr. Naman');
    assert.equal(ctx.navUser.role, 'Smile Care');
  });

  it('resolves lab admin POV when direct admin is authenticated', () => {
    const ctx = resolvePortalContext({
      pathname: '/invoice',
      admin: { displayName: 'Keshav', username: 'admin', designation: 'CEO' },
    });

    assert.equal(ctx.pov, 'lab');
    assert.equal(ctx.labScope, 'admin');
    assert.equal(ctx.isGuest, false);
    assert.equal(ctx.portalBadge, 'Admin Portal');
    assert.equal(ctx.backHref, '/admin/dashboard');
    assert.equal(ctx.paymentsHref, '/admin/dashboard?view=dentists&sub=payments');
  });

  it('resolves lab executive POV cleanly when executive staff is authenticated', () => {
    const ctx = resolvePortalContext({
      pathname: '/invoice',
      admin: { displayName: 'Naman', username: 'ceo', designation: 'CEO', isExecutiveStaff: true },
      staff: { displayName: 'Naman', username: 'ceo', designation: 'CEO' },
    });

    assert.equal(ctx.pov, 'lab');
    assert.equal(ctx.labScope, 'executive');
    assert.equal(ctx.isGuest, false);
    assert.equal(ctx.backHref, '/staff/dashboard');
    assert.equal(ctx.paymentsHref, '/staff/dashboard?view=dentists&sub=payments');
  });

  it('resolves lab staff POV when non-executive staff is authenticated', () => {
    const ctx = resolvePortalContext({
      pathname: '/invoice',
      staff: { displayName: 'Priya', username: 'reception', designation: 'Receptionist' },
    });

    assert.equal(ctx.pov, 'lab');
    assert.equal(ctx.labScope, 'staff');
    assert.equal(ctx.isGuest, false);
    assert.equal(ctx.portalBadge, 'Staff Portal');
    assert.equal(ctx.backHref, '/staff/dashboard');
    assert.equal(ctx.paymentsHref, '/staff/dashboard');
  });

  it('does not let ?portal=lab override an authenticated dentist session', () => {
    const ctx = resolvePortalContext({
      pathname: '/invoice',
      search: '?batchId=BATCH-1&portal=lab',
      user: { name: 'Naman', clinicName: 'Clinic A' },
    });

    assert.equal(ctx.pov, 'dentist');
    assert.equal(ctx.isGuest, false);
  });

  it('uses ?portal=lab or dentistId hint only when signed out', () => {
    const labHintCtx = resolvePortalContext({
      pathname: '/invoice',
      search: '?batchId=BATCH-1&portal=lab',
    });
    assert.equal(labHintCtx.pov, 'lab');
    assert.equal(labHintCtx.isGuest, true);
    assert.equal(labHintCtx.portalBadge, 'Lab Portal');
    assert.equal(labHintCtx.backHref, '/login?role=staff');

    const dentistIdHintCtx = resolvePortalContext({
      pathname: '/invoice',
      search: '?unpaid=true&dentistId=u_123',
    });
    assert.equal(dentistIdHintCtx.pov, 'lab');
    assert.equal(dentistIdHintCtx.isGuest, true);

    const guestCtx = resolvePortalContext({ pathname: '/invoice', search: '?batchId=BATCH-1' });
    assert.equal(guestCtx.pov, 'guest');
    assert.equal(guestCtx.isGuest, true);
    assert.equal(guestCtx.backHref, '/');
  });
});

describe('buildInvoiceStatusConfig', () => {
  it('returns Dentist POV copy and clinic actions for HTTP 404 without admin leaks', () => {
    const portal = resolvePortalContext({
      pathname: '/invoice',
      user: { name: 'Naman', clinicName: 'Smile Care' },
    });
    const cfg = buildInvoiceStatusConfig({
      error: { title: 'Invoice Not Found', message: 'Not found', status: 404 },
      batchId: 'BATCH-MWBQ3MFZ',
      portal,
    });

    assert.equal(cfg.eyebrow, 'Invoice · HTTP 404 · BATCH-MWBQ3MFZ');
    assert.equal(cfg.title, 'Invoice Not Found');
    const joined = cfg.paragraphs.join(' ');
    assert.doesNotMatch(joined, /admin account/i);
    assert.doesNotMatch(joined, /clinic or lab administrator/i);
    assert.match(joined, /Payments & Invoices/);
    assert.equal(cfg.primaryAction.href, '/dashboard?tab=payments');
    assert.equal(cfg.primaryAction.label, 'Go to My Invoices');
    assert.equal(cfg.secondaryAction.href, 'tel:+919503668112');
  });

  it('returns Our Lab POV copy and ledger actions for Admin on HTTP 404', () => {
    const portal = resolvePortalContext({
      pathname: '/invoice',
      admin: { displayName: 'Keshav', designation: 'CTO' },
    });
    const cfg = buildInvoiceStatusConfig({
      error: { title: 'Invoice Not Found', message: 'Not found', status: 404 },
      batchId: 'BATCH-MWBQ3MFZ',
      portal,
    });

    assert.equal(cfg.eyebrow, 'Lab Billing · HTTP 404 · BATCH-MWBQ3MFZ');
    assert.equal(cfg.title, 'Batch Invoice Not Found');
    const joined = cfg.paragraphs.join(' ');
    assert.match(joined, /BATCH-MWBQ3MFZ/);
    assert.match(joined, /lab ledger/i);
    assert.doesNotMatch(joined, /Dentzy Support/i);
    assert.equal(cfg.primaryAction.href, '/admin/dashboard?view=dentists&sub=payments');
    assert.equal(cfg.primaryAction.label, 'Open Payments & Billing');
    assert.equal(cfg.secondaryAction.href, '/admin/dashboard');
  });

  it('avoids duplicate CTA when non-executive staff lands on 404', () => {
    const portal = resolvePortalContext({
      pathname: '/invoice',
      staff: { displayName: 'Priya', designation: 'Receptionist' },
    });
    const cfg = buildInvoiceStatusConfig({
      error: { title: 'Invoice Not Found', message: 'Not found', status: 404 },
      batchId: 'BATCH-MWBQ3MFZ',
      portal,
    });

    assert.equal(cfg.primaryAction.href, '/staff/dashboard');
    assert.equal(cfg.primaryAction.label, 'Open Staff Dashboard');
    assert.equal(cfg.secondaryAction, null);
  });

  it('handles 401 separately for lab-hinted vs generic guest', () => {
    const labGuest = resolvePortalContext({ pathname: '/invoice', search: '?batchId=B1&portal=lab' });
    const labCfg = buildInvoiceStatusConfig({ error: { status: 401 }, portal: labGuest });
    assert.equal(labCfg.title, 'Lab Session Required');
    assert.equal(labCfg.primaryAction.href, '/login?role=admin');
    assert.equal(labCfg.primaryAction.label, 'Admin / CEO Sign In');
    assert.equal(labCfg.secondaryAction.href, '/login?role=staff');
    assert.equal(labCfg.secondaryAction.label, 'Staff Sign In');

    const guest = resolvePortalContext({ pathname: '/invoice', search: '?batchId=B1' });
    const guestCfg = buildInvoiceStatusConfig({ error: { status: 401 }, portal: guest });
    assert.equal(guestCfg.title, 'Sign In to View Invoice');
    assert.equal(guestCfg.primaryAction.href, '/login');
    assert.equal(guestCfg.primaryAction.label, 'Dentist Sign In');
    assert.equal(guestCfg.secondaryAction.href, '/login?role=staff');
    assert.equal(guestCfg.secondaryAction.label, 'Lab Staff / Admin Sign In');
  });

  it('handles 403 separately for Dentist vs Lab Staff', () => {
    const dentist = resolvePortalContext({ pathname: '/invoice', user: { name: 'Naman' } });
    const dCfg = buildInvoiceStatusConfig({ error: { status: 403 }, portal: dentist });
    assert.equal(dCfg.title, 'Access Restricted');
    assert.equal(dCfg.primaryAction.href, '/dashboard?tab=payments');
    assert.equal(dCfg.secondaryAction.href, '/login');

    const staff = resolvePortalContext({ pathname: '/invoice', staff: { displayName: 'Tech', designation: 'Ceramic' } });
    const sCfg = buildInvoiceStatusConfig({ error: { status: 403 }, portal: staff });
    assert.equal(sCfg.title, 'Billing Permission Required');
    assert.equal(sCfg.primaryAction.href, '/staff/dashboard');
    assert.equal(sCfg.secondaryAction.href, '/login?role=staff');
  });
});

describe('not-found, root error, footer links, and lab hint helper', () => {
  it('returns distinct POV configs for not-found and error pages', () => {
    const dentist = resolvePortalContext({ pathname: '/dashboard/missing', user: { name: 'Naman' } });
    const lab = resolvePortalContext({ pathname: '/admin/missing', admin: { displayName: 'Keshav' } });

    assert.equal(getNotFoundConfig(dentist).primaryAction.href, '/dashboard');
    assert.equal(getNotFoundConfig(lab).primaryAction.href, '/admin/dashboard');

    assert.equal(getRootErrorConfig({ portal: dentist, refId: 'DZ-ERR-1' }).secondaryAction.href, '/dashboard');
    assert.equal(getRootErrorConfig({ portal: lab, refId: 'DZ-ERR-1' }).secondaryAction.href, '/admin/dashboard');
  });

  it('returns POV-specific footer links without Login when signed in', () => {
    const dentistLinks = getPortalFooterLinks(resolvePortalContext({ user: { name: 'Naman' } }));
    assert.equal(dentistLinks.some(l => l.href === '/login'), false);
    assert.equal(dentistLinks.some(l => l.href === '/dashboard?tab=payments'), true);

    const labLinks = getPortalFooterLinks(resolvePortalContext({ admin: { displayName: 'Keshav' } }));
    assert.equal(labLinks.some(l => l.href === '/admin/dashboard?view=dentists&sub=payments'), true);
    assert.equal(labLinks.some(l => l.href.startsWith('tel:')), false);
  });

  it('appends portal=lab only on lab portal paths', () => {
    assert.equal(
      appendLabPortalHint('/invoice?batchId=B1', '/admin/dashboard'),
      '/invoice?batchId=B1&portal=lab'
    );
    assert.equal(
      appendLabPortalHint('/invoice?batchId=B1', '/staff/dashboard'),
      '/invoice?batchId=B1&portal=lab'
    );
    assert.equal(
      appendLabPortalHint('/invoice?batchId=B1&portal=lab', '/admin/dashboard'),
      '/invoice?batchId=B1&portal=lab'
    );
    assert.equal(
      appendLabPortalHint('/invoice?batchId=B1', '/dashboard'),
      '/invoice?batchId=B1'
    );
  });

  it('uses consistent Title Case Sign In copy in PortalStatusPage navbar CTA', () => {
    const src = readFileSync(
      join(__dirname, '../src/components/common/PortalStatusPage.jsx'),
      'utf8'
    );
    assert.match(src, /'Lab Sign In'\s*:\s*'Sign In'/);
  });
});
