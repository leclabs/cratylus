// ─────────────────────────────────────────────────────────────────────────────
// THE RESOLVER/PROJECTOR DIFFERENTIAL — do the two pipelines agree on a fragment?
//
// Two pipelines read one plugin set and never met:
//   · `resolve()` folds the plugin `fragments` dirs (extends order, then consumer
//     `patches`) into `ResolvedAgentSet.fragments` — reached only via
//     `composeFromFile`, whose consumers (`compose`, `explain`) both PRINT.
//   · `projectPluginSet` scans the `agents`/`skills`/`hooks` dirs and renders
//     bytes — and an agent module inlines its dimension values BY IMPORT BINDING
//     (`objective: insight_objective`), i.e. the body as it sat on disk.
//
// MEASURED, not argued. Before the fix this suite's second case failed: the fold
// moved `objective` to the patched value and `agents/parity.md` still carried the
// authored one. That is `COMPOSED(a) : ∀on: S_on ⊆ catalog(on)` broken — the
// agent's selection stops being a subset of the resolved catalog the instant the
// catalog is folded — and with it ENGINE:22 `compose(select(a)) = ir(a)`.
//
// THE QUIET PART. A plugin ORIGINATES each of its fragments with a single
// `replace(body)`, so absent patches THE FOLD IS THE IDENTITY. That is why every
// suite was green over a broken pipe: the two paths cannot disagree until
// something moves a fragment, and only `patches` moves one. The first case below
// pins that identity so the agreement is a proved property rather than a
// coincidence; the second pins the pipe that carries a move.
// ─────────────────────────────────────────────────────────────────────────────

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import {
  AmbiguousFragmentBodyError,
  type ProjectablePlugin,
  discoverFragments,
  projectPluginSet,
  resolveFragmentBodies,
} from '../../src/project/index.js';
import type { PatchEntry } from '../../src/resolve/resolve.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** The fragment body as authored on disk — what the agent module imports. */
const AUTHORED = 'insight ⟨probe · authored⟩';
/** What a consumer `patches` entry folds that fragment to. */
const PATCHED = 'insight ⟨probe · patched⟩';

const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

type FragmentPlugin = ProjectablePlugin & { readonly fragments: string };

/**
 * A one-fragment, one-agent plugin on disk. The agent IMPORTS the fragment binding
 * — the canon shape verbatim — which is exactly why the projector sees the authored
 * string and not a catalog key.
 */
function fixturePlugin(name = 'probe'): FragmentPlugin {
  const root = mkdtempSync(join(tmpdir(), 'v8-resolver-parity-'));
  roots.push(root);
  const fragments = join(root, 'frags');
  const agents = join(root, 'agents');
  mkdirSync(join(fragments, 'objective'), { recursive: true });
  mkdirSync(agents, { recursive: true });

  writeFileSync(
    join(fragments, 'objective', 'probe-objective.ts'),
    `export const probeObjective = ${JSON.stringify(AUTHORED)};\n`,
    'utf8',
  );

  const nulls = [
    'autonomy',
    'role',
    'formality',
    'audienceAdaptation',
    'transparency',
    'provenance',
    'guardrails',
    'engineeringPrinciples',
    'heuristics',
    'capabilities',
    'learning',
    'situationAwareness',
    'actions',
    'modalities',
    'model',
    'memory',
    'trigger',
    'framing',
    'reasoningStrategy',
    'satisficing',
    'outputFormat',
    'selfEvaluation',
  ]
    .map((k) => `  ${k}: null,`)
    .join('\n');

  writeFileSync(
    join(agents, 'parity.ts'),
    [
      `import { probeObjective } from '../frags/objective/probe-objective.ts';`,
      'export const parity = {',
      `  name: 'parity',`,
      `  description: 'fixture agent for the resolver/projector differential',`,
      `  archetype: 'parity probe',`,
      '  objective: probeObjective,',
      nulls,
      '};',
      '',
    ].join('\n'),
    'utf8',
  );

  return { name, manifest: FIXTURE_MANIFEST, fragments, agents };
}

/** The projected SOUL of the fixture agent, under a given fold. */
async function soulOf(
  plugin: ProjectablePlugin,
  resolvedBodies?: ReadonlyMap<string, string>,
): Promise<string> {
  const tree = await projectPluginSet({
    plugins: [plugin],
    adapter: adapterByName('claude'),
    ...(resolvedBodies ? { resolvedBodies } : {}),
  });
  const soul = tree.files.find((f) => f.path === 'agents/parity.md');
  if (!soul) throw new Error('fixture: no agents/parity.md projected');
  return soul.content;
}

describe('resolver ⇄ projector parity', () => {
  it('folds to the identity when nothing patches — why the two paths agreed', async () => {
    const plugin = fixturePlugin();
    const discovered = await discoverFragments([plugin]);
    expect(discovered.size).toBe(1);
    expect(discovered.get('probe')).toHaveLength(1);

    // A plugin originates each fragment with one `replace(body)`, so no body moves
    // and the substitution is EMPTY. This is the whole reason a broken pipe stayed
    // invisible — assert it, so a future fold that is NOT the identity gets caught.
    const resolved = resolveFragmentBodies(discovered, []);
    expect(resolved.size).toBe(0);

    expect(await soulOf(plugin, resolved)).toContain(AUTHORED);
  });

  it('projects the RESOLVED body, not the authored one, when a patch moves it', async () => {
    const plugin = fixturePlugin();

    // Address the node by OBJECT IDENTITY, off the same discovery the projector
    // folds (NORTH-STAR §3). This is why discovery and fold are separate calls: a
    // string fragment's node is minted at scan time, so a fold that re-scanned
    // would make its own nodes unaddressable and every patch a missing target.
    const discovered = await discoverFragments([plugin]);
    const node = discovered
      .get('probe')
      ?.find((f) => f.dimension === 'objective')?.node;
    if (!node) throw new Error('fixture: no objective fragment discovered');
    const patches: PatchEntry[] = [
      { target: node, op: 'replace', value: PATCHED },
    ];

    const resolved = resolveFragmentBodies(discovered, patches);
    // Precondition: the composed form genuinely differs from the raw form, or the
    // comparison below proves nothing.
    expect(resolved.get(AUTHORED)).toBe(PATCHED);

    const soul = await soulOf(plugin, resolved);
    expect(soul).toContain(PATCHED);
    expect(soul).not.toContain(AUTHORED);
  });

  it('rewrites only fragment dimensions — archetype is not a fold subject', async () => {
    const plugin = fixturePlugin();
    const discovered = await discoverFragments([plugin]);
    // A substitution that would rewrite the archetype IF archetype were folded.
    const soul = await soulOf(
      plugin,
      new Map([
        [AUTHORED, PATCHED],
        ['parity probe', 'REWRITTEN'],
      ]),
    );
    expect(soul).toContain(PATCHED);
    expect(soul).toContain('parity probe');
    expect(soul).not.toContain('REWRITTEN');
    expect(discovered).toHaveLength(1);
  });

  it('a plugin shipping no fragments dir discovers nothing and renders as authored', async () => {
    const { name, manifest, agents } = fixturePlugin();
    const plugin: ProjectablePlugin = { name, manifest, agents };
    expect(await discoverFragments([plugin])).toHaveLength(0);
    expect(await soulOf(plugin)).toContain(AUTHORED);
  });

  // The real corpus, not a fixture: routing projection through the resolver must
  // leave the canon render tree byte-identical. It does iff the unpatched fold over
  // canon's own fragments is the identity AND no two canon fragments share a body
  // (which would throw `AmbiguousFragmentBodyError` on the way through).
  it('is the identity over the real canon fragment corpus — zero render-tree delta', async () => {
    const canon: ProjectablePlugin = {
      name: 'canon',
      // canon's real catalog is canon's; this leg only needs A catalog naming
      // the dirs its corpus carries, and the fixture corpus names the same 22.
      manifest: FIXTURE_MANIFEST,
      fragments: fileURLToPath(
        new URL('../../../canon/src/dimensions', import.meta.url),
      ),
    };
    const discovered = await discoverFragments([canon]);
    expect(discovered.get('canon')?.length).toBeGreaterThan(100);
    expect(resolveFragmentBodies(discovered, []).size).toBe(0);
  });

  // ── The corpus leg BITES — an empty substitution over a clean corpus and an
  //    empty substitution from a fold that stopped folding are the same green ──
  it('is non-vacuous — a fold that moves a body REFUSES to leave the substitution empty, and an ambiguous body is CONVICTED', async () => {
    const plugin = fixturePlugin();
    const discovered = await discoverFragments([plugin]);
    const node = discovered
      .get('probe')
      ?.find((f) => f.dimension === 'objective')?.node;
    if (!node) throw new Error('fixture: no objective fragment discovered');

    // BAD input 1 — a moved body. The corpus leg above asserts `.size === 0`; a
    // fold that had silently become a no-op would satisfy it forever. Feeding the
    // same call a patch proves the emptiness is the corpus's, not the fold's.
    const moved = resolveFragmentBodies(discovered, [
      { target: node, op: 'replace', value: PATCHED },
    ]);
    expect(moved.size).toBe(1);
    expect(moved.get(AUTHORED)).toBe(PATCHED);

    // BAD input 2 — two nodes sharing ONE authored body that fold to DIFFERENT
    // values: an agent selecting that body has no determinate value, and the
    // canon leg is green only because the real corpus contains no such pair.
    const twin = fixturePlugin('twin');
    const twinDiscovered = await discoverFragments([twin]);
    const twinNode = twinDiscovered
      .get('twin')
      ?.find((f) => f.dimension === 'objective')?.node;
    if (!twinNode) throw new Error('fixture: no twin objective fragment');
    // Both plugins authored the identical body; patch only one of them.
    expect(() =>
      resolveFragmentBodies(new Map([...discovered, ...twinDiscovered]), [
        { target: twinNode, op: 'replace', value: PATCHED },
      ]),
    ).toThrow(AmbiguousFragmentBodyError);
  });
});
