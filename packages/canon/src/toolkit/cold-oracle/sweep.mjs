#!/usr/bin/env node
// T3 sweep helper: extract a fragment's meaning-bearing field, run the cold oracle,
// print {ref, decode-head}. Pure orchestration around ./cold-oracle.sh (isolated).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ORACLE = new URL('./cold-oracle.sh', import.meta.url).pathname;
const refs = process.argv.slice(2); // paths relative to canon/

// extract a named field's TS template-literal value, honoring ESCAPED backticks
// (skill descriptions contain \` around inline symbols like α(c) / C_R — a naive
// first-backtick scan truncates them mid-sentence). Returns the value with \`→`.
function field(src, name) {
  const i = src.indexOf(`${name}:`);
  if (i < 0) return null;
  // THE DELIMITER IS WHICHEVER COMES FIRST. This used to look for a backtick only, so a
  // single-quoted value was skipped and the scan ran on to capture the NEXT backticked
  // field entirely — a wrong answer that looked like a right one. Rule cells are the case:
  // `residue: 'â€¦'`.
  const quotes = ['`', "'", '"'];
  let start = -1;
  let quote = '';
  for (const q of quotes) {
    const at = src.indexOf(q, i);
    if (at >= 0 && (start < 0 || at < start)) {
      start = at;
      quote = q;
    }
  }
  if (start < 0) return null;
  let end = start + 1;
  while (end < src.length) {
    if (src[end] === '\\') {
      end += 2;
      continue;
    } // skip escaped char
    if (src[end] === quote) break; // unescaped close
    end++;
  }
  return src
    .slice(start + 1, end)
    .replace(new RegExp(`\\\\\\${quote}`, 'g'), quote)
    .replace(/\\\\/g, '\\');
}

for (const ref of refs) {
  const src = readFileSync(ref, 'utf8');
  // `RuleCell.definiens` became `residue` (2026-08-05, `t-definiens-vs-residue`), so a
  // rule cell answers to the second name now. Both are read because a HookCell has always
  // used `residue` and the sweep spans every cell kind.
  const text =
    field(src, 'definiens') ??
    field(src, 'residue') ??
    field(src, 'description');
  if (!text) {
    console.log(`\n##### ${ref}\n(no definiens/residue/description found)`);
    continue;
  }
  let decode = '';
  try {
    decode = execFileSync('bash', [ORACLE, '--raw', '--text', text], {
      encoding: 'utf8',
      maxBuffer: 1 << 20,
    });
  } catch (e) {
    decode = `ORACLE-ERROR: ${e.message}`;
  }
  console.log(`\n##### ${ref}\n${decode.trim().slice(0, 800)}`);
}
