// THE PROJECTION FACT TABLE — the seam a cell uses to ASK for what only projection
// knows, held to three claims it did not have to make before:
//
//   (1) THE BIN NAME IS DERIVED. `FORGE_BIN` is not a constant that agrees with
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
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import type { HarnessMechanism } from '@cratylus/schema/hook';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import { FORGE_BIN, binNameOf } from '../../src/bin-name.js';
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

describe('the build-time CLI name is derived, not declared twice', () => {
  it('reads the single `bin` key out of a manifest it is handed', () => {
    // THE DERIVATION, isolated. If this function ever came to remember a name
    // instead of reading one, every leg over the live corpus would stay green and
    // only this one would move.
    expect(binNameOf({ bin: { 'some-other-name': './x.js' } }, 'fixture')).toBe(
      'some-other-name',
    );
  });

  it('REFUSES a manifest with no bin, and one with two', () => {
    // "The CLI's name" is only a name while there is one of it. Answering with the
    // first key of two would silently pick one, which is how a rename half-lands.
    expect(() => binNameOf({}, 'fixture')).toThrow(/0 `bin` entries/);
    expect(() => binNameOf({ bin: { a: './a', b: './b' } }, 'fixture')).toThrow(
      /2 `bin` entries \(a, b\)/,
    );
    expect(() => binNameOf(null, 'fixture')).toThrow(/fixture/);
  });

  it('FORGE_BIN is this package’s own `bin` key, read from disk', () => {
    // THIS LEG WENT AWAY AND CAME BACK, and the round trip is the lesson. It briefly
    // asserted that forge declares NO bin and takes its name from the hub, because I
    // had convinced myself two manifests declaring one bin name was an install
    // conflict. Measured, it is not: a dependency may declare the same bin, the
    // top-level package's link wins, and npm creates exactly one. The invented
    // constraint cost an env handoff and two vitest configs before it was checked.
    //
    // So a package reads its own name off its own manifest, which is what packages
    // have always done. Read independently here — a second parse, not the module's
    // cached one — so this compares the derivation to its source rather than to
    // itself.
    const manifest = JSON.parse(
      readFileSync(join(repoRoot, 'packages', 'forge', 'package.json'), 'utf8'),
    ) as { bin: Record<string, string> };
    expect(Object.keys(manifest.bin)).toEqual([FORGE_BIN]);
  });

  it('is a DIFFERENT bin from the runtime’s — two programs, two names', () => {
    // Guards the cheapest way for this whole seam to become vacuous: if the two
    // bins were ever the same string, every leg below would pass while the facts
    // carried each other's value.
    expect(FORGE_BIN).not.toBe(RUNTIME_BIN);
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
