// BIN-NAME SINGLE-HOME gate.
//
// A RETIRED SHARD RECORDED that the runtime bin name had "exactly one home, so
// the rebrand is a one-line change". It did not. The literal stood in SEVEN places
// across FOUR packages, and THREE of those were inside emitted strings — a projected
// `scripts/<cap>.mjs`, a generated hook `.sh` — where no compiler can see them. A
// rename that missed one shipped a deployed script that failed at RUNTIME ON A HOST,
// not at build. This file is what makes the claim true instead of asserted.
//
// The one home is `@cratylus/runtime/bin-name` → `CLI_BIN`. Every consumer
// interpolates it. This gate holds the three consumers to it, each by CAPTURE-AND-
// COMPARE — read back the name the artifact actually carries and compare it to the
// constant — so editing one without the other is red, in either direction:
//
//   (1) `cratylus`'s `bin` MANIFEST KEY — the one irreducible second copy
//       (npm reads it with no TypeScript in the loop, so it cannot be computed).
//   (2) the runtime's Commander BRANDING (`main.ts`) — read out of `--help`.
//   (3) the PROJECTED THIN SHIM's `spawnSync` target — the operative site, read out
//       of a real `scripts/<cap>.mjs` in a real render tree.
//
// Plus a CENSUS: no file but `bin-name.ts` may spell the name as a quoted string
// literal — the shape of the defect this retires (a second `const BIN = '…'`).
//
// THIS REPOSITORY SHIPS TWO BINS, AND THEY HAVE DIFFERENT SHAPES OF HOME.
//
// `CLI_BIN` is a DECLARED constant plus a gate: `cratylus`'s `bin` key is
// a second authored spelling, npm reads it with no TypeScript in the loop, and their
// agreement is the test obligation leg (1) discharges.
//
// The forge CLI's name is DERIVED. `packages/forge/src/bin-name.ts` reads the `bin`
// key npm itself obeys, so there is exactly ONE authored spelling in that package and
// nothing to hold in agreement — the asymmetry this corpus had not noticed, since
// "npm reads the manifest, so it cannot be computed" is true of writing the manifest
// and false of reading it.
//
// This gate does NOT decide the name. The brand anchor is cratylism-gated and has
// not converged; `CLI_BIN` holds a placeholder. What is asserted is that
// flipping that ONE symbol flips the name everywhere it is operative.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { beforeAll, describe, expect, it } from 'vitest';
import canonPlugin from '../src/index.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(canonRoot, '..', '..');

/** A cell that declares a `runtime` capability — a shim carrier, and the witness
 *  this gate reads. No canon cell declares one, so the shim-carrier fixture's. */
const CELL = 'carrier';
const CAPABILITY = 'versionSkew';
const carrierPlugin = {
  name: 'shim-carrier',
  skills: join(canonRoot, 'test', 'fixtures', 'shim-carrier', 'skills'),
};

/**
 * Every source file that SPEAKS the bin name, and must therefore not SPELL it.
 *
 * `canon/src/hooks/memory-consolidation-nudge.ts` — the one canon cell that ever
 * imported `CLI_BIN` — is deleted along with the memory skill triad it served
 * (property 1 forbids the edge; there is now nothing here to hold against it).
 */
const CONSUMERS = [
  'packages/runtime/src/main.ts',
  'packages/cli/src/cratylus.ts',
  'packages/forge/src/project/runtime-shim.ts',
  // `packages/cli/src/install.ts` WAS HERE and is DELETED with the module it named.
  // It was the one `.ts` that WROTE a `#!/bin/sh` shim onto a host, so it needed
  // watching from here rather than from the `.sh`/`.mjs` glob leg below.
  //
  // The module is gone because its warrant expired: it authored this host's PATH
  // binding only because the package could not be installed, guessing a bin dir
  // (`$CRATYLUS_BIN_DIR` ▸ `$PNPM_HOME` ▸ `~/.local/bin`) and writing an ABSOLUTE
  // path into a checkout. `npm i -g cratylus` hands that job to the package manager,
  // which is whose job it always was. Nothing in this repository writes an executable
  // onto a host any more, which is why this roster has one fewer entry rather than a
  // replacement.
] as const;

const read = (rel: string): string =>
  readFileSync(join(repoRoot, rel), 'utf-8');

/** The command's ONE home read the way npm reads it — the `bin` key, no compiler in
 *  the loop. A shell worker cannot import the constant, so a worker that SPELLS the
 *  name is held against this.
 *
 *  THERE IS ONE COMMAND. This derived a build bin here and imported a separate
 *  run-time bin below, because `cratylus` and `cratylus-run` were two programs.
 *  Merging them made the second a duplicate of the first. */
const HUB_MANIFEST = JSON.parse(read('packages/cli/package.json')) as {
  name: string;
  bin: Record<string, string>;
};

// A REAL render tree, not a hand-rolled emitter call: the shim under test is the
// one the projector puts in the tree install places.
let projectedShim = '';

beforeAll(async () => {
  const report = await projectPluginSet({
    plugins: [canonPlugin, carrierPlugin],
    adapter: adapterByName('omp'),
  });
  projectedShim =
    report.files.find(
      (f) => f.path === `skills/${CELL}/scripts/${CAPABILITY}.mjs`,
    )?.content ?? '';
}, 120_000);

// Every hand-authored shell/`.mjs` source under each package's `src`: the ones a human
// wrote and no compiler
// reads. (Line comments, not a block: a glob like `packages/*` + `/src` would close a
// block comment early at the `*` `/` pair — which is how this leg first failed to parse.)
function shellSources(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.sh') || e.name.endsWith('.mjs'))
        out.push(relative(repoRoot, full));
    }
  };
  for (const pkg of readdirSync(join(repoRoot, 'packages'), {
    withFileTypes: true,
  })) {
    // `src/` AND `tooling/`. Canon's build scripts left `src/` for `tooling/` — a
    // sibling, not a child — because the build excludes them and `src/` asserts the
    // opposite. A sweep that still said `src` alone would have dropped every shell and
    // `.mjs` under `tooling/` out of this law's reach and reported the corpus cleaner
    // for it. The subject did not move out of the corpus; only this sweep's idea of
    // where the corpus lives would have gone stale.
    for (const root of ['src', 'tooling', 'targets']) {
      const dir = join(repoRoot, 'packages', pkg.name, root);
      if (pkg.isDirectory() && existsSync(dir)) walk(dir);
    }
  }
  return out.sort();
}

/** Bins this repository has actually shipped and retired. A rename that stops at the
 *  language boundary leaves one of these behind in a file no compiler reads. */
const RETIRED_BINS = ['agent-runtime', 'agent-cli'] as const;

/** Whether a defaulted binary is OURS. Third-party programs a worker shells out to
 *  (`claude`, `jq`, `git`) are out of scope: this gate is about one repository's own
 *  bin surviving a rename, not about every command a script may invoke. */
const OURS = new RegExp(`^(cratylus|${RETIRED_BINS.join('|')})`);

describe('the bin name has exactly one home', () => {
  it('no consumer spells the name — only `bin-name.ts` declares it', () => {
    // The defect shape this retires: a SECOND `const BIN = 'runtime'`. The
    // home declares it once; nobody else may write it as a string literal.
    const home = read('packages/runtime/src/bin-name.ts');
    const decl = home.match(
      new RegExp(`export const CLI_BIN = '${CLI_BIN}';`, 'g'),
    );
    expect(decl).toHaveLength(1);

    // NO `toContain('CLI_BIN')` HERE, deliberately. It asserted a MENTION, which
    // a comment satisfies and a live interpolation is not required to; worse, it was
    // the half of this gate that made importing the symbol the only admissible
    // mechanism, which is how a test came to require an architecture breach. What
    // each consumer actually owes is that the name it EMITS equals the constant, and
    // that is asserted below by capture-and-compare, per consumer.
    for (const rel of CONSUMERS) {
      const src = read(rel);
      expect(
        { file: rel, spellsIt: src.includes(`'${CLI_BIN}'`) },
        `${rel} must interpolate CLI_BIN, not spell the bin name`,
      ).toEqual({ file: rel, spellsIt: false });
    }
  });

  it("the hub package's `bin` manifest key agrees with CLI_BIN", () => {
    // The one copy no compiler can reach. If a rename flips the constant and not
    // this key, the installed executable and everything that spawns it disagree —
    // and nothing but this assertion notices.
    const manifest = JSON.parse(read('packages/cli/package.json')) as {
      bin: Record<string, string>;
    };
    // TWO BINS, ONE PACKAGE — and the set is asserted EXACTLY, not by membership.
    // The hub ships both commands: `cratylus` at build time, `cratylus` at run
    // time. They stay separate COMMANDS because they serve separate DAGs; shipping
    // them from one package is what makes that a seam rather than a second install.
    //
    // Exact equality is the point. `toContain` would let a third bin appear
    // unnoticed, and the whole subject here is that every executable name npm puts
    // on a PATH is accounted for.
    // ONE BIN. This asserted a two-element set back when `cratylus` and
    // `cratylus-run` were separate commands; merging them made the second entry a
    // duplicate of the first, which is how a symbol sweep reports a concept that
    // stopped existing.
    expect(Object.keys(manifest.bin)).toEqual([CLI_BIN]);
  });

  it("the BUILT command's help is branded CLI_BIN", () => {
    // The emitted bin run the way a shell runs it. Capture the brand the help
    // printed, then compare — not `toContain`, which would still pass if the help
    // named a stale bin alongside the right one.
    const help = execFileSync(
      'node',
      [join(repoRoot, 'packages', 'cli', 'dist', 'cratylus.js'), '--help'],
      { encoding: 'utf8' },
    );
    expect(help.match(/^Usage: (\S+) /m)?.[1]).toBe(CLI_BIN);
  });

  it('the PROJECTED thin shim spawns CLI_BIN — the operative site', () => {
    // THE FALSIFIER for the site that broke on a host. Capture whatever argv[0] the
    // emitted `scripts/<cap>.mjs` actually spawns and compare it to the constant, so
    // hardcoding a literal back into the emitter — or flipping the constant without
    // the emitter — is red here rather than at deploy time on someone's machine.
    expect(projectedShim, 'projection produced no shim').not.toBe('');
    const spawned = projectedShim.match(/spawnSync\('([^']+)',/)?.[1];
    expect(spawned).toBe(CLI_BIN);
    expect(projectedShim).toContain(`['${CAPABILITY}',`);
  });
});

// ── THE CONVICTING FIXTURES ─────────────────────────────────────────────────────
//
// A gate over a clean corpus is green whether it works or is DARK. Each assertion
// above is capture-and-compare; these feed the SAME comparison a corpus in which
// exactly one site was edited and the other was not — the half-landed rename — and
// assert it is rejected. Without them, "the bin name has one home" is a claim of the
// same kind the retired shard above already made — asserted, unmeasured, and wrong.

/** The two capture-and-compare predicates, isolated from their live inputs so a
 *  synthetic BAD corpus can be fed to the very same code the gate above runs. */
const spawnedBin = (shim: string): string | undefined =>
  shim.match(/spawnSync\('([^']+)',/)?.[1];
const manifestBins = (json: string): string[] =>
  Object.keys((JSON.parse(json) as { bin: Record<string, string> }).bin);

// ── the LANGUAGE BOUNDARY — the property that cost this session a dead `/wake` ──
//
// Every leg above reads TypeScript or an artifact reached by a name the corpus hands
// it. But the bin's operative sites are shell and `.mjs`: text no compiler reads, and
// exactly where a missed rename fails ON A HOST rather than at build. On 2026-08-05
// that is precisely what happened — a stale
// bin stranded every deployed shim — `/wake`'s (since retired) among them — and
// the repository was green throughout.
//
// The scan is a GLOB, deliberately. Only ONE of the thirteen hand-authored shell/`.mjs`
// sources currently names the bin, so a roster would encode that accident and go quiet
// the moment a fourteenth file is added. Enumerate the domain, then judge each member.
it('EVERY hand-authored shell or .mjs source under packages/*/src derives the bin', () => {
  const sources = shellSources();
  expect(
    sources.length,
    'no shell/.mjs source found under packages/*/{src,tooling,targets} — the scan is DARK, not the corpus clean',
  ).toBeGreaterThan(0);

  const drifted: string[] = [];
  for (const rel of sources) {
    const text = readFileSync(join(repoRoot, rel), 'utf8');
    // A `${SOMETHING_BIN:-<token>}` default IS the bin, spelled. It must be the
    // current one; any other token is a rename that stopped at the boundary.
    for (const m of text.matchAll(/\$\{[A-Z_]*BIN:-([^}]+)\}/g)) {
      const dflt = m[1] as string;
      // SCOPED BY WHOSE BIN IT IS, not by the variable's shape. The first version of
      // this leg matched any `*_BIN` and convicted `${STANCE_JUDGE_BIN:-claude}` — a
      // THIRD-PARTY program, not ours. A detector that fires on the shape of a name
      // rather than on its referent is the same error this corpus keeps finding in prose.
      if (!OURS.test(dflt)) continue;
      if (dflt !== CLI_BIN)
        drifted.push(`${rel}: defaults to \`${dflt}\`, not \`${CLI_BIN}\``);
    }
    // A retired bin name anywhere in these files is the same defect without the shape.
    for (const retired of RETIRED_BINS) {
      if (text.includes(retired))
        drifted.push(`${rel}: names the retired bin \`${retired}\``);
    }
  }
  expect(drifted, 'the bin name drifted past the language boundary').toEqual(
    [],
  );
});

// ── THE FORGE BIN'S CENSUS — the shard's own premise, falsified and repaired ────
//
// The shard that authored this leg asserted `git grep cratylus -- packages/forge/src`
// "returns NOTHING: the forge CLI's own executable name has no home in any TypeScript
// module." The first half was false. The name had no AUTHORED HOME, which is what the
// derivation now supplies — and it also had TWENTY-SIX occurrences across ten modules,
// fifteen of them in live operator-facing strings: every `cratylus <verb>: <error>`
// prefix, the `run \`forge init\` first` hints (naming a program that never existed),
// the copy-pasteable `ship it with: …` line, and `cac('forge')`, which branded every
// line of `--help` with a name no host installs.
//
// None of that fails a compiler and none of it fails at build; it fails when an
// operator types what they were told to type. So the census is a gate at ZERO rather
// than a ratchet: the derivation exists now, so a spelling is never the cheaper option.
//
// COMMENTS ARE OUT OF SCOPE and deliberately so — prose about `cratylus install` is
// describing the command, not invoking it, and a gate that convicted prose would be
// satisfied by deleting the prose. What is scanned is code position.

/** Source with block comments and comment-only lines removed — code position. */
function codePositionOf(ts: string): string {
  return ts
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join('\n');
}

/** Occurrences of the forge bin as a bare word: not the `@cratylus/` npm scope, not
 *  `cratylus` (the runtime's bin, held by the legs above), not a URL segment. */
function spellsForgeBin(ts: string): number {
  const re = new RegExp(`(?<![@./\\w-])${CLI_BIN}(?![-\\w/])`, 'g');
  return (codePositionOf(ts).match(re) ?? []).length;
}

/** Every `.ts` under a package's `src`, repo-relative. */
function tsSources(pkg: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.ts')) out.push(relative(repoRoot, full));
    }
  };
  for (const root of ['src', 'tooling', 'targets']) {
    const dir = join(repoRoot, 'packages', pkg, root);
    if (existsSync(dir)) walk(dir);
  }
  return out.sort();
}

describe('the forge bin has exactly one authored home', () => {
  it('no module under packages/forge/src spells it in code position', () => {
    const sources = tsSources('forge');
    expect(
      sources.length,
      'no TypeScript found under packages/forge/src — the scan is DARK',
    ).toBeGreaterThan(20);
    const spelling = sources
      .map((rel) => [rel, spellsForgeBin(read(rel))] as const)
      .filter(([, n]) => n > 0)
      .map(([rel, n]) => `${rel}: ${n}`);
    expect(
      spelling,
      'these spell the forge bin instead of interpolating CLI_BIN',
    ).toEqual([]);
  });

  it('the census DETECTOR is not simply always-empty', () => {
    // The failure this whole file was written against, one bin over: a scan whose
    // predicate quietly stopped matching is green over any corpus. Feed it the
    // defect it exists to catch, and the two shapes it must NOT catch.
    expect(spellsForgeBin(`const x = '${CLI_BIN} install';`)).toBe(1);
    expect(spellsForgeBin(`import x from '@${CLI_BIN}/forge';`)).toBe(0);
    // A BARE SPELLING IS THE DEFECT NOW. This expected 0 because the string was the
    // OTHER command's name — `cratylus-run` was not the build bin, so spelling it
    // here was somebody else's business. There is one command; every spelling of it
    // in code position is this gate's business.
    expect(spellsForgeBin(`const x = '${CLI_BIN}';`)).toBe(1);
    // and prose is out of scope, in both comment shapes
    expect(
      spellsForgeBin(`// run \`${CLI_BIN} install\` first\nconst x = 1;`),
    ).toBe(0);
    expect(spellsForgeBin(`/* ${CLI_BIN} install */\nconst x = 1;`)).toBe(0);
  });

  it('the CLI brands its help with the name it is installed under', () => {
    // A program named for a name no host installs printed `$ forge <command>` in
    // every help block — the same class of defect as a stale bin in a shim, except
    // it never needed a rename to become false. Captured off the source's program
    // declaration, compared to the derived name. Anchored at the DECLARATION, not
    // the first `new Command(` in the file: the headers above it quote the defect
    // they retire, and an unanchored match reads prose about the code instead of
    // the code.
    const branded = read('packages/cli/src/cratylus.ts').match(
      /^\s*const program = new Command\(([^)]+)\)/m,
    )?.[1];
    expect(branded, 'the CLI must brand itself from the derived name').toBe(
      'CLI_BIN',
    );
  });
});

describe('the single-home gate is non-vacuous', () => {
  const STALE = `${CLI_BIN}-stale`;

  it('FAILS on a thin shim whose spawn target drifted from the constant', () => {
    const drifted = projectedShim.replace(
      `spawnSync('${CLI_BIN}'`,
      `spawnSync('${STALE}'`,
    );
    expect(drifted).not.toBe(projectedShim); // the mutation actually landed
    expect(spawnedBin(projectedShim)).toBe(CLI_BIN);
    expect(spawnedBin(drifted)).not.toBe(CLI_BIN);
  });

  it('FAILS on a manifest whose `bin` key drifted from the constant', () => {
    const good = read('packages/cli/package.json');
    const drifted = good.replace(`"${CLI_BIN}":`, `"${STALE}":`);
    expect(drifted).not.toBe(good);
    expect(manifestBins(good)).toEqual([CLI_BIN]);
    expect(manifestBins(drifted)).not.toEqual([CLI_BIN]);
  });

  it('FLAGS a consumer that spells the bin name instead of importing it', () => {
    const clean = read('packages/forge/src/project/runtime-shim.ts');
    const regressed = clean.replace(
      "spawnSync('${CLI_BIN}'",
      `spawnSync('${CLI_BIN}'`,
    );
    expect(regressed).not.toBe(clean);
    expect(clean.includes(`'${CLI_BIN}'`)).toBe(false);
    expect(regressed.includes(`'${CLI_BIN}'`)).toBe(true);
  });
});
