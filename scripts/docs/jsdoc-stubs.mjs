import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Generates JSDoc stub blocks for missing items found by jsdoc-scan.
 *
 * Output is Markdown with copy/paste-ready blocks, so humans (or AI) can fill in details.
 * This tool does NOT modify source files.
 */

const WORKSPACE = process.cwd();
const MISSING_REPORT = path.resolve(WORKSPACE, 'docs/api/jsdoc-missing.md');

function parseMissing(md) {
  const lines = md.split(/\r?\n/);
  const items = [];
  let currentFile = null;

  for (const line of lines) {
    const fileHeader = line.match(/^##\s+(.+)$/);
    if (fileHeader) {
      currentFile = fileHeader[1].trim();
      continue;
    }

    const m = line.match(/^-\s+L(\d+)\s+\*\*([^*]+)\*\*\s+`([^`]+)`/);
    if (m && currentFile) {
      items.push({
        file: currentFile,
        line: Number(m[1]),
        kind: m[2].trim(),
        name: m[3].trim(),
      });
    }
  }

  return items;
}

function stubFor(item) {
  // Generic, safe defaults. Human should refine.
  switch (item.kind) {
    case 'export function':
      return `/**\n * TODO: 描述 ${item.name} 的用途。\n *\n * @param {*} ...args - TODO\n * @returns {*} TODO\n */\nexport function ${item.name}(...args) {\n  // ...\n}`;
    case 'export class':
    case 'export default class':
      return `/**\n * TODO: 描述 ${item.name} 的职责与使用方式。\n */\n${item.kind === 'export default class' ? 'export default class' : 'export class'} ${item.name} {\n  /**\n   * TODO: 构造参数说明。\n   * @param {*} args\n   */\n  constructor(...args) {}\n}`;
    case 'export const':
      return `/**\n * TODO: 描述 ${item.name} 的含义与结构。\n * @type {*}\n */\nexport const ${item.name} = /* TODO */ null;`;
    case 'module.exports':
      return `/**\n * TODO: 描述 ${item.name} 的用途与导出原因。\n */\nmodule.exports = ${item.name};`;
    default:
      return `/**\n * TODO: ${item.name}\n */`;
  }
}

async function main() {
  let md;
  try {
    md = await fs.readFile(MISSING_REPORT, 'utf8');
  } catch {
    console.error('Missing report not found. Run: npm run docs:jsdoc:scan');
    process.exit(1);
  }

  const items = parseMissing(md);

  const out = [];
  out.push(`# JSDoc Stub 模板\n`);
  out.push(`- 生成时间：${new Date().toISOString()}\n`);
  out.push(`- 模板数量：${items.length}\n`);
  out.push(`说明：这些是“可复制粘贴”的注释骨架，建议结合实际逻辑补全参数/返回值/边界条件。\n`);

  // Group by file
  const byFile = new Map();
  for (const it of items) {
    if (!byFile.has(it.file)) byFile.set(it.file, []);
    byFile.get(it.file).push(it);
  }

  for (const [file, arr] of Array.from(byFile.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    out.push(`## ${file}\n`);
    for (const it of arr.sort((a, b) => a.line - b.line)) {
      out.push(`### L${it.line} ${it.kind} \`${it.name}\`\n`);
      out.push('```js');
      out.push(stubFor(it));
      out.push('```\n');
    }
  }

  await fs.writeFile(path.resolve(WORKSPACE, 'docs/api/jsdoc-stubs.md'), out.join('\n'), 'utf8');
  console.log(`Stub generation complete. Output: docs/api/jsdoc-stubs.md`);
}

await main();
