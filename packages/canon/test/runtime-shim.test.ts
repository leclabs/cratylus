// RUNTIME-SHIM gate — the BUILD→RUNTIME seam of OMP projection.
//
// When a skill cell declares `runtime: {capability}`, projection emits a thin
// `scripts/<capability>.mjs` shim forwarding to `cratylus <capability>`. This gate
// pins the shim's shape and executable mode, read from a real projection of canon
// with the shim-carrier fixture, whose cell declares `versionSkew`.

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { emitRuntimeShim, projectPluginSet } from '@cratylus/forge/project';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { Skill } from '@cratylus/schema';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import canon from '../src/index.js';
import carrier from './fixtures/shim-carrier/plugin.js';

/** A cell that declares a `runtime` capability — a shim carrier, and the witness
 *  this gate reads. No canon cell declares one, so the shim-carrier fixture's. */
const CELL = 'carrier';
const CAPABILITY = 'versionSkew';

const scratch: string[] = [];
function tmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  scratch.push(d);
  return d;
}
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

/** The emitted shim for `capability`, straight from the single emitter. */
function emitted(capability: string): string {
  const dir = tmp('runtime-shim-');
  return readFileSync(emitRuntimeShim(dir, capability), 'utf-8');
}

let ompShim = '';

beforeAll(async () => {
  const tree = await projectPluginSet({
    plugins: [canon, carrier],
    adapter: adapterByName('omp'),
    warn: () => {},
  });
  ompShim =
    tree.files.find(
      (f) => f.path === `skills/${CELL}/scripts/${CAPABILITY}.mjs`,
    )?.content ?? '';
}, 120_000);

describe('runtime thin shim (S6 forge-build-integration)', () => {
  it('invokes `<CLI_BIN> <capability>` and forwards argv', () => {
    const shim = emitted(CAPABILITY);
    // Falsifier: the emitted script drives the host `<CLI_BIN> <capability>` CLI.
    // The name rides the constant (its one home) so a rebrand stays one symbol.
    expect(shim).toContain(CLI_BIN);
    expect(shim).toMatch(
      new RegExp(`spawnSync\\('${CLI_BIN}', \\['${CAPABILITY}',`),
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
    expect(shim).not.toMatch(/MemoryStrategy|dispatchWorkPackage|require\(/);
    // The sole import is node's own child_process — nothing else.
    const imports = shim.match(/^import .*/gm) ?? [];
    expect(imports).toEqual([
      "import { spawnSync } from 'node:child_process';",
    ]);
  });

  it('emits scripts/<capability>.mjs executable', () => {
    const dir = tmp('runtime-shim-');
    const dest = emitRuntimeShim(dir, CAPABILITY);
    expect(dest).toBe(join(dir, 'scripts', `${CAPABILITY}.mjs`));
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, 'utf-8')).toBe(emitted(CAPABILITY));
    // Owner-executable (0755) — the exec bit install preserves for scripts/*.
    expect(statSync(dest).mode & 0o111).not.toBe(0);
  });

  it('capability name flows from the manifest `Skill.runtime` field', () => {
    // The declaration site: a cell selects a runtime capability (S1-aligned name).
    const cell = { runtime: { capability: CAPABILITY } } as Pick<
      Skill,
      'runtime'
    >;
    expect(cell.runtime?.capability).toBe(CAPABILITY);
    expect(emitted(cell.runtime?.capability ?? '')).toContain(
      `['${CAPABILITY}',`,
    );
  });
});

describe('runtime shim is emitted for OMP', () => {
  it('the projected shim IS the single emitter output, verbatim', () => {
    expect(ompShim).toBe(emitted(CAPABILITY));
  });
});
