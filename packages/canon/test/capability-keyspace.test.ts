// CAPABILITY-KEYSPACE gate — the runtime capability keyspace is ONE term per
// capability, spoken in two registers, and nothing outside it answers to a
// capability's name.
//
// WHY THIS FILE EXISTS. A capability has one keyspace name, in its declared
// camelCase register (`versionSkew`), and a matching kebab-case port module
// (`version-skew`). The conversion between those registers is already declared by
// this repository and used for `communication-style` / `communicationStyle`; this gate
// checks that runtime ports remain aligned with the capability keyspace
// rather than accumulating alternate names.
//
// ── WHAT THIS GATE DOES *NOT* CHECK, AND WHY ────────────────────────────────────
// An equality was proposed for this gate and was FALSE OF THE REPOSITORY it was
// proposed against. It is recorded here rather than deleted, because a dropped axis
// with no record is an axis someone re-proposes next quarter.
//
//   · `dir ≡ keyspace` — DROPPED, false in BOTH directions when proposed: a
//     capability then shipped as a whole package, with no `capabilities/` dir, and
//     a `capabilities/` dir existed with no keyspace member.
//
// ── THE AXIS THIS GATE DOES CHECK ───────────────────────────────────────────────
//   1. PORT MODULE ⇒ KEYSPACE (1 exempt control; the in-keyspace direction is
//      held by the convicting fixtures, since no member codes against a port). A
//      `ports/*.ts` module is outside the keyspace IFF its basename carries the
//      `provisional-` prefix. Stated as that equivalence, and not as "…except the
//      mailbox", so that it SELF-ARMS: a capability landing tomorrow as
//      `ports/foo.ts` is convicted until it joins the keyspace, and a second
//      hand-written exception cannot be quietly added, because there is no list to
//      add it to. The prefix must also be EARNED — see leg 1c. A keyspace member
//      needs no port module: no member codes against a port, so the converse
//      (every member has a `ports/<kebab>.ts`) is false of the repository and DROPPED.
//
// HOW IT READS THE RUNTIME. By TEXT, over the source path. canon depends on
// runtime, but a textual read needs no build output, so this gate is
// live on a cold tree and cannot be quietly satisfied by a stale `dist/`.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packages = join(canonRoot, '..');

const KEYSPACE_SRC = join(packages, 'runtime', 'src', 'capability.ts');
const PORTS_DIR = join(packages, 'runtime', 'src', 'ports');

// ── The two registers of one term ───────────────────────────────────────────────
// The map is NOT minted here. `forge/src/core/body.ts`'s `factorField`
// is its declared home and this is the same transform; it is re-stated rather than
// imported because forge exposes it on no public subpath, and inventing a package
// export to carry a test is the edge these textual gates exist to avoid. The
// round-trip leg below pins the two against the repository's live pairs, so a drift
// between this copy and the declared home is convicted rather than assumed away.

/** kebab register → camel register: `version-skew` → `versionSkew`. */
function camel(kebab: string): string {
  return kebab.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

/** camel register → kebab register: `versionSkew` → `version-skew`. */
function kebab(camel: string): string {
  return camel.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** The prefix that places a port module OUTSIDE the keyspace. Not a name, and the
 *  one module carrying it says so in its own first line. */
const PROVISIONAL = /^provisional-/;

// ── Repository readers ──────────────────────────────────────────────────────────

/** The runtime's capability keyspace — the members of `CAPABILITIES`, parsed from
 *  `capability.ts` as text. Throws rather than returning `[]`, so a moved
 *  declaration is a LOUD failure, never a check that silently quantifies over
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

// ── The invariant, as a PURE function over injected data ────────────────────────
// Pure so the convicting fixtures below travel the SAME path as the live legs. A
// control that reached its verdict by a different mechanism proves only that the
// mechanism works.

/**
 * AXIS 1 — a `ports/<b>.ts` is in the keyspace ⟺ `<b>` is NOT
 * `provisional-`-prefixed. A keyspace member without a port module is legal.
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
        `ports/${b}.ts is \`provisional-\`-prefixed yet '${camel(b)}' IS in CAPABILITIES — the prefix means "no term yet", so it cannot also be a keyspace member`,
      );
    else if (!inKeyspace && !exempt)
      out.push(
        `ports/${b}.ts is outside CAPABILITIES without the \`provisional-\` prefix — either add '${camel(b)}' to the keyspace or say the term is undiscovered by renaming it \`provisional-${b}.ts\``,
      );
  }
  return out.sort();
}

// ── The live repository ─────────────────────────────────────────────────────────

const CAPABILITIES = keyspace(readFileSync(KEYSPACE_SRC, 'utf-8'));
const BASENAMES = portBasenames(PORTS_DIR);

describe('CAPABILITY KEYSPACE — one term per capability, two registers, nothing else', () => {
  // Every leg below quantifies over a repository read. If a read comes back empty the
  // leg is green having checked nothing — so each read is pinned FIRST to the
  // witnesses it is KNOWN to contain, and the gate fails loudly when one goes dark.
  //
  // These pins are SUPERSET, not equality, and that is the difference between a
  // dark-read guard and a roster of record. Equality here would convict a
  // legitimate new capability for existing, which is the opposite of self-arming;
  // and it would not buy anything, because the pin cannot absorb an exception — a
  // module added to the pin is still judged by the biconditional below (verified:
  // injecting `ports/experimental-x.ts` fails BOTH legs independently).
  it('the repository reads are non-vacuous — a dark read FAILS rather than passing empty', () => {
    expect(CAPABILITIES).toEqual(
      expect.arrayContaining(['model', 'versionSkew']),
    );
    expect(BASENAMES).toEqual(expect.arrayContaining(['provisional-mailbox']));
  });

  it('the two registers round-trip on the pairs the repository actually runs', () => {
    // `factorField`'s live pair, and this capability's — the map is the repository's,
    // not this gate's, and these are the witnesses that say so.
    expect(camel('communication-style')).toBe('communicationStyle');
    expect(camel('version-skew')).toBe('versionSkew');
    expect(kebab('versionSkew')).toBe('version-skew');
    for (const c of CAPABILITIES) expect(camel(kebab(c))).toBe(c);
  });

  it('the `provisional-` prefix is EARNED — the module declares the prefix is not a name', () => {
    // Without this the exemption is spelling: anyone could park a real capability behind the
    // prefix and skip the keyspace. The module must SAY the prefix is a placeholder.
    //
    // An exemption with no subject iterates nothing and reads green for having looked at
    // nothing, so this leg holds only while a module carries the prefix: today that is
    // `provisional-mailbox`, whose term is still undiscovered.
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

  // ── The convicting fixtures ────────────────────────────────────────────────────
  it('is non-vacuous — each axis REJECTS a synthetic input that violates it', () => {
    const caps = ['model', 'versionSkew'];

    // AXIS 1, forward: a port module outside the keyspace WITHOUT the prefix. This
    // is the shape a second hand-written exception would take, and there is no
    // allowlist for it to be added to, so it is convicted by construction.
    expect(
      portKeyspaceViolations(caps, ['version-skew', 'experimental-x']),
    ).toHaveLength(1);

    // AXIS 1, reverse: a `provisional-` module that someone ALSO put in the keyspace —
    // the prefix says "no term yet", so it cannot be a member.
    //
    // THE FIXTURE IS SYNTHETIC AND MUST STAY SO. It once named the one real provisional
    // port this repository had — and when that port was renamed, the identifier sweep rewrote
    // this fixture too, silently turning a synthetic VIOLATION into a legitimate member and
    // taking the axis dark. A control whose subject is a shape must not be spelled with a
    // live instance of that shape; the haystack must not contain the needle.
    expect(
      portKeyspaceViolations(
        [...caps, 'provisionalX'],
        ['version-skew', 'provisional-x'],
      ),
    ).toHaveLength(1);

    // A keyspace member with no port module is legal: `model` and `versionSkew` have none.
    // …and a clean input really is clean through the same function, so the two
    // convictions above are the predicate biting, not the predicate always firing.
    expect(portKeyspaceViolations(caps, ['version-skew'])).toEqual([]);

    // And a runtime source carrying NO keyspace FAILS loudly rather than green-empty.
    expect(() => keyspace('export const SOMETHING = [] as const;')).toThrow(
      /no `CAPABILITIES` keyspace/,
    );
  });
});
