// CAPABILITY-KEYSPACE gate — the runtime capability keyspace is ONE sign per
// capability, spoken in two registers, and nothing outside it answers to a
// capability's name.
//
// WHY THIS FILE EXISTS. The `event-tap` capability was reachable under THREE
// spellings at once: `eventTap` (the keyspace member and the dispatch word),
// `event-tap` (the plugin `name:`, the dir, the port module), and `tap` (a bare
// abbreviation that `main.ts` accepted beside the real word, and that every
// exported identifier in the capability had contracted to — `TapVerb`,
// `dispatchTap`, `TAP_ID`). Nothing was wrong with the first two: the corpus
// already declares the kebab↔camel map (`forge/src/core/anatomy-body.ts`'s
// `dimensionField`) and runs it live for `situation-awareness`↔`situationAwareness`,
// so those are one sign in two registers, not two signs. `tap` was the genuine
// second sign, and it fails circumscription — it carries *passive siphon on a
// stream* but not WHICH stream, so it never enters the competition despite being
// shortest. The tree already agreed before anyone ruled: the shipped VALUE was
// always `${RUNTIME_BIN}-event-tap`; only the identifier had been abbreviated.
//
// ── WHAT THIS GATE DOES *NOT* CHECK, AND WHY ────────────────────────────────────
// Two equalities were proposed for this gate and both are FALSE OF THE LIVE CORPUS.
// They are recorded here rather than deleted, because a dropped axis with no record
// is an axis someone re-proposes next quarter.
//
//   · `dir ≡ keyspace` — DROPPED, 1-for-2 in BOTH directions. `memory` is in
//     `CAPABILITIES` and has no `capabilities/memory/` dir (it is a whole package);
//     `capabilities/heartbeat/` is a dir with no keyspace member. An equality
//     with one witness and one counter-example in each direction is not an
//     invariant, it is a coincidence with a sample size of two.
//   · `≡ canon skill name` — DROPPED, the relation is 1→N. `memory` is claimed by
//     THREE skills (`dream`, `handoff`, `wake`) and none of them is named `memory`.
//     Replaced by the SUBSET direction below, which is the true statement and has
//     four positive controls.
//
// ── THE AXES THIS GATE DOES CHECK, each with its positive-control count ──────────
//   1. PORT MODULE ⇄ KEYSPACE, as a BICONDITIONAL (2 in-keyspace controls, 1
//      exempt control). A `ports/*.ts` module is outside the keyspace IFF its
//      basename carries the `provisional-` prefix. Stated as a biconditional, and
//      not as "…except heartbeat", so that it SELF-ARMS: a capability landing
//      tomorrow as `ports/foo.ts` is convicted until it joins the keyspace, and a
//      second hand-written exception cannot be quietly added, because there is no
//      list to add it to. The prefix must also be EARNED — see leg 1c.
//   2. PLUGIN `name:` ≡ THE SIGN'S KEBAB REGISTER (2 controls). `memory`'s plugin
//      is `name: 'memory'`; the event-tap capability's is `name: 'event-tap'`.
//   3. SUBSET — ∀ skill · skill.runtime.capability ∈ CAPABILITIES (4 controls:
//      dream/handoff/wake → `memory`, event-tap → `eventTap`). One-directional on
//      purpose: a capability with no skill cell is legal, a skill cell forwarding
//      to a capability no host binds is a shim that dies `unknown capability`.
//
// HOW IT READS THE RUNTIME. By TEXT, over the source path — the precedent
// `event-tap-cell.test.ts` and memory's `cell-verb-roster.test.ts` both set. canon
// depends on runtime, but a textual read needs no build output, so this gate is
// live on a cold tree and cannot be quietly satisfied by a stale `dist/`.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RUNTIME_CAPABILITIES } from '../src/manifest.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packages = join(canonRoot, '..');

const LOADER_SRC = join(packages, 'runtime', 'src', 'loader.ts');
const PORTS_DIR = join(packages, 'runtime', 'src', 'ports');
const CANON_SKILLS_DIR = join(canonRoot, 'src', 'skills');

/** The dirs whose `src/**` may declare a `runtimePlugin`. `test/` is EXCLUDED: a
 *  test double naming itself `fake-tap` is MENTIONING a plugin, not shipping one —
 *  the same use/mention line `command-veracity.test.ts` draws. */
const PLUGIN_SRC_ROOTS = ['memory', 'runtime'].map((p) =>
  join(packages, p, 'src'),
);

// ── The two registers of one sign ───────────────────────────────────────────────
// The map is NOT minted here. `forge/src/core/anatomy-body.ts`'s `dimensionField`
// is its declared home and this is the same transform; it is re-stated rather than
// imported because forge exposes it on no public subpath, and inventing a package
// export to carry a test is the edge these textual gates exist to avoid. The
// round-trip leg below pins the two against the corpus's live pairs, so a drift
// between this copy and the declared home is convicted rather than assumed away.

/** kebab register → camel register: `event-tap` → `eventTap`. */
function camel(kebab: string): string {
  return kebab.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

/** camel register → kebab register: `eventTap` → `event-tap`. */
function kebab(camel: string): string {
  return camel.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** The prefix that places a port module OUTSIDE the keyspace. Not a name, and the
 *  one module carrying it says so in its own first line. */
const PROVISIONAL = /^provisional-/;

// ── Corpus readers ──────────────────────────────────────────────────────────────

/** The runtime's `CAPABILITIES` tuple, parsed from `loader.ts` as text. Throws
 *  rather than returning `[]`, so a moved declaration is a LOUD failure and never
 *  a gate that silently quantifies over nothing. */
function keyspace(src: string): string[] {
  const m = src.match(/export const CAPABILITIES = \[([^\]]+)\] as const;/);
  if (m?.[1] === undefined) {
    throw new Error(
      'capability-keyspace: no `CAPABILITIES` tuple found in the runtime loader',
    );
  }
  return [...m[1].matchAll(/'([^']+)'/g)].map((g) => g[1] as string).sort();
}

/** Every `ports/*.ts` basename, sans extension. */
function portBasenames(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.slice(0, -'.ts'.length))
    .sort();
}

/** One `defineRuntimePlugin({…})` site: the file, its `name:`, and the capability
 *  fields it assigns. */
interface PluginSite {
  file: string;
  name: string;
  provides: string[];
}

/** Slice the balanced `(…)` argument text of the call starting at `open`. */
function balanced(src: string, open: number): string {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return src.slice(open + 1, i);
  }
  throw new Error('capability-keyspace: unbalanced defineRuntimePlugin(');
}

/** Every `defineRuntimePlugin({…})` site in `src`, with the capabilities it claims. */
function pluginSites(
  file: string,
  src: string,
  capabilities: readonly string[],
): PluginSite[] {
  const out: PluginSite[] = [];
  for (const m of src.matchAll(/defineRuntimePlugin\(/g)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const arg = balanced(src, open);
    const name = arg.match(/\bname:\s*'([^']+)'/)?.[1];
    if (name === undefined) continue; // a re-export or a type position, not a site
    const provides = capabilities.filter((c) =>
      new RegExp(`(^|[{,\\s])${c}\\s*:`).test(arg),
    );
    out.push({ file, name, provides });
  }
  return out;
}

/** Every `.ts` file under `dir`, recursively. */
function sourcesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.ts')) out.push(p);
    }
  };
  walk(dir);
  return out;
}

/** Every capability a canon skill cell declares, as `<skill> → <capability>`. */
function skillCapabilities(
  dir: string,
): { skill: string; capability: string }[] {
  const out: { skill: string; capability: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let src: string;
    try {
      src = readFileSync(join(dir, entry.name, 'skill.ts'), 'utf-8');
    } catch {
      continue; // not a cell dir
    }
    const m = src.match(/runtime:\s*\{\s*capability:\s*'([^']+)'/);
    if (m?.[1] !== undefined) out.push({ skill: entry.name, capability: m[1] });
  }
  return out.sort((a, b) => a.skill.localeCompare(b.skill));
}

// ── The three invariants, as PURE functions over injected data ──────────────────
// Pure so the convicting fixtures below travel the SAME path as the live legs. A
// control that reached its verdict by a different mechanism proves only that the
// mechanism works (meta-gate hazard 2).

/**
 * AXIS 1 — the biconditional, both directions.
 *   · a `ports/<b>.ts` is in the keyspace ⟺ `<b>` is NOT `provisional-`-prefixed
 *   · every keyspace member has a `ports/<kebab(member)>.ts`
 */
function portKeyspaceViolations(
  capabilities: readonly string[],
  basenames: readonly string[],
): string[] {
  const out: string[] = [];
  for (const b of basenames) {
    const inKeyspace = capabilities.includes(camel(b));
    const exempt = PROVISIONAL.test(b);
    if (inKeyspace && exempt)
      out.push(
        `ports/${b}.ts is \`provisional-\`-prefixed yet '${camel(b)}' IS in CAPABILITIES — the prefix means "no anchor yet", so it cannot also be a keyspace member`,
      );
    else if (!inKeyspace && !exempt)
      out.push(
        `ports/${b}.ts is outside CAPABILITIES without the \`provisional-\` prefix — either add '${camel(b)}' to the keyspace or say the anchor is undiscovered by renaming it \`provisional-${b}.ts\``,
      );
  }
  for (const c of capabilities)
    if (!basenames.includes(kebab(c)))
      out.push(`capability '${c}' has no ports/${kebab(c)}.ts module`);
  return out.sort();
}

/** AXIS 2 — a plugin's `name:` is the kebab register of every capability it provides. */
function pluginNameViolations(sites: readonly PluginSite[]): string[] {
  const out: string[] = [];
  for (const s of sites)
    for (const c of s.provides)
      if (s.name !== kebab(c))
        out.push(
          `${s.file}: plugin name '${s.name}' provides '${c}', whose kebab register is '${kebab(c)}'`,
        );
  return out.sort();
}

/** AXIS 3 — every skill-declared capability is a member of the runtime keyspace. */
function subsetViolations(
  capabilities: readonly string[],
  declared: readonly { skill: string; capability: string }[],
): string[] {
  return declared
    .filter((d) => !capabilities.includes(d.capability))
    .map(
      (d) =>
        `skill '${d.skill}' declares capability '${d.capability}', which no runtime keyspace member binds — its shim would die \`unknown capability\``,
    )
    .sort();
}

// ── The live corpus ─────────────────────────────────────────────────────────────

const CAPABILITIES = keyspace(readFileSync(LOADER_SRC, 'utf-8'));
const BASENAMES = portBasenames(PORTS_DIR);
const SITES = PLUGIN_SRC_ROOTS.flatMap((root) =>
  sourcesUnder(root).flatMap((f) =>
    pluginSites(
      f.slice(packages.length + 1),
      readFileSync(f, 'utf-8'),
      CAPABILITIES,
    ),
  ),
);
const SKILL_CAPS = skillCapabilities(CANON_SKILLS_DIR);

describe('CAPABILITY KEYSPACE — one sign per capability, two registers, nothing else', () => {
  // Every leg below quantifies over a corpus read. If a read comes back empty the
  // leg is green having checked nothing — so each read is pinned FIRST to the
  // witnesses it is KNOWN to contain, and the gate fails loudly when one goes dark.
  //
  // These pins are SUPERSET, not equality, and that is the difference between a
  // dark-read guard and a roster of record. Equality here would convict a
  // legitimate new capability for existing, which is the opposite of self-arming;
  // and it would not buy anything, because the pin cannot absorb an exception — a
  // module added to the pin is still judged by the biconditional below (verified:
  // injecting `ports/experimental-x.ts` fails BOTH legs independently).
  it('the corpus reads are non-vacuous — a dark read FAILS rather than passing empty', () => {
    expect(CAPABILITIES).toEqual(
      expect.arrayContaining(['eventTap', 'memory']),
    );
    expect(BASENAMES).toEqual(
      expect.arrayContaining(['event-tap', 'memory', 'heartbeat']),
    );
    expect(SITES.map((s) => s.name)).toEqual(
      expect.arrayContaining(['event-tap', 'memory']),
    );
    // dream · handoff · wake → memory, event-tap → eventTap: the four controls the
    // subset axis rests on.
    expect(SKILL_CAPS.length).toBeGreaterThanOrEqual(4);
  });

  it('the two registers round-trip on the pairs the corpus actually runs', () => {
    // `dimensionField`'s live pair, and this capability's — the map is the corpus's,
    // not this gate's, and these are the witnesses that say so.
    expect(camel('situation-awareness')).toBe('situationAwareness');
    expect(camel('event-tap')).toBe('eventTap');
    expect(kebab('eventTap')).toBe('event-tap');
    for (const c of CAPABILITIES) expect(camel(kebab(c))).toBe(c);
  });

  it('the `provisional-` prefix is EARNED — the module declares the prefix is not a name', () => {
    // Without this the exemption is spelling: anyone could park a real capability behind the
    // prefix and skip the keyspace. The module must SAY the prefix is a placeholder.
    //
    // DELETED AND REBUILT IN ONE DAY, which is the mechanism working rather than churn. When
    // `provisional-v9` became `heartbeat` the exemption had zero members, and an exemption
    // with no subject iterates nothing and reads green for having looked at nothing — so it
    // went. `provisional-mailbox` then arrived with a real anchor still undiscovered, which
    // is exactly the state the prefix exists to mark, and the leg returned with a subject to
    // protect.
    const exempt = BASENAMES.filter((b) => PROVISIONAL.test(b));
    expect(exempt, 'no exempt module found — this leg is DARK').not.toEqual([]);
    for (const b of exempt) {
      const text = readFileSync(join(PORTS_DIR, `${b}.ts`), 'utf8');
      expect(text, `${b} claims the prefix without declaring it`).toMatch(
        /PROVISIONAL PATH/,
      );
    }
  });

  // ── AXIS 1 — port module ⇄ keyspace, as a biconditional ────────────────────────
  it('a ports/*.ts module is outside the keyspace IFF it is `provisional-`-prefixed', () => {
    expect(portKeyspaceViolations(CAPABILITIES, BASENAMES)).toEqual([]);
  });

  // ── AXIS 2 — plugin `name:` ≡ the sign's kebab register ────────────────────────
  it("a runtime plugin's `name:` is the kebab register of the capability it provides", () => {
    // Non-vacuous: both sites really do claim a capability (a site claiming none
    // would satisfy the loop by having nothing to iterate).
    expect(SITES.flatMap((s) => s.provides)).toEqual(
      expect.arrayContaining(['eventTap', 'memory']),
    );
    expect(pluginNameViolations(SITES)).toEqual([]);
  });

  // ── AXIS 3 — the subset direction, which is the true one ───────────────────────
  it('every capability a skill cell declares is a member of the runtime keyspace', () => {
    expect(subsetViolations(CAPABILITIES, SKILL_CAPS)).toEqual([]);
    // The 1→N that killed the `≡ canon skill name` axis, asserted rather than
    // remembered: `memory` is claimed by three cells and named by none of them.
    const memoryCells = SKILL_CAPS.filter((d) => d.capability === 'memory').map(
      (d) => d.skill,
    );
    expect(memoryCells).toEqual(
      expect.arrayContaining(['dream', 'handoff', 'wake']),
    );
    expect(memoryCells).not.toContain('memory');
  });

  it('the corpus vocabulary and the runtime keyspace name the same set', () => {
    // canon narrows `Skill` against its OWN `RUNTIME_CAPABILITIES`, so the compile
    // error a cell gets for an unknown capability is checked against this list, not
    // against the runtime's. Two declared homes for one set is a drift the type
    // system cannot see; this is the only thing that reads both.
    expect([...RUNTIME_CAPABILITIES].sort()).toEqual(CAPABILITIES);
  });

  // ── The convicting fixtures ────────────────────────────────────────────────────
  it('is non-vacuous — each axis REJECTS a synthetic corpus that violates it', () => {
    const caps = ['memory', 'eventTap'];

    // AXIS 1, forward: a port module outside the keyspace WITHOUT the prefix. This
    // is the shape a second hand-written exception would take, and there is no
    // allowlist for it to be added to, so it is convicted by construction.
    expect(
      portKeyspaceViolations(caps, ['memory', 'event-tap', 'experimental-x']),
    ).toHaveLength(1);

    // AXIS 1, reverse: a `provisional-` module that someone ALSO put in the keyspace —
    // the prefix says "no anchor yet", so it cannot be a member.
    //
    // THE FIXTURE IS SYNTHETIC AND MUST STAY SO. It read `provisionalV9` /
    // `provisional-v9`, naming the one real provisional port this corpus had — and when
    // that port was renamed to `heartbeat`, the identifier sweep rewrote this fixture too,
    // silently turning a synthetic VIOLATION into a legitimate member and taking the axis
    // dark. A control whose subject is a shape must not be spelled with a live instance of
    // that shape; the haystack must not contain the needle.
    expect(
      portKeyspaceViolations(
        [...caps, 'provisionalX'],
        ['memory', 'event-tap', 'provisional-x'],
      ),
    ).toHaveLength(1);

    // AXIS 1, the other direction: a capability with no port module at all.
    expect(portKeyspaceViolations(caps, ['memory'])).toHaveLength(1);

    // …and the clean corpus really is clean through the same function, so the three
    // convictions above are the predicate biting, not the predicate always firing.
    //
    // SECOND SITE THE SWEEP CORRUPTED. This read `['memory', 'event-tap', 'provisional-v9']`
    // and was clean BECAUSE the third member was exempt by prefix. The rename left
    // `heartbeat` in its place — in neither the keyspace nor the exemption — so the leg
    // asserting cleanliness was asserting a violation. Synthetic now, and holding only what
    // it means to hold.
    expect(portKeyspaceViolations(caps, ['memory', 'event-tap'])).toEqual([]);

    // AXIS 2: the plugin that names its capability in the WRONG register.
    expect(
      pluginNameViolations([
        { file: 'x.ts', name: 'eventTap', provides: ['eventTap'] },
      ]),
    ).toHaveLength(1);
    // …and the rejected third sign, which is what this whole gate was written for.
    expect(
      pluginNameViolations([
        { file: 'x.ts', name: 'tap', provides: ['eventTap'] },
      ]),
    ).toHaveLength(1);
    expect(
      pluginNameViolations([
        { file: 'x.ts', name: 'event-tap', provides: ['eventTap'] },
      ]),
    ).toEqual([]);

    // AXIS 3: a cell forwarding to a capability no host binds.
    expect(
      subsetViolations(caps, [{ skill: 'ghost', capability: 'tap' }]),
    ).toHaveLength(1);
    expect(
      subsetViolations(caps, [{ skill: 'event-tap', capability: 'eventTap' }]),
    ).toEqual([]);

    // And a runtime source carrying NO keyspace FAILS loudly rather than green-empty.
    expect(() => keyspace('export const SOMETHING = [] as const;')).toThrow(
      /no `CAPABILITIES` tuple/,
    );
  });
});
