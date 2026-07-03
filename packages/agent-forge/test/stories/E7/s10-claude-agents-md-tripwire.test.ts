/**
 * E7.S10 — Claude-Code-adopts-AGENTS.md tripwire (caution iv).
 * The claude adapter's "CLAUDE.md-not-AGENTS.md" premise carried as an
 * assertable CI fact: Claude Code reads CLAUDE.md [S7], its changelog shows
 * zero AGENTS.md entries through 2026-07 [S62], and native AGENTS.md is the
 * most-upvoted open request (anthropics/claude-code#31005) [S49]. The day
 * Claude Code ships native AGENTS.md, flipping this test is the one-line
 * change with a known blast radius.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect } from 'vitest';
import { type IR, compile } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { manifest, orderedRules, walkFiles } from './fixtures.js';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** polis repo root, resolved from this test file's location. */
const REPO_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  '..',
);

describe('E7.S10 · Claude-adopts-AGENTS.md tripwire', () => {
  story(
    'E7.S10',
    'premise carrier: the claude adapter writes CLAUDE.md and does NOT write AGENTS.md [S7][S62][S49]',
    async () => {
      const cwd = makeTmpDir();
      dirs.push(cwd);
      const claude = adapterById.get('claude');
      if (!claude) throw new Error('claude adapter missing');
      const ir: IR = { manifest: manifest(['claude']), rules: orderedRules() };
      const report = await compile(ir, [claude], 'project', cwd);
      expect(report.results.filter((r) => r.error)).toEqual([]);

      expect(existsSync(join(cwd, 'CLAUDE.md'))).toBe(true);
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(false);
    },
  );

  story.tracked(
    'E7.S10',
    'the pinned assumption record exists in the project vault (docs/), naming issue #31005 [S49] with [S7][S62]',
    () => {
      // The record's documented home is the project vault: repo docs/ (ADR
      // rationale and assumption records live there per root AGENTS.md).
      const docsDir = join(REPO_ROOT, 'docs');
      expect(existsSync(docsDir)).toBe(true);

      const matches = walkFiles(docsDir).filter((f) => {
        if (!f.endsWith('.md')) return false;
        const text = readFileSync(join(docsDir, f), 'utf8');
        return /31005|\[S49\]/.test(text) && /AGENTS\.md/.test(text);
      });
      // Documented truth: an explicit tested-assumption record exists (a
      // fixture/doc pair). No such record has been written yet.
      expect(
        matches.length,
        `assumption record under ${docsDir}`,
      ).toBeGreaterThan(0);
    },
  );
});
