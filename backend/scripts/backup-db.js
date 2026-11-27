import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import XLSX from 'xlsx';

const DEFAULT_DEST = 'C:\\Dentzy Database Backup';
const TABLES = [
  'users',
  'lab_orders',
  'payments',
  'staff',
  'staff_attendance',
  'inventory',
  'delivery_tasks',
  'intern_tasks',
  'contacts',
  'audit_logs',
  'app_settings',
];

// Parse CLI flags: --target=local|remote|both, --dest=path
function parseArgs() {
  const args = process.argv.slice(2);
  let target = 'both';
  let dest = DEFAULT_DEST;

  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      target = arg.split('=')[1].trim().toLowerCase();
    } else if (arg.startsWith('--dest=')) {
      dest = arg.split('=')[1].trim();
    }
  }

  const targets = target === 'both' ? ['local', 'remote'] : [target];
  return { targets, dest };
}

// Format rows for clean Excel presentation (stringify nested objects/arrays)
function sanitizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const clean = {};
    for (const [key, val] of Object.entries(row)) {
      if (val !== null && typeof val === 'object') {
        clean[key] = JSON.stringify(val);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  });
}

// Auto-size worksheet columns based on content
function autoFitColumns(worksheet, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  worksheet['!cols'] = headers.map((header) => {
    let maxLen = header.length;
    for (let i = 0; i < Math.min(rows.length, 100); i++) {
      const val = rows[i][header];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(maxLen + 3, 50) };
  });
}

export function exportTable(table, envTarget, baseDest) {
  const targetDir = path.join(baseDest, envTarget);
  fs.mkdirSync(targetDir, { recursive: true });

  const cmd = `npx wrangler d1 execute dentzy-db --${envTarget} --json --command "SELECT * FROM ${table}"`;
  let output;
  try {
    output = execSync(cmd, {
      cwd: path.resolve(import.meta.dirname, '..'),
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    console.error(`[${envTarget}] Error querying table '${table}':`, err.message);
    return { success: false, rowCount: 0 };
  }

  try {
    const parsed = JSON.parse(output);
    const results = parsed[0]?.results || [];
    const cleanRows = sanitizeRows(results);

    const wb = XLSX.utils.book_new();
    const ws = cleanRows.length > 0
      ? XLSX.utils.json_to_sheet(cleanRows)
      : XLSX.utils.aoa_to_sheet([['No data records found for this table']]);

    autoFitColumns(ws, cleanRows);
    XLSX.utils.book_append_sheet(wb, ws, table.substring(0, 31)); // Excel tab limit is 31 chars

    const filePath = path.join(targetDir, `${table}.xlsx`);
    try {
      XLSX.writeFile(wb, filePath);
    } catch (writeErr) {
      if (writeErr.code === 'EBUSY' || writeErr.code === 'EPERM') {
        const altPath = path.join(targetDir, `${table}_live.xlsx`);
        XLSX.writeFile(wb, altPath);
        console.warn(`[${envTarget}] ${table}.xlsx is open in Excel. Written to ${table}_live.xlsx`);
        return { success: true, rowCount: cleanRows.length, filePath: altPath };
      }
      throw writeErr;
    }
    console.log(`[${envTarget}] \x1b[32mOK\x1b[0m ${table}.xlsx (${cleanRows.length} rows)`);
    return { success: true, rowCount: cleanRows.length, filePath };
  } catch (err) {
    console.error(`[${envTarget}] Failed to write Excel for '${table}':`, err.message);
    return { success: false, rowCount: 0 };
  }
}

export function exportAll(targets, dest) {
  console.log(`\n======================================================`);
  console.log(` Dentzy Database to Excel Exporter (C:\\ Drive Backup) `);
  console.log(` Targets: ${targets.join(', ')} | Destination: ${dest}`);
  console.log(`======================================================\n`);

  const summary = {};
  for (const t of targets) {
    summary[t] = { ok: 0, failed: 0, totalRows: 0 };
    console.log(`Exporting ${t.toUpperCase()} database tables...`);
    for (const table of TABLES) {
      const res = exportTable(table, t, dest);
      if (res.success) {
        summary[t].ok++;
        summary[t].totalRows += res.rowCount;
      } else {
        summary[t].failed++;
      }
    }
    console.log('');
  }

  console.log(`------------------------------------------------------`);
  console.log(` Backup Summary:`);
  for (const t of targets) {
    console.log(`  - ${t}: ${summary[t].ok}/${TABLES.length} tables exported (${summary[t].totalRows} total rows)`);
  }
  console.log(` Destination folder: ${dest}`);
  console.log(`======================================================\n`);
}

// Run directly from CLI
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { targets, dest } = parseArgs();
  exportAll(targets, dest);
}
