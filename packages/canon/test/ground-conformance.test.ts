// GROUND-CONFORMANCE — does a source enumeration contradict the ground document it
// claims to realize?
//
// THE PROPERTY. `MODEL.md`, `VISION.md` and `ARCHITECTURE.md` are hand-authored
// GROUND: never generated from source, never revised to match it — `ARCHITECTURE.md`,
// *"Where the two disagree, the source is wrong."* For a ground enumeration `G` and a
// source enumeration `S` purporting to realize it:
//
//   S ⊂ G  — REFINEMENT. **Legal.** The source under-realizes and the residue is a
//            KNOWN GAP: nameable, schedulable, convictable, because every member of
//            the gap is still written down in ground.
//   S ⊃ G  — **DEFECT, always.** A source member with no ground peer is a concept
//            admitted with NO HOME IN GROUND. It is unconvictable BY CONSTRUCTION,
//            because ground is the only thing that could have convicted it — there
//            is nothing left to compare it against.
//   both   — TWO findings, never one. Netting the directions against each other
//            hides a defect inside the legal direction and reports "diverges".
//
// The asymmetry is not stylistic. A source may under-realize ground and say so; it
// may never EXTEND ground. **Extending ground from source is how a document stops
// being ground** — the amendment gets written by the very thing the document exists
// to judge, and from then on it judges nothing.
//
// THE FIRST APPLICATION, and why the gate is asserted `⊆` and never `=`.
// `forge/src/validate/accept.ts` declared `AcceptCell['kind']` with a FIFTH member,
// `'hook'`, against `MODEL.md:10`'s `Kind ≜ {fragment, agent, rule, skill}` —
// S ⊃ G, a defect. It was ruled by DELETING the member. MODEL WAS NOT AMENDED, and
// the cheap direction is worth naming because it is the one a reader will re-propose:
// adding `hook` to MODEL would have deleted the corpus's own best-argued type comment
// (`schema/src/hook-cell.ts:6-10` — a hook *"is what a HARNESS calls its mechanism;
// it is not a Kind of thing the canon authors"*), contradicted the same file's
// classing of that cell as `Kind ∋ rule`, and overwritten `MODEL.md:20`, which
// convicts this exact error BY NAME (*"binding them made `hook` a Kind and hid
// enforcement from composition"*). It would have converted a defect into ground.
//
// WHY THE ENUMERATIONS ARE PARSED, NOT TRANSCRIBED. A gate holding its own copy of
// `Kind ≜ {…}` is the same defect one level up: the copy is a source enumeration
// purporting to realize ground, unwatched, and it drifts silently the first time
// MODEL moves. Both sides are read from their DECLARATION SITES — ground from
// `MODEL.md`'s own bytes, source from the `interface AcceptCell` body — so the only
// way to change what this gate asserts is to change what it reads.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(canonRoot, '..', '..');

const MODEL_MD = join(repoRoot, 'MODEL.md');
const ACCEPT_TS = join(
  repoRoot,
  'packages',
  'forge',
  'src',
  'validate',
  'accept.ts',
);

// ── the property, as a pure predicate ────────────────────────────────────────────

/** One divergence, in ONE direction. Two directions ⇒ two of these. */
interface Finding {
  /** `S∖G` ⇒ DEFECT (source extends ground) · `G∖S` ⇒ REFINEMENT (legal gap). */
  readonly direction: 'DEFECT' | 'REFINEMENT';
  readonly members: readonly string[];
  readonly reason: string;
}

/**
 * The property. Returns 0, 1, or 2 findings — never a single netted verdict, because
 * a source that both under-realizes AND extends ground has done two different things
 * and only one of them is legal.
 */
function groundConformance(
  ground: ReadonlySet<string>,
  source: ReadonlySet<string>,
): Finding[] {
  const findings: Finding[] = [];
  const extends_ = [...source].filter((m) => !ground.has(m)).sort();
  const gap = [...ground].filter((m) => !source.has(m)).sort();
  if (extends_.length > 0) {
    findings.push({
      direction: 'DEFECT',
      members: extends_,
      reason: `source extends ground (S⊃G): ${extends_.join(', ')} — admitted with no ground peer, so nothing can convict it`,
    });
  }
  if (gap.length > 0) {
    findings.push({
      direction: 'REFINEMENT',
      members: gap,
      reason: `source under-realizes ground (S⊂G): ${gap.join(', ')} — a known gap, legal`,
    });
  }
  return findings;
}

/** The DEFECT half — the only direction that fails a gate. */
function defects(findings: readonly Finding[]): Finding[] {
  return findings.filter((f) => f.direction === 'DEFECT');
}

// ── the two declaration-site parsers ─────────────────────────────────────────────

/**
 * A ground enumeration `Name ≜ {a, b, c}`, read from a ground document's own bytes.
 * Members are bare signs; a `⟨…⟩` gloss after the brace is not part of the set.
 */
function groundEnum(doc: string, name: string): Set<string> {
  const re = new RegExp(`^${name}\\s*≜\\s*\\{([^}]*)\\}`, 'm');
  const m = re.exec(doc);
  if (m === null) {
    throw new Error(
      `groundEnum: no \`${name} ≜ {…}\` in the ground document — the parse is DARK, not the set empty`,
    );
  }
  return new Set(
    (m[1] as string)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}

/**
 * A source enumeration: a string-literal union field, read from the `interface`
 * body that declares it. Scoped to the interface so the surrounding PROSE — which
 * legitimately quotes both the old union and MODEL's set — cannot feed the parse.
 */
function sourceUnion(src: string, iface: string, field: string): Set<string> {
  const open = src.indexOf(`export interface ${iface} {`);
  if (open < 0) {
    throw new Error(
      `sourceUnion: no \`export interface ${iface}\` — parse is DARK`,
    );
  }
  const close = src.indexOf('\n}', open);
  const body = src.slice(open, close < 0 ? undefined : close);
  const decl = new RegExp(`readonly ${field}\\s*:\\s*([^;]+);`).exec(body);
  if (decl === null) {
    throw new Error(
      `sourceUnion: \`${iface}\` declares no \`${field}\` — parse is DARK`,
    );
  }
  const members = [...(decl[1] as string).matchAll(/'([^']+)'/g)].map(
    (m) => m[1] as string,
  );
  if (members.length === 0) {
    throw new Error(
      `sourceUnion: \`${iface}.${field}\` is not a string-literal union — parse is DARK`,
    );
  }
  return new Set(members);
}

// ── the RATCHET — ground/source pairs NOT yet watched (declared debt, not silence) ─
//
// Each row is a real ground enumeration with a real source peer that this gate does
// NOT yet compare. Declaring them is the point: an unwatched pair that nobody wrote
// down is indistinguishable from one that does not exist. Rows are SHRINK-ONLY —
// a row leaves by growing a leg above, never by deletion.
//
// Both rows below are currently `=` (source neither extends nor under-realizes) and
// UNWATCHED, so either could drift to `⊃` with nothing to catch it.

interface RatchetRow {
  /** The ground enumeration: document + the `≜` name it is declared under. */
  readonly ground: { readonly doc: string; readonly name: string };
  /** The source peer purporting to realize it. */
  readonly source: { readonly file: string; readonly locus: string };
  readonly note: string;
}

const RATCHET: readonly RatchetRow[] = [
  {
    ground: { doc: 'MODEL.md', name: 'ActivationMode' },
    source: {
      file: 'packages/forge/src/validate/accept.ts',
      locus: 'unrealized',
    },
    note: 'MODEL:18 `ActivationMode ≜ {compose-only, identity, scope, trigger}` — the Kind-typical DEFAULTS at MODEL:19 are prose in several source comments and no single source enumeration owns them yet. The same line that convicted the fifth Kind lives here (`binding them made hook a Kind`), so this is the pair most likely to re-acquire an `event` member.',
  },
  {
    ground: { doc: 'MODEL.md', name: 'Universal' },
    source: {
      file: 'packages/forge/src/validate/accept.ts',
      locus: 'UNIVERSAL_LEGS',
    },
    note: 'MODEL:41 `Universal ≜ CANONICAL ∧ SIGNIFIED ∧ COLD-BLIND ∧ PARTITIONED ∧ PARSIMONIOUS ∧ ENFORCED ∧ REGENERABLE` — seven legs, declared as a `∧`-chain rather than a `≜ {…}` set, so `groundEnum` cannot read it as written. `UNIVERSAL_LEGS` (accept.ts:40-48) currently `=` it exactly, and is unwatched: an eighth leg invented in source would be a DEFECT with nothing to convict it.',
  },
];

// ── the legs ─────────────────────────────────────────────────────────────────────

describe('GROUND-CONFORMANCE — source may refine ground (S⊂G); it may never extend it (S⊃G)', () => {
  const model = readFileSync(MODEL_MD, 'utf8');
  const accept = readFileSync(ACCEPT_TS, 'utf8');

  it('reads both enumerations from their declaration sites — an empty parse is DARK, not clean', () => {
    const G = groundEnum(model, 'Kind');
    const S = sourceUnion(accept, 'AcceptCell', 'kind');
    // No transcribed expectation of WHAT the sets are — that copy would be the very
    // defect this file convicts. Only that each parse actually found a set, and that
    // it found the member under test, so a silently-empty read cannot pass ⊆.
    expect(G.size, 'MODEL.md `Kind ≜ {…}` parsed empty').toBeGreaterThan(0);
    expect(S.size, '`AcceptCell.kind` parsed empty').toBeGreaterThan(0);
    expect(
      G.has('rule'),
      'ground names the Kind this corpus’s cells claim',
    ).toBe(true);
    expect(S.has('rule'), 'source realizes that Kind').toBe(true);
  });

  it('`AcceptCell.kind` ⊆ MODEL.md `Kind` — no source member without a ground peer', () => {
    const G = groundEnum(model, 'Kind');
    const S = sourceUnion(accept, 'AcceptCell', 'kind');
    const bad = defects(groundConformance(G, S));
    expect(
      bad.map((f) => f.reason),
      `MODEL.md is GROUND and is NOT amended to admit these; delete them from source instead:\n${bad.map((f) => f.reason).join('\n')}`,
    ).toEqual([]);
  });

  it('holds ⊆ and never =, so a REFINEMENT passes: a Kind ground declares and source omits is legal', () => {
    const G = groundEnum(model, 'Kind');
    const S = sourceUnion(accept, 'AcceptCell', 'kind');
    const dropped = [...S].filter((k) => k !== 'rule');
    expect(dropped.length, 'a member to drop').toBeGreaterThan(0);
    const under = new Set([...S].filter((k) => !dropped.includes(k)));
    const findings = groundConformance(G, under);
    expect(defects(findings), 'under-realizing ground is not a defect').toEqual(
      [],
    );
    expect(findings.map((f) => f.direction)).toContain('REFINEMENT');
  });

  it('is non-vacuous — the property CONVICTS a source member with no ground peer', () => {
    const G = groundEnum(model, 'Kind');
    const S = sourceUnion(accept, 'AcceptCell', 'kind');
    // the control: the live source must PASS, or the fixture proves nothing
    expect(defects(groundConformance(G, S)), 'live control').toEqual([]);
    // the injection: assert the defect is actually PRESENT before reading the result
    const widget = new Set([...S, 'widget']);
    expect(widget.has('widget') && !G.has('widget'), 'injection landed').toBe(
      true,
    );
    const bad = defects(groundConformance(G, widget));
    expect(bad.length, 'S∪{widget} must convict').toBe(1);
    expect((bad[0] as Finding).members).toEqual(['widget']);
  });

  it('is non-vacuous — the property CONVICTS the exact fifth Kind this gate was built from', () => {
    // The historical control. `AcceptCell['kind']` shipped `'hook'` against
    // `Kind ≜ {fragment, agent, rule, skill}`; this asserts the gate would have
    // caught it, which is the only evidence that deleting the member was a ruling
    // and not an arbitrary edit.
    const G = groundEnum(model, 'Kind');
    const asShipped = new Set([
      ...sourceUnion(accept, 'AcceptCell', 'kind'),
      'hook',
    ]);
    const bad = defects(groundConformance(G, asShipped));
    expect(bad.map((f) => f.members)).toEqual([['hook']]);
  });

  it('FAILS divergence in both directions as TWO findings, not one netted verdict', () => {
    const G = new Set(['fragment', 'agent', 'rule', 'skill']);
    const S = new Set(['fragment', 'agent', 'rule', 'hook']);
    const findings = groundConformance(G, S);
    expect(findings.map((f) => f.direction)).toEqual(['DEFECT', 'REFINEMENT']);
    expect((findings[0] as Finding).members).toEqual(['hook']);
    expect((findings[1] as Finding).members).toEqual(['skill']);
  });

  // ── the ratchet — declared debt stays honest ──────────────────────────────────
  it('every RATCHET row names a live ground document and a live source file', () => {
    for (const row of RATCHET) {
      const doc = readFileSync(join(repoRoot, row.ground.doc), 'utf8');
      expect(
        doc.includes(row.ground.name),
        `${row.ground.doc} no longer mentions ${row.ground.name}`,
      ).toBe(true);
      expect(
        readFileSync(join(repoRoot, row.source.file), 'utf8').length,
        `${row.source.file} is gone`,
      ).toBeGreaterThan(0);
    }
  });

  it('no RATCHET row names a pair this gate already watches (a watched pair is not debt)', () => {
    const watched = new Set(['MODEL.md::Kind']);
    const overlap = RATCHET.filter((r) =>
      watched.has(`${r.ground.doc}::${r.ground.name}`),
    ).map((r) => r.ground.name);
    expect(
      overlap,
      `remove from RATCHET — now watched: ${overlap.join(', ')}`,
    ).toEqual([]);
  });
});
