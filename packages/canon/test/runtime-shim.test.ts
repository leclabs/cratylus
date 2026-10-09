// RUNTIME-SHIM gate — the BUILD→RUNTIME seam of OMP projection.
//
// When a skill cell declares `runtime: {capability}`, projection emits a thin
// `scripts/<capability>.mjs` shim forwarding to `cratylus <capability>`. This gate
// pins the shim's shape and executable mode using the surviving eventTap capability.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitRuntimeShim } from '@cratylus/forge/project';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { Skill } from '@cratylus/schema';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { beforeAll, describe, expect, it } from 'vitest';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** A corpus cell that declares a `runtime` capability — a shim carrier, and the
 *  witness this gate reads. Any carrier would serve; `event-tap` is the one pinned. */
const CELL = 'event-tap';
const CAPABILITY = 'eventTap';

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

let ompShim = '';

/** Resolve the shipped CLI entry from the CLI package's declared bin. */
function buildCli(): string {
  const pkgPath = join(canonRoot, '..', 'cli', 'package.json');
  const manifest = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    name: string;
    bin: Record<string, string>;
  };
  // Select the BUILD command by name — the hub ships two, and taking index 0 would
  // be a coin flip between `cratylus` and `cratylus`.
  const entry = manifest.bin[manifest.name] as string;
  return join(canonRoot, '..', 'cli', entry);
}

beforeAll(async () => {
  const ompOut = join(
    mkdtempSync(join(tmpdir(), 'runtime-shim-projection-')),
    'omp',
  );
  execFileSync(
    process.execPath,
    [
      buildCli(),
      'project',
      '--harness',
      'omp',
      '--config',
      join(requireRepoRoot(canonRoot), 'cratylus.config.ts'),
      '--out',
      ompOut,
    ],
    { cwd: canonRoot, stdio: 'pipe' },
  );

  ompShim = shimOf(ompOut);
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
