// THE PROJECTION FACT TABLE — the seam a cell uses to ASK for what only projection
// knows, held to three claims it did not have to make before:
//
//   (1) THE BIN NAME IS DERIVED. `CLI_BIN` is not a constant that agrees with
//       `package.json`'s `bin` key; it is READ from it. That is a stronger claim
//       than the runtime bin's (which is a constant plus a gate holding it against
//       its manifest), and it is worth a fixture because a derivation over the live
//       corpus is green whether it derives or remembers. `binNameOf` is fed
//       synthetic manifests here, so remembering would be red.
//
//   (2) THE TABLE IS ADAPTER-RELATIVE. OMP is the sole deployment target, so
//       the table is asserted against OMP's concrete facts.
//
//   (3) OMP REACHES THE BYTES. A correct table wired to nothing is the failure
//       this suite would otherwise miss: hook workers are rendered with OMP's facts.
//
// A FIXTURE PLUGIN, NOT THE CORPUS. The property is the projector's; rendering the
// canon to prove it would make this suite pay for the corpus's size and would fail
// for reasons that have nothing to do with the seam.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import { DEPLOY_CHECK_EXIT } from '../../src/deploy/check-exit.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
  projectionFacts,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = requireRepoRoot(here);

const plugin: ProjectablePlugin = {
  name: 'fixture-facts',
  manifest: FIXTURE_MANIFEST,
  hooks: join(here, 'fixtures-facts', 'hooks'),
};
// ── (1) the bin name is DERIVED from the key npm reads ──────────────────────────

describe('the command name has exactly one home, and there is one command', () => {
  // THIS BLOCK ASSERTED A WORLD THAT NO LONGER EXISTS, and the shape of what it
  // asserted is the record worth keeping. It checked that forge DERIVED its name by
  // reading its own `bin` key, and that the build bin was "a DIFFERENT bin from the
  // runtime's — two programs, two names".
  //
  // There is one program now. `cratylus-run` existed only because the build-time and
  // run-time surfaces lived in two packages and each built its own `cac`; merging
  // them made the second name a lie, and a derivation from a manifest key made
  // forge — now a library with no bin — read a key it does not have.
  //
  // So the name is a plain constant in `@cratylus/runtime`, the contract leaf that
  // depends on nothing, and every package imports it without inverting an edge. No
  // derivation, no handoff, no second spelling to keep in agreement.
  it('CLI_BIN is declared once, in the package that depends on nothing', () => {
    const declared = readFileSync(
      join(repoRoot, 'packages', 'runtime', 'src', 'bin-name.ts'),
      'utf8',
    );
    expect(declared).toMatch(/export const CLI_BIN = '[a-z][a-z0-9-]*';/);
    // and the value forge re-exports is that same one — a re-export, not a copy
    const reexport = readFileSync(
      join(repoRoot, 'packages', 'forge', 'src', 'bin-name.ts'),
      'utf8',
    );
    expect(reexport).toContain(
      "export { CLI_BIN } from '@cratylus/runtime/bin-name'",
    );
    expect(reexport).not.toMatch(/CLI_BIN\s*=/);
  });

  it('the bin key the package manager reads matches the constant', () => {
    // The one copy no compiler can reach. `packages/cli` owns the `bin`; if a rename
    // flips the constant and not this key, the installed executable and everything
    // that spawns it disagree, and nothing but this assertion notices.
    const manifest = JSON.parse(
      readFileSync(join(repoRoot, 'packages', 'cli', 'package.json'), 'utf8'),
    ) as { bin: Record<string, string> };
    expect(Object.keys(manifest.bin)).toEqual([CLI_BIN]);
  });

  it('no other package declares a bin — one command, one home', () => {
    for (const pkg of ['forge', 'runtime', 'schema', 'canon']) {
      const m = JSON.parse(
        readFileSync(join(repoRoot, 'packages', pkg, 'package.json'), 'utf8'),
      ) as { bin?: unknown };
      expect(
        m.bin,
        `${pkg} is a library and may not declare a bin`,
      ).toBeUndefined();
    }
  });
});

// ── (2) the table describes OMP's facts ─────────────────────────────────────────

describe('projectionFacts describes OMP', () => {
  const omp = projectionFacts(adapterByName('omp'));

  it('binds every fact the schema declares', () => {
    expect(Object.keys(omp).sort()).toEqual([
      'deploy-bin',
      'deploy-check-drift-code',
      'harness-hooks-file',
      'harness-name',
      'runtime-bin',
    ]);
    expect(Object.values(omp).every((value) => value.length > 0)).toBe(true);
  });

  it('carries OMP’s name and hooks file', () => {
    expect(omp['harness-name']).toBe('omp');
    expect(omp['harness-hooks-file']).toBe(adapterByName('omp').hooksFile);
  });
  it('carries the drift exit code as the string a shell compares', () => {
    expect(omp['deploy-check-drift-code']).toBe(
      String(DEPLOY_CHECK_EXIT.drift),
    );
    expect(new Set(Object.values(DEPLOY_CHECK_EXIT)).size).toBe(3);
  });
});

// ── (3) OMP reaches the emitted bytes ───────────────────────────────────────────

async function projectFixture() {
  const tree = await projectPluginSet({
    plugins: [plugin],
    adapter: adapterByName('omp'),
    warn: () => {},
  });
  const at = (path: string): string =>
    tree.files.find((f) => f.path === path)?.content ?? '';
  return { tree, probe: at('hooks/fact-probe/probe.sh') };
}

/** Read a `KEY=value` declaration back out of an emitted worker. */
const declared = (sh: string, key: string): string | undefined =>
  sh.match(new RegExp(`^${key}=(\\S+)$`, 'm'))?.[1];

describe('the OMP projector hands facts to worker templates', () => {
  it('resolves a hook cell’s workers against OMP', async () => {
    const { probe } = await projectFixture();
    expect(probe, 'no probe worker was emitted').not.toBe('');
    expect(declared(probe, 'HARNESS')).toBe('omp');
    expect(declared(probe, 'HARNESS_HOOKS_FILE')).toBe(
      adapterByName('omp').hooksFile,
    );
  });

  it('emits no unresolved fact placeholder', async () => {
    const { tree } = await projectFixture();
    for (const f of tree.files) {
      expect(
        f.content.includes('{{'),
        `${f.path} ships an unresolved placeholder`,
      ).toBe(false);
    }
  });
});
