import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Very lightweight JSDoc coverage scanner.
 *
 * It looks for exported/public symbols and checks whether a JSDoc block (/** ... * /)
 * appears immediately above the declaration (allowing blank lines).
 *
 * This is intentionally regex-based to keep it dependency-free.
 */

const WORKSPACE = process.cwd();

const DEFAULT_TARGETS = [
  'pages/game',
  'utils',
  'examples',
];

const DEFAULT_EXCLUDES = [
  'pages/game/libs',
  'node_modules',
  '.git',
];

function isExcluded(p) {
  const norm = p.split(path.sep).join('/');
  return DEFAULT_EXCLUDES.some((ex) => norm.includes(ex));
}

async function listJsFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (isExcluded(full)) continue;
    if (ent.isDirectory()) {
      out.push(...(await listJsFiles(full)));
    } else if (ent.isFile() && ent.name.endsWith('.js')) {
      // Skip minified libs
      if (/three\.min\.js$/i.test(ent.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function hasImmediateJsdoc(lines, startLineIdx) {
  // Walk upward skipping blank lines.
  let i = startLineIdx - 1;
  while (i >= 0 && lines[i].trim() === '') i--;
  if (i < 0) return false;
  return lines[i].trim().endsWith('*/') && lines[i].includes('*/') && (() => {
    // Find start of block
    let j = i;
    while (j >= 0 && !lines[j].includes('/**')) j--;
    if (j < 0) return false;
    // Ensure no code between /** and */ (basic sanity)
    return j <= i;
  })();
}

function detectCandidates(fileText) {
  const lines = fileText.split(/\r?\n/);
  const candidates = [];

  const patterns = [
    // ES exports
    { kind: 'export function', re: /^\s*export\s+function\s+([A-Za-z_$][\w$]*)\s*\(/ },
    { kind: 'export class', re: /^\s*export\s+class\s+([A-Za-z_$][\w$]*)\b/ },
    { kind: 'export default class', re: /^\s*export\s+default\s+class\s+([A-Za-z_$][\w$]*)\b/ },
    { kind: 'export const', re: /^\s*export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*/ },
    // CommonJS
    { kind: 'module.exports', re: /^\s*module\.exports\s*=\s*([A-Za-z_$][\w$]*)\s*;?\s*$/ },
  ];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    for (const p of patterns) {
      const m = line.match(p.re);
      if (!m) continue;
      const name = m[1] ?? '(anonymous)';
      candidates.push({ line: idx + 1, kind: p.kind, name, hasJsdoc: hasImmediateJsdoc(lines, idx) });
    }
  }

  return candidates;
}

function formatReport(missingByFile) {
  const files = Object.keys(missingByFile).sort();
  const totalMissing = files.reduce((sum, f) => sum + missingByFile[f].length, 0);

  const lines = [];
  lines.push(`# JSDoc 缺失报告\n`);
  lines.push(`- 扫描时间：${new Date().toISOString()}\n`);
  lines.push(`- 缺失项总数：${totalMissing}\n`);

  for (const f of files) {
    lines.push(`## ${path.relative(WORKSPACE, f)}\n`);
    for (const item of missingByFile[f]) {
      lines.push(`- L${item.line} **${item.kind}** \`${item.name}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const targetDirs = process.argv.slice(2);
  const targets = targetDirs.length ? targetDirs : DEFAULT_TARGETS;

  const absTargets = targets.map((t) => path.resolve(WORKSPACE, t));

  let jsFiles = [];
  for (const t of absTargets) {
    try {
      const stat = await fs.stat(t);
      if (stat.isDirectory()) {
        jsFiles.push(...(await listJsFiles(t)));
      } else if (stat.isFile() && t.endsWith('.js')) {
        jsFiles.push(t);
      }
    } catch {
      // ignore missing target
    }
  }

  jsFiles = Array.from(new Set(jsFiles)).sort();

  const missingByFile = {};

  for (const file of jsFiles) {
    const text = await fs.readFile(file, 'utf8');
    const candidates = detectCandidates(text);
    const missing = candidates.filter((c) => !c.hasJsdoc);
    if (missing.length) missingByFile[file] = missing;
  }

  const report = formatReport(missingByFile);
  await fs.mkdir(path.resolve(WORKSPACE, 'docs/api'), { recursive: true });
  await fs.writeFile(path.resolve(WORKSPACE, 'docs/api/jsdoc-missing.md'), report, 'utf8');

  const missingCount = Object.values(missingByFile).reduce((sum, arr) => sum + arr.length, 0);
  if (process.env.FAIL_ON_MISSING === '1' && missingCount > 0) {
    console.error(`JSDoc missing: ${missingCount}. See docs/api/jsdoc-missing.md`);
    process.exit(2);
  }

  console.log(`JSDoc scan complete. Missing: ${missingCount}. Output: docs/api/jsdoc-missing.md`);
}

await main();
