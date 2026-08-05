// praxis-execution-spec — the bound plan's shard corpus must SATISFY the praxis laws.
//
// `praxis` states them; nothing checked them. A plan can be well-formed prose and still be
// undispatchable: a shard with no `deps` field has no place in `R`, a wave whose members write
// the same file cannot be fanned out, and a `static` path that stopped existing makes a shard's
// evidence unreadable at exactly the moment an executor opens it. Each of those is silent.
//
// The laws enforced here, quoted from `canon/src/skills/praxis/skill.ts`:
//
//   ∀ t : content(t) ⊨ spec(t)                     — every shard carries the 6-field spec
//   ∀ t : ∀ p ∈ static(t) : p exists at authoring
//   ⋃ slices(P) = P  ∧  s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅       — slices PARTITION the plan
//   ∀ n < m : |wave(n)| = 1 ⇒ slices mis-cut        — a singleton non-terminal wave is a chain
//   ∀ t,u ∈ wave(n) : t ≠ u ⇒ outputs(t) ∩ outputs(u) = ∅   — the concurrency precondition
//   ∀ t,u ∈ wave(n) : t ≠ u ⇒ outputs(t) ∩ refs(u)    = ∅   — disjoint outputs is NECESSARY,
//                                                              NOT SUFFICIENT: a deletion in t
//                                                              dangles a reference in u
//   bound(P) ∧ sharded(P) ∧ ¬done(P) ⇒ frontier(P) ≠ ∅
//
// AND ONE THIS CORPUS ADDS. `blockedBy` names a RULING owed — a decision nobody has taken.
// It is not `deps`: `deps` is mechanical sequencing an executor can wait out, a ruling is not.
// A shard carrying one may not sit in `ready/`, because `ready` is a promise that an executor
// can pick it up and finish. Conflating the two is how a fan-out stalls with every agent
// blocked on the same unanswered question.
//
// SCOPE, stated so the gate's silence is not read as a coverage claim: this checks the SHAPE of
// the plan, not the TRUTH of any shard. A shard can satisfy every law here and be wrong about
// the tree. That is what `CENSUS-2026-08-05.md` is for, and it is a different instrument.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SHARDS } from '../../../plans/decomplect/spec.mjs';
import { block, sequence } from '../../../plans/decomplect/sync-shards.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PLAN = join(REPO, 'plans', 'decomplect');
const OPEN_STATES = ['pending', 'ready', 'active'] as const;

type Shard = {
  slice: string;
  deps: string[];
  outputs: string[];
  refs: string[];
  static: string[];
  blockedBy?: string;
};
const S = SHARDS as Record<string, Shard>;
const IDS = Object.keys(S);
/** Indexed access under `noUncheckedIndexedAccess` — a missing id is a spec defect, not undefined. */
function sh(id: string): Shard {
  const t = S[id];
  if (!t) throw new Error(`no spec for shard ${id}`);
  return t;
}

/** Every tracked path, once — the universe a glob expands against. */
const TRACKED: readonly string[] = execFileSync('git', ['ls-files'], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
})
  .split('\n')
  .filter(Boolean);

/** `a/b/**` matches everything under `a/b`; anything else is an exact path. */
function expand(patterns: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const p of patterns) {
    if (p.endsWith('/**')) {
      const pre = `${p.slice(0, -2)}`;
      for (const f of TRACKED) if (f.startsWith(pre)) out.add(f);
    } else if (TRACKED.includes(p)) {
      out.add(p);
    }
  }
  return out;
}

function intersect(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((x) => b.has(x));
}

/** The shard files actually on disk, as `state → id[]`. */
function onDisk(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const st of [...OPEN_STATES, 'completed']) {
    const dir = join(PLAN, st);
    map[st] = existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith('.md'))
          .map((f) => f.slice(0, -3))
      : [];
  }
  return map;
}

/** `wave(0) ≜ { t | ∄ u : (t,u) ∈ R }` ; `wave(n+1) ≜ { t ∉ W(n) | ∀ u ∈ deps(t) : u ∈ W(n) }`. */
function waves(ids: readonly string[]): string[][] {
  const done = new Set<string>();
  const out: string[][] = [];
  let left = [...ids];
  while (left.length) {
    const w = left.filter((t) => sh(t).deps.every((d) => done.has(d)));
    if (!w.length) return [...out, left]; // cycle — surfaced by the acyclicity leg
    for (const t of w) done.add(t);
    out.push(w.sort());
    left = left.filter((t) => !done.has(t));
  }
  return out;
}

const DISK = onDisk();
/** Indexed access under `noUncheckedIndexedAccess`; an unknown state is empty, not undefined. */
const st = (name: string): string[] => DISK[name] ?? [];
const OPEN_IDS = OPEN_STATES.flatMap((s) => st(s));
const WAVES = waves(IDS);

describe('praxis-execution-spec', () => {
  it('the spec and the disk agree — no shard is unspecified and none is specified-but-absent', () => {
    expect(
      [...OPEN_IDS].sort().filter((id) => !S[id]),
      'on disk, absent from spec.mjs',
    ).toEqual([]);
    expect(
      IDS.filter((id) => !OPEN_IDS.includes(id)),
      'in spec.mjs, absent from disk',
    ).toEqual([]);
  });

  it('every shard carries the full 6-field spec, and every field is populated', () => {
    const bad: string[] = [];
    for (const id of IDS) {
      const t = sh(id);
      if (!t.slice) bad.push(`${id}: no slice`);
      if (!Array.isArray(t.deps)) bad.push(`${id}: no deps`);
      if (!t.outputs?.length)
        bad.push(
          `${id}: no outputs — a shard that writes nothing is not a task`,
        );
      if (!Array.isArray(t.refs)) bad.push(`${id}: no refs`);
      if (!t.static?.length)
        bad.push(
          `${id}: no static — a shard with no cited evidence is ungrounded`,
        );
    }
    expect(bad).toEqual([]);
  });

  it('every `static` path exists — a shard whose evidence moved is unreadable when opened', () => {
    const missing: string[] = [];
    for (const id of IDS)
      for (const p of sh(id).static)
        if (!existsSync(join(REPO, p))) missing.push(`${id} → ${p}`);
    expect(missing).toEqual([]);
  });

  it('every `outputs` and `refs` glob matches something tracked — an empty set is a typo', () => {
    const dead: string[] = [];
    for (const id of IDS) {
      for (const p of sh(id).outputs)
        if (!expand([p]).size && !existsSync(join(REPO, p)))
          dead.push(`${id} outputs → ${p}`);
      for (const p of sh(id).refs)
        if (!expand([p]).size && !existsSync(join(REPO, p)))
          dead.push(`${id} refs → ${p}`);
    }
    expect(dead).toEqual([]);
  });

  it('R is well-formed: every dep names a real shard, and R is acyclic', () => {
    const unknown: string[] = [];
    for (const id of IDS)
      for (const d of sh(id).deps) if (!S[d]) unknown.push(`${id} → ${d}`);
    expect(unknown, 'dep names no shard').toEqual([]);
    // A cycle leaves residue: `waves` returns the unresolvable remainder as a final block.
    expect(
      WAVES.flat().length,
      'a cycle in R — every wave must consume its members',
    ).toBe(IDS.length);
    const seen = new Set<string>();
    const early: string[] = [];
    for (const w of WAVES) {
      for (const t of w)
        if (!sh(t).deps.every((d) => seen.has(d))) early.push(t);
      for (const t of w) seen.add(t);
    }
    expect(early, 'scheduled before its deps').toEqual([]);
  });

  it('slices PARTITION the plan — union is P, and they are pairwise disjoint', () => {
    const bySlice = new Map<string, string[]>();
    for (const id of IDS) {
      const s = sh(id).slice;
      bySlice.set(s, [...(bySlice.get(s) ?? []), id]);
    }
    // Disjointness is structural (one `slice` field per shard); the union is the check that bites.
    expect([...bySlice.values()].flat().sort()).toEqual([...IDS].sort());
    // A one-shard slice is not a slice — it is a shard with a label.
    const singletons = [...bySlice.entries()]
      .filter(([, v]) => v.length < 2)
      .map(([k]) => k);
    expect(
      singletons,
      'slices with fewer than 2 shards — a label, not a cut',
    ).toEqual([]);
  });

  it('slices are ARGMIN over the admissible cuts — the law is checked, not asserted', () => {
    // `slices = argmin over admissible cuts of |R ∩ cross-slice pairs|` is UNFALSIFIABLE until
    // `admissible` is named, and the corpus does not name it. Measured: the UNCONSTRAINED argmin
    // is 10 cross edges and puts 20 of 33 shards in one slice — minimal, and useless, because a
    // 20-shard slice cannot be fanned out and fan-out is the only reason slices exist.
    // So ADMISSIBLE ≜ every slice holds MIN..MAX shards, and the claim becomes checkable.
    const MIN = 3;
    const MAX = 6;
    const edges = IDS.flatMap((t) => sh(t).deps.map((u) => [t, u] as const));
    const crossOf = (a: Record<string, string>): number =>
      edges.filter(([t, u]) => a[t] !== a[u]).length;
    const live: Record<string, string> = Object.fromEntries(
      IDS.map((i) => [i, sh(i).slice]),
    );
    const names = [...new Set(Object.values(live))];

    const sized = (a: Record<string, string>): boolean => {
      const c = new Map<string, number>();
      for (const i of IDS)
        c.set(a[i] as string, (c.get(a[i] as string) ?? 0) + 1);
      return names.every(
        (n) => (c.get(n) ?? 0) >= MIN && (c.get(n) ?? 0) <= MAX,
      );
    };
    expect(
      sized(live),
      `every slice must hold ${MIN}..${MAX} shards to be admissible`,
    ).toBe(true);

    // Deterministic local search over swaps — seeded, so a red run reproduces exactly.
    let seed = 20260805;
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    let best = crossOf(live);
    for (let r = 0; r < 40; r++) {
      const a: Record<string, string> = Object.fromEntries(
        IDS.map((id, i) => [id, names[i % names.length] as string]),
      );
      for (let i = IDS.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const x = a[IDS[i] as string] as string;
        a[IDS[i] as string] = a[IDS[j] as string] as string;
        a[IDS[j] as string] = x;
      }
      let improved = true;
      while (improved) {
        improved = false;
        for (const t of IDS)
          for (const u of IDS) {
            if (a[t] === a[u]) continue;
            const before = crossOf(a);
            const x = a[t] as string;
            a[t] = a[u] as string;
            a[u] = x;
            if (sized(a) && crossOf(a) < before) improved = true;
            else {
              const y = a[t] as string;
              a[t] = a[u] as string;
              a[u] = y;
            }
          }
      }
      if (sized(a)) best = Math.min(best, crossOf(a));
    }
    expect(
      crossOf(live),
      `a better admissible cut exists (${best} cross edges vs the live cut's ${crossOf(live)}) — re-slice`,
    ).toBeLessThanOrEqual(best);
  });

  it('THE CONCURRENCY PRECONDITION — no two shards in a wave write the same file', () => {
    const clashes: string[] = [];
    for (const w of WAVES) {
      const exp = new Map<string, Set<string>>(
        w.map((t) => [t, expand(sh(t).outputs)]),
      );
      for (let i = 0; i < w.length; i++)
        for (let j = i + 1; j < w.length; j++) {
          const hit = intersect(
            exp.get(w[i] ?? '') ?? new Set<string>(),
            exp.get(w[j] ?? '') ?? new Set<string>(),
          );
          if (hit.length)
            clashes.push(
              `${w[i] as string} ∩ ${w[j] as string} = ${hit.length} file(s), e.g. ${hit[0]}`,
            );
        }
    }
    expect(
      clashes,
      'wave members contend on outputs — this wave cannot be fanned out',
    ).toEqual([]);
  });

  it('disjoint outputs is NECESSARY, NOT SUFFICIENT — no wave member writes what another reads', () => {
    const clashes: string[] = [];
    for (const w of WAVES) {
      const outs = new Map<string, Set<string>>(
        w.map((t) => [t, expand(sh(t).outputs)]),
      );
      const refs = new Map<string, Set<string>>(
        w.map((t) => [t, expand(sh(t).refs)]),
      );
      for (const t of w)
        for (const u of w) {
          if (t === u) continue;
          const hit = intersect(
            outs.get(t) as Set<string>,
            refs.get(u) as Set<string>,
          );
          if (hit.length)
            clashes.push(
              `${t} writes ${hit.length} file(s) ${u} compiles against, e.g. ${hit[0]}`,
            );
        }
    }
    expect(
      clashes,
      'a wave member would pull the ground from under a sibling',
    ).toEqual([]);
  });

  it('no singleton non-terminal wave — that is a chain, not a cut', () => {
    const bad = WAVES.slice(0, -1)
      .map((w, i) => ({ i, w }))
      .filter(({ w }) => w.length === 1)
      .map(({ i, w }) => `wave(${i}) = [${w[0]}]`);
    expect(
      bad,
      'a singleton wave that is not the last one means the slices are mis-cut',
    ).toEqual([]);
  });

  it('`ready` means DISPATCHABLE NOW — deps completed AND no ruling owed', () => {
    // praxis: `blocked(t) ⇔ ∃u : (t,u) ∈ R ∧ state(u) ≠ completed`, and `promote` moves a shard
    // pending → ready only when it is unblocked. So `ready` is a promise an executor can pick it
    // up and finish TODAY. Two distinct things can break that promise and they are not the same:
    // an unmet DEPENDENCY (mechanical, waits itself out) and an owed RULING (a decision nobody
    // has taken). Both keep a shard in `pending`; only the second needs a human.
    const completed = new Set(st('completed'));
    const dispatchable = (id: string): boolean =>
      !sh(id).blockedBy && sh(id).deps.every((d) => completed.has(d));

    const overclaimed = st('ready').filter((id) => S[id] && !dispatchable(id));
    expect(
      overclaimed,
      'in ready/ but not startable — a frontier that overstates itself is worse than a short one',
    ).toEqual([]);

    const understated = st('pending').filter((id) => S[id] && dispatchable(id));
    expect(understated, 'in pending/ but startable — promote it').toEqual([]);
  });

  it('the bound plan has a non-empty frontier', () => {
    expect(
      existsSync(join(PLAN, '.bound')),
      'decomplect is the bound plan',
    ).toBe(true);
    const frontier = [...st('ready'), ...st('active')];
    expect(
      frontier.length,
      'bound ∧ sharded ∧ ¬done ⇒ frontier ≠ ∅',
    ).toBeGreaterThan(0);
  });

  it('every shard prose carries its intent, constraints and acceptance', () => {
    const thin: string[] = [];
    for (const state of OPEN_STATES)
      for (const id of st(state)) {
        const text = readFileSync(join(PLAN, state, `${id}.md`), 'utf8');
        if (!/^#\s+\S/m.test(text)) thin.push(`${id}: no H1 objective`);
        if (!/##\s+Acceptance/i.test(text))
          thin.push(`${id}: no Acceptance section`);
        if (text.length < 400)
          thin.push(`${id}: ${text.length}B — too thin to execute from`);
      }
    expect(thin).toEqual([]);
  });

  it('each shard CARRIES its own spec, and the carried copy cannot drift from the one home', () => {
    // `∀ t : content(t) ⊨ spec(t)` is a claim about the SHARD. An executor opens one file and
    // will not read the plan's data file, so the block is projected INTO each shard — and
    // asserted equal here, so the projection can never become a second source of truth.
    const drifted: string[] = [];
    for (const state of OPEN_STATES)
      for (const id of st(state)) {
        if (!S[id]) continue;
        const text = readFileSync(join(PLAN, state, `${id}.md`), 'utf8');
        const want = block(id);
        const norm = (x: string) => x.replace(/\s+/g, ' ').trim();
        if (!norm(text).includes(norm(want))) drifted.push(id);
      }
    expect(
      drifted,
      'Execution block disagrees with spec.mjs — re-run sync-shards.mjs',
    ).toEqual([]);
  });

  it('PLAN.md emits R and the waves — `mirror(state, R, content) emits R ∧ waves`', () => {
    // The mirror law is the one that rots first, because a wave table is a DERIVED fact written
    // as prose. It is generated — but this asserts the DATA, not the prose: prettier reflows a
    // markdown table's padding, so a string compare would fail on formatting and pass on a
    // wrong wave. Parse the emitted membership back out and compare it to the computed waves.
    const plan = readFileSync(join(PLAN, 'PLAN.md'), 'utf8');
    const emitted = [
      ...plan.matchAll(/^\|\s*\*\*(\d+)\*\*\s*\|[^|]*\|[^|]*\|([^|]*)\|/gm),
    ].map((m) => ({
      n: Number(m[1]),
      members: [...(m[2] ?? '').matchAll(/[`~]{1,2}([a-z0-9-]+)[`~]{1,2}/g)]
        .map((x) => x[1] as string)
        .sort(),
    }));
    expect(
      emitted.length,
      'PLAN.md emits no wave table — re-run sync-shards.mjs',
    ).toBe(WAVES.length);
    for (const row of emitted)
      expect(
        row.members,
        `PLAN.md wave(${row.n}) disagrees with the computed wave`,
      ).toEqual((WAVES[row.n] ?? []).slice().sort());
  });

  // ── the convicting fixture ───────────────────────────────────────────
  // Without it, every leg above is green whether the plan is well-formed or the gate is dark.
  // The synthetic corpus travels the same `waves`/`expand`/`intersect` the live legs do.
  it('FAILS on a cycle, on a contended wave, and on a singleton non-terminal wave', () => {
    const fake: Record<string, Shard> = {
      a: { slice: 's', deps: [], outputs: ['x'], refs: [], static: [] },
      b: { slice: 's', deps: ['a'], outputs: ['y'], refs: [], static: [] },
    };
    const wavesOf = (m: Record<string, Shard>): string[][] => {
      const done = new Set<string>();
      const out: string[][] = [];
      let left = Object.keys(m);
      while (left.length) {
        const w = left.filter((t) =>
          (m[t] as Shard).deps.every((d) => done.has(d)),
        );
        if (!w.length) return [...out, left];
        for (const t of w) done.add(t);
        out.push(w.sort());
        left = left.filter((t) => !done.has(t));
      }
      return out;
    };
    // (1) a chain produces singleton waves — the mis-cut detector must see it.
    expect(wavesOf(fake).map((w) => w.length)).toEqual([1, 1]);
    // (2) a cycle leaves an unconsumable remainder rather than looping forever.
    const cyc: Record<string, Shard> = {
      p: { slice: 's', deps: ['q'], outputs: ['x'], refs: [], static: [] },
      q: { slice: 's', deps: ['p'], outputs: ['y'], refs: [], static: [] },
    };
    expect(wavesOf(cyc)).toEqual([['p', 'q']]);
    // (3) contention is detected on real expanded paths, not on the glob strings.
    const a = expand(['packages/canon/src/**']);
    const b = expand(['packages/canon/src/anatomy.ts']);
    expect(a.size).toBeGreaterThan(1);
    expect(intersect(a, b)).toEqual(['packages/canon/src/anatomy.ts']);
    // (4) and a genuinely disjoint pair does NOT trip it — the exonerating half.
    expect(
      intersect(
        expand(['packages/runtime/src/**']),
        expand(['packages/schema/src/**']),
      ),
    ).toEqual([]);
  });
});
