// BIN-NAME SINGLE-HOME gate.
//
// A RETIRED SHARD RECORDED that the runtime bin name had "exactly one home, so
// the rebrand is a one-line change". It did not. The literal stood in SEVEN places
// across FOUR packages, and THREE of those were inside emitted strings — a projected
// `scripts/<cap>.mjs`, a generated hook `.sh` — where no compiler can see them. A
// rename that missed one shipped a deployed script that failed at RUNTIME ON A HOST,
// not at build. This file is what makes the claim true instead of asserted.
//
// The one home is `@cratylus/runtime/bin-name` → `RUNTIME_BIN`. Every consumer
// interpolates it. This gate holds the four consumers to it, each by CAPTURE-AND-
// COMPARE — read back the name the artifact actually carries and compare it to the
// constant — so editing one without the other is red, in either direction:
//
//   (1) `cratylus`'s `bin` MANIFEST KEY — the one irreducible second copy
//       (npm reads it with no TypeScript in the loop, so it cannot be computed).
//   (2) the runtime's cac BRANDING (`main.ts`) — read out of `--help`.
//   (3) the PROJECTED THIN SHIM's `spawnSync` target — the operative site, read out
//       of a real `scripts/<cap>.mjs` in a real render tree.
//   (4) EVERY hook worker that names the bin — swept, not enumerated: every
//       `hooks/**` file in a real render tree PLUS every committed `cellTargets()`
//       byte. Both are RESOLVED bytes, which is the only form that ever reaches a
//       host.
//
// LEG (4) WAS SITE-SPECIFIC AND IS NOW A SCAN, because the cell it named stopped
// importing `RUNTIME_BIN` — that import was ARCHITECTURE's last property-1 breach,
// and THIS FILE REQUIRED IT: `CONSUMERS` held the cell and asserted its source
// contained the symbol, so the only mechanism admitted was the import. The cell now
// carries `{{fact:runtime-bin}}` and the PROJECTOR substitutes.
//
// The replacement is strictly stronger, not a relaxation. The old leg captured ONE
// worker at ONE hard-coded path; the sweep captures every projected hook artifact and
// every committed target, so a SECOND worker acquiring the bin name is covered on the
// day it lands rather than on the day someone remembers to enumerate it. What was
// lost is `toContain('RUNTIME_BIN')` — a mention-level proxy that could never have
// distinguished a live interpolation from a stale comment, and which the
// capture-and-compare legs subsume in every case where it was true.
//
// Plus a CENSUS: no file but `bin-name.ts` may spell the name as a quoted string
// literal — the shape of the defect this retires (a second `const BIN = '…'`).
//
// THIS REPOSITORY SHIPS TWO BINS, AND THEY HAVE DIFFERENT SHAPES OF HOME.
//
// `RUNTIME_BIN` is a DECLARED constant plus a gate: `cratylus`'s `bin` key is
// a second authored spelling, npm reads it with no TypeScript in the loop, and their
// agreement is the test obligation leg (1) discharges.
//
// The forge CLI's name is DERIVED. `packages/forge/src/bin-name.ts` reads the `bin`
// key npm itself obeys, so there is exactly ONE authored spelling in that package and
// nothing to hold in agreement — the asymmetry this corpus had not noticed, since
// "npm reads the manifest, so it cannot be computed" is true of writing the manifest
// and false of reading it.
//
// WHAT THAT CHANGES ABOUT THE DEPLOY_TOOL LEG BELOW, which is kept and not deleted:
// its claim was "two authored homes agree", and its claim is now "the derivation
// REACHED the artifact". That is the property still worth a gate, because the
// artifact is shell — `deploy-drift-notice`'s worker names the projection fact
// `deploy-bin` and the projector substitutes, and a resolution site that was missed
// would ship a placeholder or a stale name to a host, silently, since the worker
// fails open by design. It is still capture-and-compare against the manifest that
// owns the name, deliberately NOT against `FORGE_BIN`: comparing the derivation to
// itself would be green on any value at all.
//
// This gate does NOT decide the name. The brand anchor is cratylism-gated and has
// not converged; `RUNTIME_BIN` holds a placeholder. What is asserted is that
// flipping that ONE symbol flips the name everywhere it is operative.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet, writeRenderTree } from '@cratylus/forge/project';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import { runMain } from '@cratylus/runtime/main';
import { beforeAll, describe, expect, it } from 'vitest';
import { deployDriftNotice } from '../src/hooks/deploy-drift-notice.js';
import { memoryConsolidationNudge } from '../src/hooks/memory-consolidation-nudge.js';
import canonPlugin from '../src/index.js';
import { cellTargets } from '../tooling/project-targets.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(canonRoot, '..', '..');

/** A corpus cell that declares `runtime: {capability:'memory'}` — the shim carrier. */
const CELL = 'wake';
const CAPABILITY = 'memory';

/**
 * Every source file that SPEAKS the bin name, and must therefore not SPELL it.
 *
 * `canon/src/hooks/memory-consolidation-nudge.ts` WAS HERE and is gone by REPAIR. A
 * canon cell may not reach the runtime at all now (property 1), so it neither spells
 * the name nor imports it — it names the FACT. Its bytes are still held, harder than
 * before, by the render-tree sweep below.
 */
const CONSUMERS = [
  'packages/runtime/src/main.ts',
  'packages/cli/src/bin.ts',
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

/** The committed hook worker — regenerated from the cell, never hand-edited. */
const workerPath = memoryConsolidationNudge.workers?.[0]?.targetPath ?? '';

/** The build CLI's ONE home: the `bin` key npm reads, with no compiler in the loop.
 *  A shell worker cannot import it, so a worker that spells it is held against this.
 *
 *  THE HOME MOVED WITH THE BIN. It was `packages/forge/package.json` until the hub
 *  package took the command: `forge` is a library now and declares no bin, because
 *  two manifests declaring one name is an install conflict rather than a second
 *  home. The derivation is unchanged — read the manifest npm reads — and only the
 *  manifest it reads is different. */
const HUB_MANIFEST = JSON.parse(read('packages/cli/package.json')) as {
  name: string;
  bin: Record<string, string>;
};
/** The build command is the bare mark, as `vite` and `eslint` are theirs. */
const FORGE_BIN = HUB_MANIFEST.name;

/** The deploy tool a hook worker declares, if any (`DEPLOY_TOOL=<name>`). */
const deployTool = (sh: string): string | undefined =>
  sh.match(/^DEPLOY_TOOL=(\S+)$/m)?.[1];

/** The committed worker that names it — the convicting fixtures' subject. */
const driftWorkerPath = deployDriftNotice.workers?.[0]?.targetPath ?? '';

// A REAL render tree, not a hand-rolled emitter call: the shim under test is the
// one that actually lands. V7 made the projector RETURN the artifact tree, so the
// caller is the one writer — project THEN write.
let projectedShim = '';

/** Every projected `hooks/**` artifact, as ⟨path, RESOLVED bytes⟩. */
let projectedHooks: Array<readonly [string, string]> = [];

beforeAll(async () => {
  const out = await mkdtemp(join(tmpdir(), 'bin-name-single-home-'));
  const report = await projectPluginSet({
    plugins: [canonPlugin],
    adapter: adapterByName('claude'),
  });
  writeRenderTree(out, report.files);
  projectedShim = readFileSync(
    join(out, 'skills', CELL, 'scripts', `${CAPABILITY}.mjs`),
    'utf-8',
  );
  projectedHooks = report.files
    .filter((f) => f.path.startsWith('hooks/'))
    .map((f) => [f.path, f.content] as const);
}, 120_000);

// Every hand-authored shell/`.mjs` source under each package's `src`. Emitted artifacts
// are covered by the hook-artifact leg; these are the ones a human wrote and no compiler
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
      new RegExp(`export const RUNTIME_BIN = '${RUNTIME_BIN}';`, 'g'),
    );
    expect(decl).toHaveLength(1);

    // NO `toContain('RUNTIME_BIN')` HERE, deliberately. It asserted a MENTION, which
    // a comment satisfies and a live interpolation is not required to; worse, it was
    // the half of this gate that made importing the symbol the only admissible
    // mechanism, which is how a test came to require an architecture breach. What
    // each consumer actually owes is that the name it EMITS equals the constant, and
    // that is asserted below by capture-and-compare, per consumer.
    for (const rel of CONSUMERS) {
      const src = read(rel);
      expect(
        { file: rel, spellsIt: src.includes(`'${RUNTIME_BIN}'`) },
        `${rel} must interpolate RUNTIME_BIN, not spell the bin name`,
      ).toEqual({ file: rel, spellsIt: false });
    }
  });

  it("invoke's `bin` manifest key agrees with RUNTIME_BIN", () => {
    // The one copy no compiler can reach. If a rename flips the constant and not
    // this key, the installed executable and everything that spawns it disagree —
    // and nothing but this assertion notices.
    const manifest = JSON.parse(read('packages/cli/package.json')) as {
      bin: Record<string, string>;
    };
    // TWO BINS, ONE PACKAGE — and the set is asserted EXACTLY, not by membership.
    // The hub ships both commands: `cratylus` at build time, `cratylus-run` at run
    // time. They stay separate COMMANDS because they serve separate DAGs; shipping
    // them from one package is what makes that a seam rather than a second install.
    //
    // Exact equality is the point. `toContain` would let a third bin appear
    // unnoticed, and the whole subject here is that every executable name npm puts
    // on a PATH is accounted for.
    expect(Object.keys(manifest.bin).sort()).toEqual(
      [FORGE_BIN, RUNTIME_BIN].sort(),
    );
  });

  it("the runtime's cac branding is RUNTIME_BIN", async () => {
    // cac prints help through `console.log`, not `process.stdout.write`.
    const chunks: string[] = [];
    const log = console.log;
    console.log = (...args: unknown[]) => {
      chunks.push(args.map(String).join(' '));
    };
    try {
      await runMain(['--help']);
    } finally {
      console.log = log;
    }
    const help = chunks.join('\n');
    // Capture the brand cac printed, then compare — not `toContain`, which would
    // still pass if the help named a stale bin alongside the right one.
    expect(help.match(/^(\S+)\//)?.[1]).toBe(RUNTIME_BIN);
    expect(help.match(/^ {2}\$ (\S+) /m)?.[1]).toBe(RUNTIME_BIN);
  });

  it('the PROJECTED thin shim spawns RUNTIME_BIN — the operative site', () => {
    // THE FALSIFIER for the site that broke on a host. Capture whatever argv[0] the
    // emitted `scripts/<cap>.mjs` actually spawns and compare it to the constant, so
    // hardcoding a literal back into the emitter — or flipping the constant without
    // the emitter — is red here rather than at deploy time on someone's machine.
    expect(projectedShim, 'projection produced no shim').not.toBe('');
    const spawned = projectedShim.match(/spawnSync\('([^']+)',/)?.[1];
    expect(spawned).toBe(RUNTIME_BIN);
    expect(projectedShim).toContain(`['${CAPABILITY}',`);
  });

  it('EVERY hook artifact that names the bin defaults $MEMORY_BIN to RUNTIME_BIN', async () => {
    // A SWEEP, not a named path. Two populations of RESOLVED bytes, and both are
    // operative: what `projectPluginSet` emits into a deploy tree, and what
    // `cellTargets()` commits to the repo. The cell's raw `workers[].content` is NOT
    // scanned and must not be — it is a TEMPLATE now, carrying `{{fact:runtime-bin}}`
    // rather than a name, and asserting over it would assert over the wrong subject.
    const committed = (await cellTargets())
      .filter((t) => t.kind === 'hook')
      .map((t) => [`target ${t.path}`, t.content] as const);
    const population = [...projectedHooks, ...committed];
    expect(
      population.length,
      'nothing projected or committed to sweep',
    ).toBeGreaterThan(0);

    const naming = population.filter(([, text]) => text.includes('MEMORY_BIN'));
    // NON-VACUITY. A sweep over a population that happens to name the bin nowhere is
    // green and DARK — precisely the failure this file was written against. At least
    // one artifact must be under test, in each population.
    expect(
      naming.map(([where]) => where).filter((w) => w.startsWith('hooks/'))
        .length,
      'no PROJECTED hook artifact names the bin — the sweep is dark',
    ).toBeGreaterThan(0);
    expect(
      naming.map(([where]) => where).filter((w) => w.startsWith('target '))
        .length,
      'no COMMITTED target names the bin — the sweep is dark',
    ).toBeGreaterThan(0);

    for (const [where, text] of naming) {
      const fallback = text.match(/MEM="\$\{MEMORY_BIN:-([^}]+)\}"/)?.[1];
      expect(fallback, `${where} names a stale bin`).toBe(RUNTIME_BIN);
    }
  });

  it('EVERY hook artifact that names the DEPLOY TOOL agrees with forge’s `bin` key', async () => {
    // The forge CLI's one home is a MANIFEST KEY, read here rather than transcribed —
    // a transcription would be the second copy this whole file exists to forbid.
    const committed = (await cellTargets())
      .filter((t) => t.kind === 'hook')
      .map((t) => [`target ${t.path}`, t.content] as const);
    const population = [...projectedHooks, ...committed];
    const naming = population.filter(
      ([, text]) => deployTool(text) !== undefined,
    );
    // NON-VACUITY, per population: a sweep that happens to find the assignment
    // nowhere is green and DARK — the exact failure the MEMORY_BIN leg above was
    // rewritten to close, one bin over.
    expect(
      naming.map(([where]) => where).filter((w) => w.startsWith('hooks/'))
        .length,
      'no PROJECTED hook artifact names the deploy tool — the sweep is dark',
    ).toBeGreaterThan(0);
    expect(
      naming.map(([where]) => where).filter((w) => w.startsWith('target '))
        .length,
      'no COMMITTED target names the deploy tool — the sweep is dark',
    ).toBeGreaterThan(0);

    for (const [where, text] of naming) {
      expect(deployTool(text), `${where} names a stale deploy tool`).toBe(
        FORGE_BIN,
      );
    }
  });

  it('no projected or committed hook artifact carries an UNRESOLVED placeholder', async () => {
    // The template's own failure mode, at the only grain that matters. `resolveWorker`
    // throws on an unknown placeholder, so this can only go red if a resolution site
    // were MISSED — a worker emitted straight from `cell.workers` — which is exactly
    // how `{{fact:runtime-bin}}` would reach a host and fail there instead of here.
    const committed = (await cellTargets()).map(
      (t) => [`target ${t.path}`, t.content] as const,
    );
    for (const [where, text] of [...projectedHooks, ...committed]) {
      expect(
        text.includes('{{'),
        `${where} ships an unresolved placeholder`,
      ).toBe(false);
    }
  });
});

// ── THE CONVICTING FIXTURES ─────────────────────────────────────────────────────
//
// A gate over a clean corpus is green whether it works or is DARK. Each assertion
// above is capture-and-compare; these feed the SAME comparison a corpus in which
// exactly one site was edited and the other was not — the half-landed rename — and
// assert it is rejected. Without them, "the bin name has one home" is a claim of the
// same kind the retired shard above already made — asserted, unmeasured, and wrong.

/** The three capture-and-compare predicates, isolated from their live inputs so a
 *  synthetic BAD corpus can be fed to the very same code the gate above runs. */
const spawnedBin = (shim: string): string | undefined =>
  shim.match(/spawnSync\('([^']+)',/)?.[1];
const memFallback = (sh: string): string | undefined =>
  sh.match(/MEM="\$\{MEMORY_BIN:-([^}]+)\}"/)?.[1];
const manifestBins = (json: string): string[] =>
  Object.keys((JSON.parse(json) as { bin: Record<string, string> }).bin);

// ── the LANGUAGE BOUNDARY — the property that cost this session a dead `/wake` ──
//
// Every leg above reads TypeScript or an artifact reached by a name the corpus hands
// it. But the bin's operative sites are shell and `.mjs`: text no compiler reads, and
// exactly where a missed rename fails ON A HOST rather than at build. ARCHITECTURE
// says so in as many words. On 2026-08-05 that is precisely what happened — a stale
// bin stranded every deployed shim, and the repository was green throughout.
//
// The scan is a GLOB, deliberately. Only ONE of the thirteen hand-authored shell/`.mjs`
// sources currently names the bin, so a roster would encode that accident and go quiet
// the moment a fourteenth file is added. Enumerate the domain, then judge each member.
it('EVERY hand-authored shell or .mjs source under packages/*/src derives the bin', () => {
  const sources = shellSources();
  expect(
    sources.length,
    'no shell/.mjs source found under packages/*/{src,tooling,targets} — the scan is DARK, not the corpus clean',
  ).toBeGreaterThan(5);

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
      if (dflt !== RUNTIME_BIN)
        drifted.push(`${rel}: defaults to \`${dflt}\`, not \`${RUNTIME_BIN}\``);
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
// COMMENTS ARE OUT OF SCOPE and deliberately so — prose about `cratylus deploy` is
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
 *  `cratylus-run` (the runtime's bin, held by the legs above), not a URL segment. */
function spellsForgeBin(ts: string): number {
  // A CONFIG FILENAME IS NOT THE BIN. `cratylus.config.ts` shares a word with the
  // command and is a different concept — the name of a file a consumer writes, not
  // the program they invoke. Deriving it from `FORGE_BIN` was over-engineering that
  // this very census provoked: vite does not compute `vite.config.ts` from its bin
  // key either. Excluded by shape (`.config` follows) rather than by a file
  // exemption, so the rule stays about CONCEPTS and no roster can go stale.
  const re = new RegExp(`(?<![@./\\w-])${FORGE_BIN}(?![-\\w/]|\\.config)`, 'g');
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
      'these spell the forge bin instead of interpolating FORGE_BIN',
    ).toEqual([]);
  });

  it('the census DETECTOR is not simply always-empty', () => {
    // The failure this whole file was written against, one bin over: a scan whose
    // predicate quietly stopped matching is green over any corpus. Feed it the
    // defect it exists to catch, and the two shapes it must NOT catch.
    expect(spellsForgeBin(`const x = '${FORGE_BIN} deploy';`)).toBe(1);
    expect(spellsForgeBin(`import x from '@${FORGE_BIN}/forge';`)).toBe(0);
    expect(spellsForgeBin(`const x = '${RUNTIME_BIN}';`)).toBe(0);
    // the filename shares a word with the command and is not it
    expect(spellsForgeBin(`const f = '${FORGE_BIN}.config.ts';`)).toBe(0);
    // and prose is out of scope, in both comment shapes
    expect(
      spellsForgeBin(`// run \`${FORGE_BIN} deploy\` first\nconst x = 1;`),
    ).toBe(0);
    expect(spellsForgeBin(`/* ${FORGE_BIN} deploy */\nconst x = 1;`)).toBe(0);
  });

  it('the CLI brands its help with the name it is installed under', () => {
    // `cac('forge')` printed `$ forge <command>` in every help block — the same
    // class of defect as a stale bin in a shim, except it never needed a rename to
    // become false. Captured off the source's cac call, compared to the manifest.
    // Anchored at the DECLARATION, not the first `cac(` in the file: the header
    // above it quotes the defect it retires, and an unanchored match read the
    // comment — a gate reporting on prose about the code instead of the code.
    const branded = read('packages/forge/src/cli/index.ts').match(
      /^const cli = cac\(([^)]+)\)/m,
    )?.[1];
    expect(branded, 'the CLI must brand itself from the derived name').toBe(
      'FORGE_BIN',
    );
  });
});

describe('the single-home gate is non-vacuous', () => {
  const STALE = `${RUNTIME_BIN}-stale`;

  it('FAILS on a thin shim whose spawn target drifted from the constant', () => {
    const drifted = projectedShim.replace(
      `spawnSync('${RUNTIME_BIN}'`,
      `spawnSync('${STALE}'`,
    );
    expect(drifted).not.toBe(projectedShim); // the mutation actually landed
    expect(spawnedBin(projectedShim)).toBe(RUNTIME_BIN);
    expect(spawnedBin(drifted)).not.toBe(RUNTIME_BIN);
  });

  it('FAILS on a hook worker whose $MEMORY_BIN default drifted', () => {
    const good = read(workerPath);
    const drifted = good.replace(
      `MEMORY_BIN:-${RUNTIME_BIN}}`,
      `MEMORY_BIN:-${STALE}}`,
    );
    expect(drifted).not.toBe(good);
    expect(memFallback(good)).toBe(RUNTIME_BIN);
    expect(memFallback(drifted)).not.toBe(RUNTIME_BIN);
  });

  it('FAILS on a hook worker whose DEPLOY_TOOL drifted from forge’s `bin` key', () => {
    // The SessionStart drift notice fails OPEN: a worker naming a program that no
    // longer exists produces silence, and silence is indistinguishable from an
    // in-sync host. A half-landed CLI rename would therefore delete this hook
    // without deleting anything. Same capture-and-compare, over a corpus in which
    // exactly one of the two sites moved.
    const good = read(driftWorkerPath);
    const drifted = good.replace(
      `DEPLOY_TOOL=${FORGE_BIN}`,
      `DEPLOY_TOOL=${FORGE_BIN}-stale`,
    );
    expect(drifted).not.toBe(good); // the mutation actually landed
    expect(deployTool(good)).toBe(FORGE_BIN);
    expect(deployTool(drifted)).not.toBe(FORGE_BIN);
    // and the detector is not simply always-true: a worker naming no tool at all
    // must read as absent, never as a drifted one.
    expect(deployTool(read(workerPath))).toBeUndefined();
  });

  it('FAILS on a manifest whose `bin` key drifted from the constant', () => {
    const good = read('packages/cli/package.json');
    const drifted = good.replace(`"${RUNTIME_BIN}":`, `"${STALE}":`);
    expect(drifted).not.toBe(good);
    const expected = [FORGE_BIN, RUNTIME_BIN].sort();
    expect(manifestBins(good).sort()).toEqual(expected);
    expect(manifestBins(drifted).sort()).not.toEqual(expected);
  });

  it('FLAGS a consumer that spells the bin name instead of importing it', () => {
    const clean = read('packages/forge/src/project/runtime-shim.ts');
    const regressed = clean.replace(
      "spawnSync('${RUNTIME_BIN}'",
      `spawnSync('${RUNTIME_BIN}'`,
    );
    expect(regressed).not.toBe(clean);
    expect(clean.includes(`'${RUNTIME_BIN}'`)).toBe(false);
    expect(regressed.includes(`'${RUNTIME_BIN}'`)).toBe(true);
  });
});
