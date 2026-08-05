// THE EVENT VOCABULARY HAS ONE HOME — and two of its three consumers are reached
// by channels no compiler checks.
//
// `MODEL.md:22` rules it: `Event ≜ the harness-agnostic lifecycle vocabulary
// ⟨corpus-owned … shape ⊥ vocabulary : shape @ schema · names @ corpus⟩`. The
// members live in `src/manifest.ts` beside `RUNTIME_CAPABILITIES`, and the three
// other sites reach them three different ways:
//
//   schema  — by TYPE ARGUMENT (`HookCell<CanonicalEvent>`). The compiler holds it.
//   forge   — as DATA on the plugin, then keyed into per-harness maps whose keys are
//             open strings. NOTHING holds it. Leg (b).
//   runtime — as CONFIGURATION THE PROJECTION EMITTED: deploy serializes, a host
//             reads. Two processes, a JSON file between them. NOTHING holds it. Leg (c).
//
// WHY THE GATE IS OWED, AND WAS NOT PAID BEFORE. The defect this repairs was 28
// names declared twice — schema's generated union and runtime's hand-authored tuple
// — identical as sets AND in order, with ZERO test files in any package mentioning
// either name. They agreed by coincidence and the coincidence held only because
// their consumer sets were fully disjoint. A vocabulary whose copies are never
// compared is a vocabulary that has already drifted and not yet been asked.
//
// THE TYPE SYSTEM CANNOT REACH EITHER OF THE LAST TWO. An adapter map is
// `Record<EventName, string>` and `EventName` is open by construction, because the
// alternative is schema enumerating the corpus's names again. A host config is
// bytes. So the check moved from the compiler to here, deliberately, and this file
// is the whole of what replaced it.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalActToClaude,
  canonicalToClaude,
  claudeBindingOf,
  claudeToCanonical,
} from '@cratylus/forge/adapters/claude';
// The two sibling halves of the round trip, by PACKAGE SPECIFIER — the form every other
// cross-package gate here already uses (`bin-name-single-home.test.ts` takes
// `@cratylus/forge/project` and `@cratylus/runtime/bin-name`).
//
// A relative source path was tried first, to be sure no new package edge appeared. It is
// unnecessary and it does not compile: `architecture.test.ts` scans `packages/*/src`, so a
// TEST import was never an edge to begin with — while reaching across `rootDir` by path
// breaks `typecheck:test` outright. The caution was aimed at a risk that does not exist,
// and it cost the property it was protecting.
import {
  canonicalActToCodex,
  canonicalToCodex,
} from '@cratylus/forge/adapters/codex';
import {
  runtimeConfigDocument,
  serializeRuntimeConfig,
} from '@cratylus/forge/deploy';
import { loadRuntimeConfig } from '@cratylus/runtime/runtime-config';
import { describe, expect, it } from 'vitest';
import { CANONICAL_EVENTS } from '../src/manifest.js';

const here = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(here, '..', '..');

// ─────────────────────────────────────────────────────────────────────────────
// (a) THE SOLE LIST — censused over `packages/*/src`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The sites permitted to name MANY events, and why each is not a second list.
 *
 * `manifest.ts` IS the list. The adapter maps are the projection's translation
 * tables: their keys are a SUBSET, checked member-by-member against the tuple by
 * leg (b), so a drifted key fails there rather than silently here. Everything else
 * in the corpus is a CONSUMER — a hook cell binds the one or two moments it fires
 * on, which is usage, not enumeration.
 */
const DECLARING_SITES: readonly string[] = [
  'canon/src/manifest.ts',
  'forge/src/adapters/claude/events.ts',
  'forge/src/adapters/codex/events.ts',
];

/**
 * The most distinct event names a non-declaring file may carry and still be USING
 * the vocabulary rather than writing it down.
 *
 * TWO, and the number is measured rather than chosen. The largest consumer in the
 * live corpus is `canon/src/hooks/stance-guardrail.ts`, which binds exactly two
 * (`turn.end`, `subagent.end`); every other cell binds one. A file reaching three is
 * no longer naming the moments it fires on — which is what `runtime/src/events.ts`
 * did with twenty-eight.
 */
const USE_CEILING = 2;

/** Strip comments before counting: prose that MENTIONS events is not a list, and
 *  the repaired `events.ts` header names three of them while declaring none. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Distinct vocabulary members appearing as STRING LITERALS in `src`. */
function eventLiterals(src: string, vocabulary: readonly string[]): string[] {
  const code = stripComments(src);
  return vocabulary.filter((e) =>
    new RegExp(`['"\`]${e.replace(/\./g, '\\.')}['"\`]`).test(code),
  );
}

/**
 * The PURE predicate leg (a) rests on: given `<pkg>/src/<path>` → source text,
 * which files enumerate the vocabulary without being permitted to?
 *
 * Pure so the convicting fixture can drive THE SAME function over a synthetic
 * corpus. A gate whose control travels a different path proves only that the
 * control works.
 */
function undeclaredEnumerations(
  files: ReadonlyMap<string, string>,
  vocabulary: readonly string[],
  allowed: readonly string[] = DECLARING_SITES,
): { file: string; events: string[] }[] {
  const out: { file: string; events: string[] }[] = [];
  for (const [file, src] of files) {
    if (allowed.includes(file)) continue;
    const events = eventLiterals(src, vocabulary);
    if (events.length > USE_CEILING) out.push({ file, events });
  }
  return out;
}

/** Every tracked TypeScript source under `packages/<pkg>/src`, keyed
 *  `<pkg>/src/<path>`. Git-tracked, so a build artifact or a scratch file cannot
 *  convict — and cannot exempt — anything. */
function liveSources(): Map<string, string> {
  // ONE PATHSPEC PER PACKAGE, spelled out — the form `architecture.test.ts`
  // already uses, and not a convenience. `packages/*/src` matches nothing (git's
  // `*` does not cross `/` in a directory pathspec) and `packages/*/src/**/*.ts`
  // silently drops every top-level module, which is `runtime/src/events.ts` — the
  // exact file this gate exists to police — and `canon/src/manifest.ts`, the home
  // it is policed against. Both holes were found by the reach check above, which
  // is the whole reason a scan owes one.
  const repoRoot = join(packagesDir, '..');
  const files = new Map<string, string>();
  for (const pkg of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!pkg.isDirectory()) continue;
    const tracked = execFileSync(
      'git',
      ['ls-files', `packages/${pkg.name}/src`],
      { cwd: repoRoot, encoding: 'utf8' },
    )
      .split('\n')
      .filter((f) => f.endsWith('.ts'));
    for (const rel of tracked) {
      const abs = join(repoRoot, rel);
      if (!existsSync(abs)) continue;
      files.set(rel.replace(/^packages\//, ''), readFileSync(abs, 'utf8'));
    }
  }
  return files;
}

describe('(a) canon declares the vocabulary, and nothing else does', () => {
  it('the scan REACHES the corpus — an empty census is a dark scan, not a clean one', () => {
    const files = liveSources();
    expect(
      files.size,
      'no source files found under packages/*/src',
    ).toBeGreaterThan(100);
    expect(
      files.get('canon/src/manifest.ts'),
      'the declaring site itself was not read',
    ).toContain('CANONICAL_EVENTS');
  });

  it('no file outside the declared sites enumerates the vocabulary', () => {
    const offenders = undeclaredEnumerations(liveSources(), CANONICAL_EVENTS);
    expect(
      offenders.map(
        (o) => `${o.file} names ${o.events.length}: ${o.events.join(', ')}`,
      ),
      'a second list. The vocabulary is signified in canon/src/manifest.ts; every ' +
        'other site derives it, receives it as plugin data, or reads it from the ' +
        'host config the projection emitted',
    ).toEqual([]);
  });

  it('is non-vacuous — the census CONVICTS the exact defect this repair removed', () => {
    // The literal shape `runtime/src/events.ts` carried: a hand-authored tuple of
    // canon's names, in a package that declares no vocabulary of its own.
    const reintroduced = `export const LIFECYCLE_EVENTS = [\n${CANONICAL_EVENTS.map(
      (e) => `  '${e}',`,
    ).join('\n')}\n] as const;`;
    const corpus = new Map([['runtime/src/events.ts', reintroduced]]);
    // 1. the injection landed — the defect is PRESENT before the gate is asked.
    expect(eventLiterals(reintroduced, CANONICAL_EVENTS)).toEqual([
      ...CANONICAL_EVENTS,
    ]);
    // 2. the gate reports it.
    const caught = undeclaredEnumerations(corpus, CANONICAL_EVENTS);
    expect(caught.map((c) => c.file)).toEqual(['runtime/src/events.ts']);
    // 3. and the same predicate leaves a CONSUMER alone — a cell binding its own
    //    moments must not read as an enumeration, or the gate is a ban on usage.
    const cell = `events: ['turn.end', 'subagent.end'],`;
    expect(
      undeclaredEnumerations(
        new Map([['canon/src/hooks/x.ts', cell]]),
        CANONICAL_EVENTS,
      ),
    ).toEqual([]);
    // 4. and PROSE naming events is not a list — the repaired header names three.
    const prose =
      '// (session.start, turn.end, tool.use.pre, …)\nexport type EventName = string;';
    expect(
      undeclaredEnumerations(
        new Map([['runtime/src/events.ts', prose]]),
        CANONICAL_EVENTS,
      ),
    ).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// (b) EVERY ADAPTER MAP KEY IS A DECLARED EVENT
// ─────────────────────────────────────────────────────────────────────────────

/** The pure predicate: which of `map`'s keys are not in the vocabulary? */
function foreignKeys(
  map: Readonly<Record<string, unknown>>,
  vocabulary: readonly string[],
): string[] {
  const declared = new Set(vocabulary);
  return Object.keys(map).filter((k) => !declared.has(k));
}

describe('(b) every adapter map keys over the declared vocabulary', () => {
  // BOTH TABLES PER ADAPTER. The 1:1 `canonical → native` map, and the ACT bindings
  // beside it (`canonical act → ⟨native event, native selector⟩`). The acts are a
  // second TABLE, never a second VOCABULARY — they key over the same tuple, and this
  // leg is what says so. They are separate because many acts share one native event
  // and the 1:1 map must reverse.
  const adapters: readonly [string, Readonly<Record<string, unknown>>][] = [
    ['claude', canonicalToClaude],
    ['claude acts', canonicalActToClaude],
    ['codex', canonicalToCodex],
    ['codex acts', canonicalActToCodex],
  ];

  for (const [name, map] of adapters) {
    it(`${name}: no key outside canon's tuple`, () => {
      expect(
        foreignKeys(map, CANONICAL_EVENTS),
        `${name} maps an event this corpus does not signify — with EventName open, a typo here is a key that maps nothing rather than a compile error`,
      ).toEqual([]);
    });
  }

  it('claude reaches 21 of 30 harness events, leaving 9 with no native peer', () => {
    // MEASURED, not quoted forward. The filing said 18 pairs and 10 unmapped; the
    // pairs were 19, and the 10 was the union over BOTH shipped adapters — a
    // different quantity wearing this one's name. The tuple then gained the two ACTS
    // (`operator.consult.pre`, `subagent.dispatch.pre`), which claude reaches through
    // the act table rather than the 1:1 map — so REACHED and MAPPED are now different
    // counts, and both are asserted.
    const harness = CANONICAL_EVENTS.filter((e) => e !== 'vcs.commit.post');
    expect(harness).toHaveLength(30);
    expect(Object.keys(canonicalToClaude)).toHaveLength(19);
    expect(Object.keys(canonicalActToClaude)).toHaveLength(2);
    expect(
      harness.filter((e) => claudeBindingOf(e) === undefined),
    ).toHaveLength(9);
  });

  it('no adapter claims the git substrate as a harness event', () => {
    for (const [name, map] of adapters)
      expect(
        map['vcs.commit.post'],
        `${name} claims a git-substrate event`,
      ).toBeUndefined();
  });

  it('the claude reverse map round-trips — it is DERIVED, never a second table', () => {
    for (const [event, native] of Object.entries(canonicalToClaude))
      expect(claudeToCanonical[native]).toBe(event);
  });

  it('is non-vacuous — REFUSES a map key that is not a declared event', () => {
    expect(
      foreignKeys({ 'session.strat': 'SessionStart' }, CANONICAL_EVENTS),
    ).toEqual(['session.strat']);
    expect(
      foreignKeys({ 'session.start': 'SessionStart' }, CANONICAL_EVENTS),
    ).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// (c) THE ROUND TRIP — the leg that crosses the seam the type system cannot
// ─────────────────────────────────────────────────────────────────────────────

describe("(c) the config deploy emits, parsed back by the runtime's own reader", () => {
  /** Emit exactly as `cratylus deploy` does, to a real file, and read it back
   *  with the RUNTIME's parser — not a hand-rolled one. Three packages and a
   *  filesystem in between, which is precisely the span nothing else covers. */
  function roundTrip(): NonNullable<ReturnType<typeof loadRuntimeConfig>> {
    const doc = runtimeConfigDocument({
      events: CANONICAL_EVENTS,
      nativeEvents: canonicalToClaude,
    });
    const path = join(
      mkdtempSync(join(tmpdir(), 'cratylus-event-vocab-')),
      'config.json',
    );
    writeFileSync(path, serializeRuntimeConfig(doc), 'utf8');
    const parsed = loadRuntimeConfig(path);
    expect(
      parsed,
      'the runtime read back nothing from a config deploy just wrote',
    ).not.toBeNull();
    return parsed as NonNullable<typeof parsed>;
  }

  it("the vocabulary that arrives is canon's tuple, in order", () => {
    expect(roundTrip().events?.vocabulary).toEqual([...CANONICAL_EVENTS]);
  });

  it("the native map that arrives is forge's map, pair for pair", () => {
    expect(roundTrip().events?.native).toEqual({ ...canonicalToClaude });
  });

  it('the emission FILTERS to the vocabulary — a stray map key never reaches a host', () => {
    // The one way a second vocabulary could re-enter: through the map's keyspace,
    // which the type system does not constrain.
    const doc = runtimeConfigDocument({
      events: CANONICAL_EVENTS,
      nativeEvents: { ...canonicalToClaude, 'not.an.event': 'Bogus' },
    });
    expect(doc.events.native['not.an.event']).toBeUndefined();
    expect(Object.keys(doc.events.native)).toHaveLength(19);
  });

  it('REFUSES to emit an empty vocabulary — a host that cannot validate is not configured', () => {
    expect(() =>
      runtimeConfigDocument({ events: [], nativeEvents: canonicalToClaude }),
    ).toThrow(/no lifecycle events/);
  });

  it('is non-vacuous — the round trip FAILS when the emitted config drops a member', () => {
    const short = CANONICAL_EVENTS.slice(0, -1);
    const doc = runtimeConfigDocument({
      events: short,
      nativeEvents: canonicalToClaude,
    });
    const path = join(
      mkdtempSync(join(tmpdir(), 'cratylus-event-vocab-')),
      'config.json',
    );
    writeFileSync(path, serializeRuntimeConfig(doc), 'utf8');
    const parsed = loadRuntimeConfig(path);
    // The defect is PRESENT (the injection landed) …
    expect(parsed?.events?.vocabulary).toHaveLength(
      CANONICAL_EVENTS.length - 1,
    );
    // … and the assertion the passing legs make is the one that rejects it.
    expect(parsed?.events?.vocabulary).not.toEqual([...CANONICAL_EVENTS]);
  });
});
