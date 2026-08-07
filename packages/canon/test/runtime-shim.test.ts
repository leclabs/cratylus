// RUNTIME-SHIM gate — the BUILD→RUNTIME seam of the projection.
//
// When a skill cell declares `runtime: {capability}`, the projection emits, beside
// SKILL.md, a `scripts/<capability>.mjs` THIN SHIM that forwards to the host
// `cratylus-run <capability>` CLI. This gate pins the shim's SHAPE:
//   - it INVOKES `cratylus-run <capability> …` (falsifier: `cratylus-run memory`);
//   - it is NOT a bundled impl — zero `@cratylus/*` imports, no capability logic;
//   - it is emitted EXECUTABLE (0755) so deploy's mode-preserving copy keeps the bit;
//   - a skill WITHOUT `runtime` gets no shim (SKILL.md only — asserted elsewhere).
// THIS IS THE REVERSE OF THE DESIGN IT REPLACED. The superseded plan was to give
// canon a tsup build that COMPOSED a skill's TS domain module ⊕ the target
// harness's adapter impl into ONE dependency-free standalone `.mjs`, emitted at
// projection into `skills/<name>/scripts/` — self-contained so it would run under
// bare `node` with no `node_modules`. A ~15-line `spawnSync` shim meets that same
// acceptance and strictly dominates it: the capability logic stays in the runtime
// host, one copy, versioned with the host rather than frozen into every projected
// artifact. No tsup build was ever added to canon, and none is wanted.
//
// It ALSO pins the shim's SINGLE HOME. There is exactly one emitter,
// `@cratylus/forge/project`; every harness projection rides it. A second copy
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
import { adapterByName } from '@cratylus/forge/adapters/registry';
import {
  emitRuntimeShim,
  projectPluginSet,
  writeRenderTree,
} from '@cratylus/forge/project';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import type { Skill } from '@cratylus/schema';
import { requireRepoRoot } from '@repo/tooling/repo-root';
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

/**
 * The shipped build-time CLI's entry, resolved from forge's OWN manifest.
 *
 * NOT `node_modules/.bin/cratylus`, and the difference is a real defect this gate
 * used to have. pnpm creates a workspace bin symlink only if the TARGET FILE
 * EXISTS AT INSTALL TIME — proven by an A/B on a clean tree: with `dist/` present
 * the link appears, with `dist/` absent it silently does not. A genuine cold clone
 * runs checkout -> install -> build -> test, so at install time `dist/` has never
 * been built and the link is never created. This suite passed only because nobody
 * had ever run it on a tree that cold; the first CI run would have been red.
 *
 * Reading `bin` out of the manifest keeps ONE home for the entry path — the same
 * key npm itself reads — and makes the gate independent of install ORDER while
 * still driving the shipped command rather than a private code path.
 */
function buildCli(): string {
  // THE COMMAND SHIPS FROM THE HUB, not from `forge`. Forge is a library and
  // declares no bin at all now, so reading its manifest for one yields `undefined`
  // — which is how this gate found the move rather than silently driving a private
  // code path. Same derivation, same single home, different manifest.
  const pkgPath = join(canonRoot, '..', 'cli', 'package.json');
  const manifest = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    name: string;
    bin: Record<string, string>;
  };
  // Select the BUILD command by name — the hub ships two, and taking index 0 would
  // be a coin flip between `cratylus` and `cratylus-run`.
  const entry = manifest.bin[manifest.name] as string;
  return join(canonRoot, '..', 'cli', entry);
}

beforeAll(async () => {
  const base = mkdtempSync(join(tmpdir(), 'runtime-shim-projection-'));
  const claudeOut = join(base, 'claude');
  const codexOut = join(base, 'codex');

  // The CLAUDE path, driven straight off the projector API.
  // V7 made the projector RETURN the artifact tree; the caller is the one writer.
  const claudeReport = await projectPluginSet({
    plugins: [canonPlugin],
    adapter: adapterByName('claude'),
  });
  writeRenderTree(claudeOut, claudeReport.files);

  // The CODEX path, through its real CLI — the fork's live call site. That call site
  // is now the SHIPPED command: `cratylus project --harness codex`, reading the
  // repository's own `cratylus.config.ts`. Driving the private `project-cli-codex.ts`
  // here was what let the fork exist at all; there is no private codex CLI to drive.
  execFileSync(
    process.execPath,
    [
      buildCli(),
      'project',
      '--harness',
      'codex',
      '--config',
      join(requireRepoRoot(canonRoot), 'cratylus.config.ts'),
      '--out',
      codexOut,
    ],
    { cwd: canonRoot, stdio: 'pipe' },
  );

  claudeShim = shimOf(claudeOut);
  codexShim = shimOf(codexOut);
}, 120_000);

describe('runtime thin shim (S6 forge-build-integration)', () => {
  it('invokes `<RUNTIME_BIN> <capability>` and forwards argv', () => {
    const shim = emitted(CAPABILITY);
    // Falsifier: the emitted script drives the host `<RUNTIME_BIN> memory` CLI.
    // The name rides the constant (its one home) so a rebrand stays one symbol.
    expect(shim).toContain(RUNTIME_BIN);
    expect(shim).toMatch(
      new RegExp(`spawnSync\\('${RUNTIME_BIN}', \\['memory',`),
    );
    // Forwards the caller's argv (verb + args ride through untouched).
    expect(shim).toContain('...process.argv.slice(2)');
    // Node shebang — runs under bare `node` on any host.
    expect(shim.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('is a THIN shim — NO bundled impl, NO @cratylus/* import', () => {
    const shim = emitted(CAPABILITY);
    // The reject condition: a fat / dep-free bundle. The shim's only dependency is
    // the runtime binary on PATH — never an imported @cratylus package.
    expect(shim).not.toContain('@cratylus/');
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

  it('capability name flows from the manifest `Skill.runtime` field', () => {
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
