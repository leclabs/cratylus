// T1.3 de-risk: prove a DENSE formal-block skill (introspect — DECLARATIONS /
// === / LAWS + symbol-bearing fence + a literal `${…}` hazard) round-trips
// BYTE-IDENTICAL. The byte-anchor is the Python `parse_cell` body:
// `raw.split('---', 2)[2]`. If this holds, the verbatim-body strategy is proven.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { introspect } from '../src/skills/introspect.js';
import { skillToMarkdown } from '../src/toolkit/project.js';

const mindRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The canonical cell body: everything after the second `---` (mirrors parse_cell). */
function canonicalBody(cellRelPath: string): string {
  const raw = readFileSync(join(mindRoot, cellRelPath), 'utf8');
  const first = raw.indexOf('---');
  const second = raw.indexOf('---', first + 3);
  return raw.slice(second + 3);
}

describe('T1.3 skill round-trip (the formal-block de-risk)', () => {
  it('introspect projects back BYTE-IDENTICAL to its current cell body', () => {
    expect(skillToMarkdown(introspect)).toBe(
      canonicalBody('skill/introspect.md'),
    );
  });

  it('introspect carries its typed metadata', () => {
    expect(introspect.trigger).toBe('/introspect');
    expect(introspect.verb).toBe('introspect');
    expect(introspect.composition).toEqual([]); // a standalone self-audit
    expect(introspect.formalBlock).toContain('DECLARATIONS');
    expect(introspect.formalBlock).toContain(
      '=== introspect : (A) → report ===',
    );
  });
});
