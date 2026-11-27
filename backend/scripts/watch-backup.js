import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { exportTable } from './backup-db.js';

const DEFAULT_DEST = 'C:\\Dentzy Database Backup';
const TABLES = [
  { name: 'users', timeCol: 'updatedAt' },
  { name: 'lab_orders', timeCol: 'updatedAt' },
  { name: 'payments', timeCol: 'updatedAt' },
  { name: 'staff', timeCol: 'updatedAt' },
  { name: 'staff_attendance', timeCol: 'created_at' },
  { name: 'inventory', timeCol: 'updated_at' },
  { name: 'delivery_tasks', timeCol: 'updated_at' },
  { name: 'intern_tasks', timeCol: 'updated_at' },
  { name: 'contacts', timeCol: 'updatedAt' },
  { name: 'audit_logs', timeCol: 'created_at' },
  { name: 'app_settings', timeCol: 'updated_at' },
];

function getStateFile(dest) {
  return path.join(dest, '.backup-state.json');
}

function loadState(dest) {
  const stateFile = getStateFile(dest);
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveState(dest, state) {
  const stateFile = getStateFile(dest);
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save state:', err.message);
  }
}

function getAllFingerprints(envTarget) {
  const sql = TABLES.map(
    (tbl) => `SELECT '${tbl.name}' as t, count(*) as c, COALESCE(max(${tbl.timeCol}), '') as m FROM ${tbl.name}`
  ).join('; ') + ';';

  const cmd = `npx wrangler d1 execute dentzy-db --${envTarget} --json --command "${sql.replace(/"/g, '\\"')}"`;
  try {
    const output = execSync(cmd, {
      cwd: path.resolve(import.meta.dirname, '..'),
      maxBuffer: 5 * 1024 * 1024,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const parsed = JSON.parse(output);
    const results = {};
    if (Array.isArray(parsed)) {
      for (const section of parsed) {
        const row = section?.results?.[0];
        if (row?.t) {
          results[row.t] = `${row.c ?? 0}:${row.m ?? ''}`;
        }
      }
    }
    return results;
  } catch {
    return null;
  }
}

export async function runWatcher() {
  const args = process.argv.slice(2);
  let intervalSec = 3; // 3-second real-time check
  let dest = DEFAULT_DEST;
  let target = 'both';

  for (const arg of args) {
    if (arg.startsWith('--interval=')) intervalSec = parseInt(arg.split('=')[1], 10) || 3;
    if (arg.startsWith('--dest=')) dest = arg.split('=')[1].trim();
    if (arg.startsWith('--target=')) target = arg.split('=')[1].trim().toLowerCase();
  }

  fs.mkdirSync(dest, { recursive: true });
  const targets = target === 'both' ? ['local', 'remote'] : [target];
  console.log(`=============================================================`);
  console.log(` Dentzy Live Real-Time Database -> Excel Synchronizer `);
  console.log(` Monitoring: [${targets.join(', ')}] continuously every ${intervalSec}s`);
  console.log(` Output folder: ${dest}`);
  console.log(`=============================================================\n`);

  const state = loadState(dest);

  const check = () => {
    const timeStr = new Date().toLocaleTimeString();
    let changed = false;

    for (const t of targets) {
      const fps = getAllFingerprints(t);
      if (!fps) continue;

      for (const [tblName, fp] of Object.entries(fps)) {
        const key = `${t}:${tblName}`;
        const prev = state[key];
        const targetExcel = path.join(dest, t, `${tblName}.xlsx`);
        const fileMissing = !fs.existsSync(targetExcel);

        if (prev !== fp || fileMissing) {
          console.log(`[${timeStr}] Real-time change detected in [${t}] ${tblName} (${prev || 'none'} -> ${fp})`);
          const res = exportTable(tblName, t, dest);
          if (res.success) {
            state[key] = fp;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      saveState(dest, state);
    }
  };

  let inProgress = false;
  let checkCount = 0;
  const loop = () => {
    if (inProgress) return;
    inProgress = true;
    try {
      check();
      checkCount++;
      if (checkCount % 10 === 0) {
        console.log(`[${new Date().toLocaleTimeString()}] Live check heartbeat: cycle #${checkCount} (watching local & remote)...`);
      }
    } catch (err) {
      console.error('Sync loop error:', err.message);
    } finally {
      inProgress = false;
      setTimeout(loop, intervalSec * 1000);
    }
  };

  console.log(`[${new Date().toLocaleTimeString()}] Starting continuous instant sync...`);
  loop();
}

runWatcher();
