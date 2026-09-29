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
// always `${CLI_BIN}-event-tap`; only the identifier had been abbreviated.
//
// ── WHAT THIS GATE DOES *NOT* CHECK, AND WHY ────────────────────────────────────
// Two equalities were proposed for this gate and both were FALSE OF THE CORPUS they
// were proposed against. They are recorded here rather than deleted, because a
// dropped axis with no record is an axis someone re-proposes next quarter.
//
//   · `dir ≡ keyspace` — DROPPED, false in BOTH directions when proposed: a
//     capability then shipped as a whole package, with no `capabilities/` dir, and
//     a `capabilities/` dir existed with no keyspace member.
//   · `≡ canon skill name` — DROPPED, the relation is 1→N in principle: one
//     capability was once claimed by THREE skills, none of them named after it.
//     Replaced by the SUBSET direction below, which is the true statement.
//
// ── THE AXES THIS GATE DOES CHECK, each with its positive-control count ──────────
//   1. PORT MODULE ⇄ KEYSPACE, as a BICONDITIONAL (4 in-keyspace controls, 1
//      exempt control). A `ports/*.ts` module is outside the keyspace IFF its
//      basename carries the `provisional-` prefix. Stated as a biconditional, and
//      not as "…except the mailbox", so that it SELF-ARMS: a capability landing
//      tomorrow as `ports/foo.ts` is convicted until it joins the keyspace, and a
//      second hand-written exception cannot be quietly added, because there is no
//      list to add it to. The prefix must also be EARNED — see leg 1c.
//   2. SUBSET — ∀ skill · skill.runtime.capability ∈ CAPABILITIES (every skill
//      declaring a capability is a control). One-directional on purpose: a
//      capability with no skill cell is legal.
//   3. SAME SET — canon's `RUNTIME_CAPABILITIES` and the runtime's `CAPABILITIES`
//      name the same capabilities.
//
// HOW IT READS THE RUNTIME. By TEXT, over the source path — the precedent
// `event-tap-cell.test.ts` set. canon
// depends on runtime, but a textual read needs no build output, so this gate is
// live on a cold tree and cannot be quietly satisfied by a stale `dist/`.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RUNTIME_CAPABILITIES } from '../src/manifest.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packages = join(canonRoot, '..');

const KEYSPACE_SRC = join(packages, 'runtime', 'src', 'capability.ts');
const PORTS_DIR = join(packages, 'runtime', 'src', 'ports');
const CANON_SKILLS_DIR = join(canonRoot, 'src', 'skills');

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

/** The runtime's capability keyspace — the members of `CAPABILITIES`, parsed from
 *  `capability.ts` as text. Throws rather than returning `[]`, so a moved
 *  declaration is a LOUD failure and never a gate that silently quantifies over
 *  nothing. */
function keyspace(src: string): string[] {
  const m = src.match(/export const CAPABILITIES = \[([^\]]+)\] as const/);
  if (m?.[1] === undefined) {
    throw new Error(
      'capability-keyspace: no `CAPABILITIES` keyspace found in the runtime',
    );
  }
  return [...m[1].matchAll(/'([A-Za-z]+)'/g)].map((g) => g[1] as string).sort();
}

/** Every `ports/*.ts` basename, sans extension. */
function portBasenames(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.slice(0, -'.ts'.length))
    .sort();
}

/** Every capability a canon skill cell declares, as `<skill> → <capability>`. A
 *  comment is not a declaration: a cell may record the capability it once bound
 *  (`carry-on` does), so comment lines are dropped before the match. */
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
    const code = src
      .split('\n')
      .filter((line) => !/^\s*\/\//.test(line))
      .join('\n');
    const m = code.match(/runtime:\s*\{\s*capability:\s*'([^']+)'/);
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

/** AXIS 2 — every skill-declared capability is a member of the runtime keyspace. */
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

const CAPABILITIES = keyspace(readFileSync(KEYSPACE_SRC, 'utf-8'));
const BASENAMES = portBasenames(PORTS_DIR);
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
      expect.arrayContaining(['eventTap', 'design', 'plan', 'note']),
    );
    expect(BASENAMES).toEqual(
      expect.arrayContaining(['event-tap', 'design', 'plan', 'note']),
    );
    // The subset axis rests on the skill cells that declare a capability; two is
    // the floor below which a dark read could pass it vacuously.
    expect(SKILL_CAPS.length).toBeGreaterThanOrEqual(2);
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
    // An exemption with no subject iterates nothing and reads green for having looked at
    // nothing, so this leg holds only while a module carries the prefix: today that is
    // `provisional-mailbox`, whose anchor is still undiscovered.
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

  // ── AXIS 2 — the subset direction, which is the true one ───────────────────────
  it('every capability a skill cell declares is a member of the runtime keyspace', () => {
    expect(subsetViolations(CAPABILITIES, SKILL_CAPS)).toEqual([]);
  });

  // ── AXIS 3 — one set, declared in two homes ────────────────────────────────────
  it('the corpus vocabulary and the runtime keyspace name the same set', () => {
    // canon narrows `Skill` against its OWN `RUNTIME_CAPABILITIES`, so the compile
    // error a cell gets for an unknown capability is checked against this list, not
    // against the runtime's. Two declared homes for one set is a drift the type
    // system cannot see; this is the only thing that reads both.
    expect([...RUNTIME_CAPABILITIES].sort()).toEqual(CAPABILITIES);
  });

  // ── The convicting fixtures ────────────────────────────────────────────────────
  it('is non-vacuous — each axis REJECTS a synthetic corpus that violates it', () => {
    const caps = ['design', 'eventTap'];

    // AXIS 1, forward: a port module outside the keyspace WITHOUT the prefix. This
    // is the shape a second hand-written exception would take, and there is no
    // allowlist for it to be added to, so it is convicted by construction.
    expect(
      portKeyspaceViolations(caps, ['design', 'event-tap', 'experimental-x']),
    ).toHaveLength(1);

    // AXIS 1, reverse: a `provisional-` module that someone ALSO put in the keyspace —
    // the prefix says "no anchor yet", so it cannot be a member.
    //
    // THE FIXTURE IS SYNTHETIC AND MUST STAY SO. It once named the one real provisional
    // port this corpus had — and when that port was renamed, the identifier sweep rewrote
    // this fixture too, silently turning a synthetic VIOLATION into a legitimate member and
    // taking the axis dark. A control whose subject is a shape must not be spelled with a
    // live instance of that shape; the haystack must not contain the needle.
    expect(
      portKeyspaceViolations(
        [...caps, 'provisionalX'],
        ['design', 'event-tap', 'provisional-x'],
      ),
    ).toHaveLength(1);

    // AXIS 1, the other direction: a capability with no port module at all.
    expect(portKeyspaceViolations(caps, ['design'])).toHaveLength(1);

    // …and the clean corpus really is clean through the same function, so the three
    // convictions above are the predicate biting, not the predicate always firing.
    expect(portKeyspaceViolations(caps, ['design', 'event-tap'])).toEqual([]);

    // AXIS 2: a cell forwarding to a capability no host binds.
    expect(
      subsetViolations(caps, [{ skill: 'ghost', capability: 'tap' }]),
    ).toHaveLength(1);
    expect(
      subsetViolations(caps, [{ skill: 'event-tap', capability: 'eventTap' }]),
    ).toEqual([]);

    // And a runtime source carrying NO keyspace FAILS loudly rather than green-empty.
    expect(() => keyspace('export const SOMETHING = [] as const;')).toThrow(
      /no `CAPABILITIES` keyspace/,
    );
  });
});
