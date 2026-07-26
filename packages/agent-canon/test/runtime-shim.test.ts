// RUNTIME-SHIM gate — the BUILD→RUNTIME seam of the projection (S6).
//
// When a skill cell declares `runtime: {capability}`, the projection emits, beside
// SKILL.md, a `scripts/<capability>.mjs` THIN SHIM that forwards to the host
// `agent-runtime <capability>` CLI. This gate pins the shim's SHAPE:
//   - it INVOKES `agent-runtime <capability> …` (falsifier: `agent-runtime memory`);
//   - it is NOT a bundled impl — zero `@leclabs/*` imports, no capability logic;
//   - it is emitted EXECUTABLE (0755) so deploy's mode-preserving copy keeps the bit;
//   - a skill WITHOUT `runtime` gets no shim (SKILL.md only — asserted elsewhere).
// This is the reverse of the superseded dep-free-bundle design (skills-refactor T4).
//
// It ALSO pins the shim's SINGLE HOME. There is exactly one emitter,
// `@leclabs/agent-forge/project`; every harness projection rides it. A second copy
// beside a harness CLI is not a variant, it is a fork: the canon fork missed the
// `CLAUDE_CODE_SESSION_ID → AGENT_SESSION_ID` bridge for the whole life of its
// divergence, so every codex-projected skill script ran sessionless, minting a fresh
// id per call and showing the lock machinery a phantom sibling. The identity gate
// below is what makes a re-fork impossible to land quietly: project the SAME cell
// down BOTH harness paths and compare the emitted bytes.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@leclabs/agent-forge/adapters/registry';
import type { Skill } from '@leclabs/agent-forge/anatomy';
import {
  emitRuntimeShim,
  projectPluginSet,
} from '@leclabs/agent-forge/project';
import { beforeAll, describe, expect, it } from 'vitest';
import canonPlugin from '../src/index.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A corpus cell that declares `runtime: {capability:'memory'}` — the shim carrier. */
const CELL = 'wake';
const CAPABILITY = 'memory';

const shimOf = (out: string): string =>
  readFileSync(
    join(out, 'skills', CELL, 'scripts', `${CAPABILITY}.mjs`),
    'utf-8',
  );

/** The emitted shim for `capability`, straight from the single emitter. */
function emitted(capability: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'runtime-shim-'));
  return readFileSync(emitRuntimeShim(dir, capability), 'utf-8');
}

let claudeShim = '';
let codexShim = '';

beforeAll(async () => {
  const base = mkdtempSync(join(tmpdir(), 'runtime-shim-projection-'));
  const claudeOut = join(base, 'claude');
  const codexOut = join(base, 'codex');

  // The CLAUDE path, exactly as `project-cli.ts` drives it.
  await projectPluginSet({
    plugins: [canonPlugin],
    out: claudeOut,
    adapter: adapterByName('claude'),
  });

  // The CODEX path, through its real CLI — the fork's live call site.
  execFileSync(
    join(canonRoot, 'node_modules', '.bin', 'tsx'),
    [
      join(canonRoot, 'src', 'toolkit', 'project-cli-codex.ts'),
      '--out',
      codexOut,
    ],
    { cwd: canonRoot, stdio: 'pipe' },
  );

  claudeShim = shimOf(claudeOut);
  codexShim = shimOf(codexOut);
}, 120_000);

describe('runtime thin shim (S6 forge-build-integration)', () => {
  it('invokes `agent-runtime <capability>` and forwards argv', () => {
    const shim = emitted(CAPABILITY);
    // Falsifier: the emitted script drives the host `agent-runtime memory` CLI.
    expect(shim).toContain('agent-runtime');
    expect(shim).toMatch(/spawnSync\('agent-runtime', \['memory',/);
    // Forwards the caller's argv (verb + args ride through untouched).
    expect(shim).toContain('...process.argv.slice(2)');
    // Node shebang — runs under bare `node` on any host.
    expect(shim.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('is a THIN shim — NO bundled impl, NO @leclabs/* import', () => {
    const shim = emitted(CAPABILITY);
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
    const dest = emitRuntimeShim(dir, CAPABILITY);
    expect(dest).toBe(join(dir, 'scripts', `${CAPABILITY}.mjs`));
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, 'utf-8')).toBe(emitted(CAPABILITY));
    // Owner-executable (0755) — the exec bit deploy preserves for scripts/*.
    expect(statSync(dest).mode & 0o111).not.toBe(0);
  });

  it('capability name flows from the anatomy `Skill.runtime` field', () => {
    // The declaration site: a cell selects a runtime capability (S1-aligned name).
    const cell = { runtime: { capability: CAPABILITY } } as Pick<
      Skill,
      'runtime'
    >;
    expect(cell.runtime?.capability).toBe(CAPABILITY);
    expect(emitted(cell.runtime?.capability ?? '')).toContain("['memory',");
  });
});

describe('runtime shim has ONE home across harnesses', () => {
  it('claude and codex projections emit BYTE-IDENTICAL shims for one cell', () => {
    // The falsifier for a forked emitter: any second copy drifts, and drift shows
    // up here as a byte diff for one and the same capability.
    expect(codexShim).toBe(claudeShim);
  });

  it('every projected shim bridges the harness session id to AGENT_SESSION_ID', () => {
    // The concrete cost of the fork this gate retires: without the bridge the
    // runtime sees no `$AGENT_SESSION_ID`, mints a fresh session per invocation, and
    // the lock/liveness machinery reports a phantom sibling on the next call.
    for (const shim of [claudeShim, codexShim]) {
      expect(shim).toContain('CLAUDE_CODE_SESSION_ID');
      expect(shim).toContain('AGENT_SESSION_ID');
    }
  });

  it('the projected shim IS the single emitter output, verbatim', () => {
    // No harness-local post-processing: what the emitter returns is what lands.
    expect(codexShim).toBe(emitted(CAPABILITY));
  });
});
