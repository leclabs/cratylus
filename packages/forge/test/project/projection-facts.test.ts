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
//   (2) THE TABLE IS ADAPTER-RELATIVE. Two facts are functions of the harness, and
//       that is the whole repair for a worker that had to guess which deployment
//       was its own. Asserting the values is not enough — a table that returned
//       claude's pair for both harnesses would satisfy any single-adapter leg — so
//       the two tables are DIFFED and the difference is asserted to be exactly the
//       harness-relative members.
//
//   (3) THE ADAPTER REACHES THE BYTES. A correct table wired to nothing is the
//       failure this suite would otherwise miss entirely: `projectPluginSet` has
//       TWO `resolveWorker` call sites (a hook cell's workers, and an enforcing
//       mechanism's), and the code comment at the second says "both sites, or
//       neither". Both are projected here, under both adapters, and the emitted
//       bytes are read back.
//
// A FIXTURE PLUGIN, NOT THE CORPUS. The property is the projector's; rendering the
// canon to prove it would make this suite pay for the corpus's size and would fail
// for reasons that have nothing to do with the seam.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { HarnessMechanism } from '@cratylus/schema/hook';
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
  // Borrowed from the degradation fixture: it composes an enforcing value, which
  // is what makes the projector reach its SECOND `resolveWorker` site at all.
  agents: join(here, 'fixtures-enforcing', 'agents'),
};

/** An enforcing mechanism whose worker names a harness fact — the SECOND of the
 *  projector's two resolution sites, which no other fixture reaches. */
const MECHANISMS = new Map<string, HarnessMechanism>([
  [
    'fixture-warden',
    {
      command: 'sh fixture-warden.sh',
      workers: [
        {
          filename: 'worker.sh',
          targetPath: 'hooks/fixture-warden/worker.sh',
          content:
            '#!/bin/sh\nHOOKS_FILE={{fact:harness-hooks-file}}\nexit 0\n',
          executable: true,
        },
      ],
    },
  ],
]);

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
    for (const pkg of ['forge', 'runtime', 'memory', 'schema', 'canon']) {
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

// ── (2) the table is a function OF the adapter ──────────────────────────────────

describe('projectionFacts is adapter-relative', () => {
  const claude = projectionFacts(adapterByName('claude'));
  const codex = projectionFacts(adapterByName('codex'));

  it('binds every fact the schema declares', () => {
    // `ProjectionFact` is a closed set of NAMES; this table is the only place they
    // acquire values. A member added to the union and forgotten here throws at
    // resolve time on a host, which is the class of defect the seam exists to move
    // to build time — so the key set is asserted, not spot-checked.
    expect(Object.keys(claude).sort()).toEqual([
      'deploy-bin',
      'deploy-check-drift-code',
      'harness-hooks-file',
      'harness-name',
      'runtime-bin',
    ]);
    expect(Object.values(claude).every((v) => v.length > 0)).toBe(true);
  });

  it('the two harnesses differ in EXACTLY the harness-relative facts', () => {
    // The convicting shape. A table that ignored its argument would produce an
    // empty diff; one that made the wrong facts adapter-relative would produce a
    // different one. Both are red here.
    const differing = Object.keys(claude)
      .filter(
        (k) =>
          claude[k as keyof typeof claude] !== codex[k as keyof typeof codex],
      )
      .sort();
    expect(differing).toEqual(['harness-hooks-file', 'harness-name']);
  });

  it('carries each adapter’s own name and hooks file', () => {
    expect(claude['harness-name']).toBe('claude');
    expect(claude['harness-hooks-file']).toBe('settings.json');
    expect(codex['harness-name']).toBe('codex');
    expect(codex['harness-hooks-file']).toBe('hooks.json');
  });

  it('carries the drift exit code as the string a shell compares', () => {
    // The number leaves the language here. It must be the code `deploy --check`
    // actually returns for drift — `check.test.ts` pins that end — and it must be
    // distinguishable from the other two, or a worker reading it cannot classify.
    expect(claude['deploy-check-drift-code']).toBe(
      String(DEPLOY_CHECK_EXIT.drift),
    );
    expect(
      new Set(Object.values(DEPLOY_CHECK_EXIT)).size,
      'the three exit codes must be three',
    ).toBe(3);
  });
});

// ── (3) the adapter reaches the emitted bytes, at BOTH resolution sites ─────────

async function projectFixture(harness: string) {
  const tree = await projectPluginSet({
    plugins: [plugin],
    adapter: adapterByName(harness),
    mechanisms: MECHANISMS,
    warn: () => {},
  });
  const at = (path: string): string =>
    tree.files.find((f) => f.path === path)?.content ?? '';
  return { tree, probe: at('hooks/fact-probe/probe.sh') };
}

/** Read a `KEY=value` declaration back out of an emitted worker. */
const declared = (sh: string, key: string): string | undefined =>
  sh.match(new RegExp(`^${key}=(\\S+)$`, 'm'))?.[1];

describe('the projector hands its adapter to the worker templates', () => {
  it('resolves a hook cell’s workers against the harness being rendered', async () => {
    const claude = await projectFixture('claude');
    const codex = await projectFixture('codex');
    expect(claude.probe, 'no probe worker was emitted').not.toBe('');
    expect(codex.probe, 'no probe worker was emitted').not.toBe('');

    // The SAME cell, two harnesses, two answers — captured off the bytes rather
    // than asserted about the table, because the bytes are what lands on a host.
    expect(declared(claude.probe, 'HARNESS')).toBe('claude');
    expect(declared(claude.probe, 'HARNESS_HOOKS_FILE')).toBe('settings.json');
    expect(declared(codex.probe, 'HARNESS')).toBe('codex');
    expect(declared(codex.probe, 'HARNESS_HOOKS_FILE')).toBe('hooks.json');
    expect(codex.probe).not.toBe(claude.probe);
  });

  it('resolves an ENFORCING mechanism’s workers the same way', async () => {
    // The second call site. It shipped a `{{fact:…}}` to a host once already by
    // being the one of two that had not been converted; a fact that is adapter-
    // relative gives it a new way to be silently wrong (right value, wrong
    // harness), so it is read back rather than assumed to follow the first.
    const worker = (t: Awaited<ReturnType<typeof projectFixture>>): string =>
      t.tree.files.find((f) => f.path === 'hooks/fixture-warden/worker.sh')
        ?.content ?? '';
    const claude = worker(await projectFixture('claude'));
    expect(declared(claude, 'HOOKS_FILE')).toBe('settings.json');
  });

  it('emits no unresolved placeholder on either harness', async () => {
    for (const harness of ['claude', 'codex']) {
      const { tree } = await projectFixture(harness);
      for (const f of tree.files) {
        expect(
          f.content.includes('{{'),
          `${harness}: ${f.path} ships an unresolved placeholder`,
        ).toBe(false);
      }
    }
  });
});
