import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import logger, { auditLog, bindAuditContext } from '../src/utils/logger.js';
import app from '../src/index.js';

describe('Audit Logger and D1 Persistence (CERT-In 180-Day Retention)', () => {
  it('calls auditLog safely when no DB is bound', () => {
    bindAuditContext(null, null);
    assert.doesNotThrow(() => {
      auditLog('TEST_ACTION_NO_DB', { foo: 'bar' });
    });
  });

  it('persists audit_logs to D1 batch with 180-day pruning query and schedules via executionCtx.waitUntil', async () => {
    const preparedQueries = [];
    const bindArgs = [];
    let batchedStatements = null;
    let waitUntilPromise = null;

    const mockDb = {
      prepare: (sql) => {
        preparedQueries.push(sql);
        return {
          bind: (...args) => {
            bindArgs.push({ sql, args });
            return { sql, args };
          },
        };
      },
      batch: async (statements) => {
        batchedStatements = statements;
        return statements.map(() => ({ results: [], meta: { changes: 1 } }));
      },
    };

    const mockCtx = {
      waitUntil: (p) => {
        waitUntilPromise = p;
      },
    };

    bindAuditContext(mockDb, mockCtx);

    const testAction = 'ADMIN_LOGIN_SUCCESS';
    const testDetails = { username: 'superadmin', ip: '127.0.0.1' };
    auditLog(testAction, testDetails);

    assert.ok(batchedStatements, 'batch should have been called');
    assert.equal(batchedStatements.length, 3, 'batch should have 3 statements: CREATE TABLE, INSERT, and DELETE prune');

    // Statement 0: CREATE TABLE IF NOT EXISTS audit_logs
    assert.ok(preparedQueries.some(q => q.includes('CREATE TABLE IF NOT EXISTS audit_logs')));

    // Statement 1: INSERT INTO audit_logs (id, action, details, created_at) VALUES (?, ?, ?, ?)
    const insertBind = bindArgs.find(b => b.sql.includes('INSERT INTO audit_logs'));
    assert.ok(insertBind, 'INSERT statement must have bind parameters');
    const [id, action, detailsJson, ts] = insertBind.args;
    assert.match(id, /^[0-9a-f-]{36}$/, 'id must be a valid UUID');
    assert.equal(action, testAction);
    assert.deepEqual(JSON.parse(detailsJson), testDetails);
    assert.ok(!isNaN(Date.parse(ts)), 'timestamp must be valid ISO string');

    // Statement 2: DELETE FROM audit_logs WHERE created_at < ?
    const deleteBind = bindArgs.find(b => b.sql.includes('DELETE FROM audit_logs WHERE created_at < ?'));
    assert.ok(deleteBind, 'DELETE statement must have bind parameters');
    const [cutoff5y] = deleteBind.args;
    const cutoffDate = new Date(cutoff5y);
    const expectedApprox = new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000);
    // Tolerance: within 5 seconds of expected 5-year cutoff
    assert.ok(Math.abs(cutoffDate.getTime() - expectedApprox.getTime()) < 5000, 'cutoff should be ~1825 days (5 years) ago');

    // Check waitUntil
    assert.ok(waitUntilPromise, 'waitUntil should receive the batch promise');
    await waitUntilPromise;

    // Clean up
    bindAuditContext(null, null);
  });

  it('index.js audit context middleware runs on incoming requests', async () => {
    let capturedStatements = null;
    let scheduledWaitUntil = null;

    const mockDb = {
      prepare: (sql) => ({
        bind: (...args) => ({ sql, args }),
        first: async () => ({ '1': 1 }),
      }),
      batch: async (statements) => {
        capturedStatements = statements;
        return [];
      },
    };

    const mockCtx = {
      waitUntil: (p) => {
        scheduledWaitUntil = p;
      },
    };

    const res = await app.fetch(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad-email' }),
      }),
      { DB: mockDb },
      mockCtx
    );

    assert.equal(res.status, 422);

    // Now trigger an audit log and verify it uses the captured DB and executionCtx
    auditLog('HEALTH_PROBED', { status: 'healthy' });
    assert.ok(capturedStatements, 'audit log should have batched into mockDb captured from request');
    assert.ok(scheduledWaitUntil, 'waitUntil should have been triggered');

    // Clean up
    bindAuditContext(null, null);
  });
});
