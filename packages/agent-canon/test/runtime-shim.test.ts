// RUNTIME-SHIM gate — the BUILD→RUNTIME seam of the projection (S6).
//
// When a skill cell declares `runtime: {capability}`, projectSkills emits, beside
// SKILL.md, a `scripts/<capability>.mjs` THIN SHIM that forwards to the host
// `agent-runtime <capability>` CLI. This gate pins the shim's SHAPE:
//   - it INVOKES `agent-runtime <capability> …` (falsifier: `agent-runtime memory`);
//   - it is NOT a bundled impl — zero `@leclabs/*` imports, no capability logic;
//   - it is emitted EXECUTABLE (0755) so deploy's mode-preserving copy keeps the bit;
//   - a skill WITHOUT `runtime` gets no shim (SKILL.md only — asserted elsewhere).
// This is the reverse of the superseded dep-free-bundle design (skills-refactor T4).

import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Skill } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';
import {
  emitRuntimeShim,
  runtimeShimContent,
} from '../src/toolkit/runtime-shim.js';

describe('runtime thin shim (S6 forge-build-integration)', () => {
  it('invokes `agent-runtime <capability>` and forwards argv', () => {
    const shim = runtimeShimContent('memory');
    // Falsifier: the emitted script drives the host `agent-runtime memory` CLI.
    expect(shim).toContain('agent-runtime');
    expect(shim).toMatch(/spawnSync\('agent-runtime', \['memory',/);
    // Forwards the caller's argv (verb + args ride through untouched).
    expect(shim).toContain('...process.argv.slice(2)');
    // Node shebang — runs under bare `node` on any host.
    expect(shim.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('is a THIN shim — NO bundled impl, NO @leclabs/* import', () => {
    const shim = runtimeShimContent('memory');
    // The reject condition: a fat / dep-free bundle. The shim's only dependency is
    // the `agent-runtime` binary on PATH — never an imported @leclabs package.
    expect(shim).not.toContain('@leclabs/');
    // No compiled-in capability mechanism (the impl lives host-side behind the port).
    expect(shim).not.toMatch(/MemoryStrategy|EventTapHost|require\(/);
    // The sole import is node's own child_process — nothing else.
    const imports = shim.match(/^import .*/gm) ?? [];
    expect(imports).toEqual([
      "import { spawnSync } from 'node:child_process';",
    ]);
  });

  it('emits scripts/<capability>.mjs executable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'runtime-shim-'));
    const dest = emitRuntimeShim(dir, 'memory');
    expect(dest).toBe(join(dir, 'scripts', 'memory.mjs'));
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, 'utf-8')).toBe(runtimeShimContent('memory'));
    // Owner-executable (0755) — the exec bit deploy preserves for scripts/*.
    expect(statSync(dest).mode & 0o111).not.toBe(0);
  });

  it('capability name flows from the anatomy `Skill.runtime` field', () => {
    // The declaration site: a cell selects a runtime capability (S1-aligned name).
    const cell = { runtime: { capability: 'memory' } } as Pick<
      Skill,
      'runtime'
    >;
    expect(cell.runtime?.capability).toBe('memory');
    expect(runtimeShimContent(cell.runtime?.capability ?? '')).toContain(
      "['memory',",
    );
  });
});
