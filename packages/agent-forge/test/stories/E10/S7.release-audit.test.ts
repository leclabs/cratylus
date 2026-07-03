/**
 * E10.S7 · roster release-audit ritual.
 * Ground truth: RETURN-1 §0 (4 renames/sunsets in 6 months) → a standing,
 * dated re-verification checklist must exist in plans/interop-hardening/ or
 * docs/: per-adapter rows, every §2-flagged UNVERIFIED item exactly once
 * ([CX1][OC2][WS7][CT2]), and the E7.S10 tripwire row. Read-only scan.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { ALL_ADAPTERS, story } from '../helpers.js';

const REPO_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '..',
);

const UNVERIFIED_ITEMS = ['[CX1]', '[OC2]', '[WS7]', '[CT2]'] as const;

function* walkMarkdown(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries.sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry !== 'node_modules' && !entry.startsWith('.')) {
        yield* walkMarkdown(p);
      }
    } else if (entry.endsWith('.md')) {
      yield p;
    }
  }
}

function countOccurrences(text: string, needle: string): number {
  let count = 0;
  let idx = text.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = text.indexOf(needle, idx + needle.length);
  }
  return count;
}

/** The checklist contract, per the story's observable. */
function isReleaseAuditChecklist(text: string): boolean {
  const dated = /20\d{2}-\d{2}-\d{2}/.test(text);
  const everyAdapterHasRow = ALL_ADAPTERS.every((a) =>
    new RegExp(`^\\|[^\\n]*\\b${a.id}\\b`, 'm').test(text),
  );
  const unverifiedExactlyOnce = UNVERIFIED_ITEMS.every(
    (item) => countOccurrences(text, item) === 1,
  );
  const tripwireRow = text.includes('E7.S10');
  return dated && everyAdapterHasRow && unverifiedExactlyOnce && tripwireRow;
}

describe('E10.S7 · release-audit checklist', () => {
  story(
    'E10.S7',
    'a dated release-audit checklist doc exists with per-adapter rows, each UNVERIFIED item exactly once, and the E7.S10 tripwire',
    () => {
      const candidates: string[] = [];
      for (const dir of [
        join(REPO_ROOT, 'plans', 'interop-hardening'),
        join(REPO_ROOT, 'docs'),
      ]) {
        for (const file of walkMarkdown(dir)) {
          const text = readFileSync(file, 'utf8');
          if (isReleaseAuditChecklist(text)) candidates.push(file);
        }
      }
      expect(candidates.length).toBeGreaterThan(0);
    },
  );
});
