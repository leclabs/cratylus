// TWO writers provision an agent home and they must emit ONE set of bytes.
//
// `memory init` writes the stores from `src/seeds.ts`; forge's deploy seed site
// (`forge/src/deploy/local.ts`, iterating `SEED_FILES`) writes them from its own
// copy in `forge/src/deploy/seeds.ts`. Those copies DRIFTED — one told the agent
// "deploy never overwrites me", the other "`memory init` never overwrites me" —
// so which prose an agent's SEMANTIC.md carried depended on which tool reached
// the home first, and whichever sentence it got was false half the time.
//
// The copies cannot be collapsed into one module here: `ARCHITECTURE.md`'s
// north-star graph has no `forge → memory` edge, so forge importing
// `seedTemplates` is an architecture amendment, not a refactor. Two writers are
// therefore allowed — on the condition this test makes drift IMPOSSIBLE TO SHIP.
//
// This asserts on the EMITTED BYTES, not on the source text, so it is blind to
// formatting and blind to nothing else: change one character of prose in either
// file and it goes red.
//
// Forge is reached BY PATH, deliberately. A static `import '@cratylus/memory'`
// (or the reverse) would add the very package edge the north star refuses; a
// path load is a test-time read of a sibling file and adds no dependency to
// either manifest.
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seedTemplates } from '../src/seeds.js';

type SeedTable = ReadonlyArray<[string, (name: string) => string]>;

const FORGE_SEEDS = fileURLToPath(
  new URL('../../forge/src/deploy/seeds.ts', import.meta.url),
);

/** Forge's parallel copy, loaded by path — see the header: no package edge. */
const forgeSeedFiles: SeedTable = await (async () => {
  const mod = (await import(/* @vite-ignore */ FORGE_SEEDS)) as {
    SEED_FILES: SeedTable;
  };
  return mod.SEED_FILES;
})();

// Both copies stamp the seed with `new Date()` at call time. Pinning the clock
// removes the one midnight-boundary race that could redden this suite for a
// reason that is not drift.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 5, 12, 0, 0));
});
afterAll(() => {
  vi.useRealTimers();
});

describe('seed parity: memory `seedTemplates` vs forge `SEED_FILES`', () => {
  it('seeds the same files, in the same order', () => {
    expect(forgeSeedFiles.map(([f]) => f)).toEqual(
      seedTemplates.map(([f]) => f),
    );
  });

  it.each(seedTemplates.map(([filename]) => filename))(
    'emits byte-identical %s',
    (filename) => {
      const mine = seedTemplates.find(([f]) => f === filename);
      const theirs = forgeSeedFiles.find(([f]) => f === filename);
      expect(mine, `memory seeds no ${filename}`).toBeDefined();
      expect(theirs, `forge seeds no ${filename}`).toBeDefined();

      // Several names: the name is interpolated into the prose, so a template
      // that diverges only inside the interpolation still gets caught.
      for (const name of ['developer', 'nico', 'a-b_c.9']) {
        expect(theirs![1](name), `forge's ${filename} for "${name}"`).toBe(
          mine![1](name),
        );
      }
    },
  );

  // The regression CLASS, not just the instance it took. A store that names one
  // provisioner is lying whenever the other one wrote it, so the seeded prose
  // names the PROPERTY ("seeded once, never overwritten") and no writer at all.
  //
  // The guard is on the active voice, not on a list of writer names: any
  // "<someone> never overwrites me" has a subject, and the subject is always one
  // of the two writers. That also covers a third writer nobody has added yet.
  // Whitespace is matched loosely because the prose hard-wraps, and the first
  // version of this assertion was dead for exactly that reason — the emitted
  // bytes read "deploy never\noverwrites me", which no space-literal regex hits.
  it.each(seedTemplates.map(([filename]) => filename))(
    'names no single provisioner in %s',
    (filename) => {
      const seed = seedTemplates.find(([f]) => f === filename)![1]('developer');
      expect(seed, 'seed prose must not name who writes it').not.toMatch(
        /never\s+overwrites\s+me/,
      );
    },
  );
});

// ── the convicting fixture ───────────────────────────────────────────────────
//
// Both legs above are green in two indistinguishable situations: the writers agree,
// or the comparison is DARK. The mutants were run by hand when this file was written
// (one character in forge's copy; both copies reverted to the old provisioner prose)
// and hand-run mutants do not survive the session that ran them. Encoded here so the
// controls travel with the gate.
describe('seed parity is non-vacuous', () => {
  type Seed = readonly [string, (name: string) => string];
  const bytesAgree = (a: Seed[], b: Seed[]): boolean =>
    a.length === b.length &&
    a.every(([f, fn], i) => {
      const [g, gn] = b[i] as Seed;
      return f === g && fn('developer') === gn('developer');
    });

  it('FAILS on writers that diverge by a single character', () => {
    const mine: Seed[] = [['S.md', (n) => `hello ${n}.`]];
    const theirs: Seed[] = [['S.md', (n) => `hello ${n}!`]];
    expect(bytesAgree(mine, mine)).toBe(true); // exonerates
    expect(bytesAgree(mine, theirs)).toBe(false); // convicts
  });

  it('FAILS on prose that names its own provisioner', () => {
    const named = 'deploy never\noverwrites me';
    const property = 'seeded once, never overwritten';
    expect(named).toMatch(/never\s+overwrites\s+me/); // convicts, across the wrap
    expect(property).not.toMatch(/never\s+overwrites\s+me/); // exonerates
  });

  it('FAILS on a writer that seeds a different file set', () => {
    const mine: Seed[] = [['A.md', () => 'x']];
    const theirs: Seed[] = [
      ['A.md', () => 'x'],
      ['B.md', () => 'y'],
    ];
    expect(bytesAgree(mine, theirs)).toBe(false);
  });
});
