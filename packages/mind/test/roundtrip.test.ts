// T1.1 de-risk spike: prove markdown → TS Fragment → markdown is byte-identical
// on a representative 5-cell slice. The gate is
//   fragmentToMarkdown(<imported fragment module>) === currentCellBody
// where currentCellBody is the cell with its front-matter stripped (exactly what
// the composer inlines). This proves the inversion before migrating ~150 cells.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Fragment } from '@leclabs/koine/anatomy';
import { describe, expect, it } from 'vitest';
import { parseCell } from '../src/toolkit/cell.js';
import { fragmentToMarkdown } from '../src/toolkit/project.js';

// The generated fragment modules (codegen output).
import { humanOnTheLoop } from '../src/organs/address/human-on-the-loop.js';
import { honesty } from '../src/organs/charter/honesty.js';
import { invokeTheCanonical } from '../src/organs/instructions/invoke-the-canonical.js';
import { sage } from '../src/organs/persona/sage.js';
import { nicoArchetypeCyan } from '../src/organs/provenance/nico-archetype-cyan.js';

const mindRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The canonical "cell body" the round-trip targets: the post-front-matter text. */
function currentCellBody(cellRelPath: string): string {
  const raw = readFileSync(join(mindRoot, cellRelPath), 'utf8');
  return parseCell(raw).body;
}

interface Case {
  readonly label: string;
  readonly fragment: Fragment;
  readonly cell: string;
  readonly hasMark: boolean;
}

const cases: readonly Case[] = [
  {
    label: 'address/human-on-the-loop (enum · scalar)',
    fragment: humanOnTheLoop,
    cell: 'address/human-on-the-loop.md',
    hasMark: false,
  },
  {
    label: 'persona/sage (open · scalar · no mark)',
    fragment: sage,
    cell: 'persona/sage.md',
    hasMark: false,
  },
  {
    label: 'provenance/nico-archetype-cyan (open · scalar · WITH 📐·cyan mark)',
    fragment: nicoArchetypeCyan,
    cell: 'provenance/nico-archetype-cyan.md',
    hasMark: true,
  },
  {
    label: 'charter/honesty (coined · set member)',
    fragment: honesty,
    cell: 'charter/honesty.md',
    hasMark: false,
  },
  {
    label: 'instructions/invoke-the-canonical (coined · set member)',
    fragment: invokeTheCanonical,
    cell: 'instructions/invoke-the-canonical.md',
    hasMark: false,
  },
];

describe('T1.1 fragment round-trip (byte-identical)', () => {
  for (const c of cases) {
    it(`${c.label} projects back byte-identical`, () => {
      expect(fragmentToMarkdown(c.fragment)).toBe(currentCellBody(c.cell));
    });
  }

  it('the marked cell parses its mark from the inline definiens', () => {
    expect(nicoArchetypeCyan.mark).toEqual({ emoji: '📐', hue: 'cyan' });
  });

  it('unmarked cells carry no mark', () => {
    for (const c of cases.filter((x) => !x.hasMark)) {
      expect(c.fragment.mark).toBeUndefined();
    }
  });
});
