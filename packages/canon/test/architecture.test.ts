// ARCHITECTURE gate — the four load-bearing properties of `ARCHITECTURE.md`, enforced.
//
// Named for the ground it enforces, on this corpus's own precedent: `cratylism.test.ts`
// is named for the principle it enforces, not for a property-noun. Five cold legs were
// spent looking for a quality-noun and the best of them returned `import-acyclicity`,
// which is simply WRONG — the law is stricter than acyclicity. `canon` importing
// `cratylus-run` introduces no cycle and is still forbidden. A sign naming a weaker
// property than the law would mislead exactly the reader who trusted it.
//
// WHY THIS EXISTS. `ARCHITECTURE.md` states four properties "in order of how much they
// matter", and a census of the whole repository found that **nothing has ever checked
// any of them** — no dependency-cruiser, no import lint, no CI, and the single
// import-scanning assertion in the tree covers 4 files of one direction. A property
// stated only in prose drifts silently. That is the same lesson this corpus already
// learned about signs, one level up.
//
// AND THE RATCHET IS NOW EMPTY. `src/hooks/memory-consolidation-nudge.ts` — a canon
// CELL — imported `@cratylus/runtime` for `RUNTIME_BIN`, and `bin-name-single-home.
// test.ts` asserted that the import STAYS, so repairing the architecture turned that
// test red and leaving it turned this one red. Both exits were closed on purpose,
// which is what a pin is FOR: it converted "someone should fix this" into a design
// decision that had to be made in the open.
//
// It was made. `workers[].content` became a TEMPLATE with a closed placeholder set
// (`{{fact:<ProjectionFact>}}` / `{{speech:<id>}}`); the schema declares which facts
// EXIST and never a value; the PROJECTOR owns the values and substitutes at both
// emission sites. The cell names a capability. All four properties now hold with no
// pinned exceptions — and the counter-gate got stronger in the same act, sweeping
// every projected hook artifact instead of one enumerated path.
//
// SPECIFIERS ARE PARSED, NOT GREPPED. Comments and template literals in this repo are
// full of import-shaped text that is not an import: `config/scaffold.ts` holds a
// scaffold TEMPLATE containing `import canon from '@cratylus/canon'`, and
// `deploy/seeds.ts` has a TODO discussing an `@cratylus/memory` import that does
// not exist. A text scan convicts both. Neither is an edge. Comments and template
// literals are therefore stripped before matching — the same use/mention line that
// governs `command-veracity` and the density gate.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

type Pkg =
  | 'canon'
  | 'forge'
  | 'runtime'
  | 'memory'
  | 'cli'
  | 'schema'
  | 'tooling';

/**
 * Canon's file ROLES. The distinction property 2 turns on: canon's BUILD SCRIPTS using
 * the projector as a tool is what a tool is for; a CELL importing it is a corpus
 * DEFINED BY its projector, which is the defect.
 */
type Role = 'cell' | 'build-script' | 'root';

/** Edges the architecture permits. Anything else is a violation. */
const PERMITTED: ReadonlyArray<readonly [Pkg, Pkg]> = [
  ['canon', 'schema'],
  ['forge', 'schema'],
  ['forge', 'runtime'],
  ['memory', 'runtime'],
  ['cli', 'runtime'],
  ['cli', 'memory'],
  // `['cli','forge']` WAS DELETED AND IS BACK, on exactly the condition its deletion
  // set. It was retired at `3710c4bf` because it licensed an import nobody had, and a
  // dead PERMITTED entry is silent and WIDENS — unlike a dead ratchet pin, which the
  // shrink-only leg below fails loudly.
  //
  // The witness now exists and is load-bearing. This package became the COMPOSITION
  // ROOT: `forge` projects and depends on no corpus, `canon` is a corpus and knows no
  // projector, and something must hold both for a consumer to type one command. It
  // ships the `cratylus` bin for that reason.
  //
  // So property 2 is AMENDED, not breached — nothing depends on projection except the
  // consumer entry point whose whole job is to compose it. Every other importer is
  // still refused, and a CELL reaching the projector is still the defect it was.
  ['cli', 'forge'],
];

/**
 * Today's breaches, pinned in the open and shrink-only — EMPTY.
 *
 * IT WAS 26, THEN 3, THEN 1, AND IS NOW 0. The big batch retired when the cell SHAPES
 * left `forge` for a package of their own (`schema`): every breach in it was a canon
 * CELL importing the PROJECTOR for a type — 22 of them — and extracting the shapes
 * took that count to 0 with the render oracle unmoved, which is the proof the change
 * was structural. The last three retired on 2026-08-05, EVERY ONE BY REPAIR
 * rather than by exemption — see the notes below, each kept where the pin stood.
 *
 * EMPTY MEANS SOMETHING HERE, because the shrink-only leg makes a stale pin fail
 * loudly: this set cannot be quietly padded to re-admit a breach without the
 * corresponding edge actually existing. The four properties of `ARCHITECTURE.md` now
 * hold on the real import graph with no exceptions.
 */
const ARCHITECTURE_RATCHET: ReadonlySet<string> = new Set([
  // `canon/hooks/memory-consolidation-nudge.ts → runtime` WAS HERE — property 1's
  // last breach — and is RETIRED BY REPAIR, 2026-08-05.
  //
  // The cell took `RUNTIME_BIN` because the value landed inside a shell string in
  // `workers[].content`, where no compiler reads it. That made the import look
  // harmless and it was not: an edge is an edge whether or not a compiler follows the
  // value, and this one ran from MEANING to MECHANISM, the one direction the north
  // star ranks first.
  //
  // The repair is a seam, not a move. `workers[].content` is a TEMPLATE with a closed
  // placeholder set; the cell names `{{fact:runtime-bin}}` and the projector
  // substitutes (`projectionFacts()` in `forge/project`, where the `forge → runtime`
  // edge is permitted). The schema declares WHICH facts exist and never a value — a
  // value there would have restored the `schema → runtime` edge repaired the same
  // day. The byte-anchor was not weakened: its subject moved from the cell's literal
  // to the RESOLVED bytes, which are still a pure function of the cell.
  // `schema/index.ts → runtime` WAS HERE and is RETIRED BY REPAIR, 2026-08-05.
  //
  // The pin's own note proposed moving `RuntimePlugin` into the shapes package. A
  // census refuted that remedy: `RuntimePlugin` is typed over `MemoryStrategy` and
  // `EventTapHost` — the runtime PORTS, which are the whole of what ARCHITECTURE
  // assigns to `runtime` — so the move would have traded a ratcheted edge for a
  // fused concern. The detection was right; the remedy was not.
  //
  // What schema actually wanted was never `RuntimePlugin`. It wanted the KEY SET
  // `'memory' | 'eventTap'`, and it was obtaining a VOCABULARY by reaching into a
  // SHAPE. `shape ⊥ vocabulary` (`MODEL.md:22`). Schema now states only that a
  // capability has a name; `canon/manifest.ts` declares the members and narrows its
  // own `Skill` against them, which is the `DimensionManifest`/`MANIFEST` pattern
  // reused rather than a second one invented. The edge is gone, the ports never
  // moved, and the compile-time check on cells got STRONGER — it is now sourced
  // from the corpus that ships the capabilities instead of from an interface's
  // shape.
  // `canon/index.ts → forge` WAS HERE and is RETIRED BY REPAIR, 2026-08-05.
  // `AgentPlugin`/`defineAgentPlugin` moved to `@cratylus/schema`, so the corpus
  // root no longer reaches the projector for its own authoring surface. The move
  // cost nothing: the contract imported one type from schema and the factory is
  // `(plugin) => plugin`. Property 2 now holds with NO exceptions.
]);

/**
 * Every package scanned. `schema` was MISSING for exactly one day — the gate was
 * written before `schema` existed and the package set was a literal. The new
 * package landed carrying a `schema → runtime` edge, and the gate stayed green because
 * it never looked. That is the coverage-as-conformance defect this suite exists to
 * catch, in the gate that catches it. The reach leg below now asserts the set is whole
 * against the workspace itself, so the next package cannot arrive unscanned.
 */
const PACKAGES = [
  // `tooling` is `@cratylus/tooling` — PRIVATE, unpublished, and dev-only. It is scanned
  // anyway, and that is the point of the reach leg below: a package excluded because
  // "it doesn't ship" is a package whose edges nothing checks, and dev tooling reaching
  // into a product package is exactly the direction that would go unnoticed.
  'tooling',
  'canon',
  'forge',
  'runtime',
  'memory',
  'cli',
  'schema',
] as const;

interface Edge {
  readonly from: Pkg;
  readonly file: string;
  readonly role: Role;
  readonly to: Pkg;
}

function key(e: Edge): string {
  return `${e.from}/${e.file} → ${e.to}`;
}

/**
 * Keep only the code in which an import specifier can live: normal source and
 * single/double-quoted strings. Drop comments and template literals, where
 * import-shaped text is a MENTION, not an edge.
 *
 * A SCANNER, not layered regexes, and the first version proved why. It stripped line
 * comments before template literals; this corpus writes backticks inside `//` comments
 * constantly, so removing those comments left an ODD number of backticks and the
 * template pattern then swallowed whole files — `src/index.ts` went 2233 chars to 341
 * and its one real forge import vanished. The gate reported the tree cleaner than it is.
 *
 * Note what did NOT catch it: the reach leg passed, because the collapse was PARTIAL.
 * Named anchors prove a scan is not empty; they do not prove it is complete.
 */
function codeOnly(src: string): string {
  let out = '';
  let i = 0;
  type S = 'normal' | 'line' | 'block' | 'sq' | 'dq' | 'tpl';
  let s: S = 'normal';
  while (i < src.length) {
    const c = src[i] as string;
    const d = src[i + 1];
    if (s === 'normal') {
      if (c === '/' && d === '/') {
        s = 'line';
        i += 2;
        continue;
      }
      if (c === '/' && d === '*') {
        s = 'block';
        i += 2;
        continue;
      }
      if (c === "'") {
        s = 'sq';
        out += c;
        i++;
        continue;
      }
      if (c === '"') {
        s = 'dq';
        out += c;
        i++;
        continue;
      }
      if (c === '`') {
        s = 'tpl';
        out += ' ';
        i++;
        continue;
      }
      out += c;
      i++;
      continue;
    }
    if (s === 'line') {
      if (c === '\n') {
        s = 'normal';
        out += c;
      }
      i++;
      continue;
    }
    if (s === 'block') {
      if (c === '*' && d === '/') {
        s = 'normal';
        i += 2;
        out += ' ';
        continue;
      }
      i++;
      continue;
    }
    // inside a quoted string or a template: honour escapes
    if (c === '\\') {
      if (s !== 'tpl') out += src.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (s === 'sq' && c === "'") {
      s = 'normal';
      out += c;
      i++;
      continue;
    }
    if (s === 'dq' && c === '"') {
      s = 'normal';
      out += c;
      i++;
      continue;
    }
    if (s === 'tpl' && c === '`') {
      s = 'normal';
      out += ' ';
      i++;
      continue;
    }
    if (s !== 'tpl') out += c;
    i++;
  }
  return out;
}

const SPEC =
  /(?:\bfrom\s*|(?:^|[^.\w])import\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;

function pkgOf(spec: string): Pkg | null {
  const m = spec.match(
    /^@cratylus\/(canon|forge|runtime|memory|invoke|schema)/,
  );
  return m ? (m[1] as Pkg) : null;
}

function roleOf(rel: string): Role {
  if (/^(dimensions|skills|agents|hooks|rules|genus)\//.test(rel))
    return 'cell';
  // BUILD SCRIPTS ARE NAMED BY THEIR DIRECTORY, and the directory now says so. This
  // read `toolkit/`, a subtree of `src/` that the build EXCLUDED — so the license to
  // import forge was carried by a path whose name claimed the opposite ("this becomes
  // dist"). The scripts moved to `tooling/`, a sibling of `src/` rather than a child,
  // and the license moved with them onto a name that means what it grants.
  if (rel.startsWith('tooling/')) return 'build-script';
  return 'root';
}

/** Every tracked `.ts` a package AUTHORS — `src/` and, where it exists, `tooling/`.
 *
 *  `tooling/` IS IN SCOPE, and leaving it out would have been a silent coverage loss
 *  rather than a scope decision. Canon's build scripts used to live under `src/toolkit/`
 *  and were therefore scanned by a `packages/*&#47;src` sweep for free. Moving them out of
 *  `src/` — which is the whole point, since the build excludes them and `src/` asserts
 *  the opposite — would have removed every one of their forge imports from this gate's
 *  view. The gate would have gone greener while the corpus did not change at all.
 *
 *  This is the same failure this suite already knows in its other direction: a check
 *  whose subject is the live tree goes dark when the tree moves. Here the subject stayed
 *  put and the SWEEP's idea of the tree was what went stale. */
function srcFiles(pkg: string): string[] {
  const roots = [`packages/${pkg}/src`, `packages/${pkg}/tooling`];
  return execFileSync('git', ['ls-files', ...roots], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => f.endsWith('.ts'));
}

function edges(): Edge[] {
  const out: Edge[] = [];
  for (const pkg of PACKAGES) {
    for (const path of srcFiles(pkg)) {
      const rel = path
        .replace(`packages/${pkg}/src/`, '')
        .replace(`packages/${pkg}/`, '');
      const code = codeOnly(readFileSync(join(repoRoot, path), 'utf8'));
      const seen = new Set<Pkg>();
      for (const m of code.matchAll(SPEC)) {
        const to = pkgOf(m[1] as string);
        if (to && to !== pkg && !seen.has(to)) {
          seen.add(to);
          out.push({ from: pkg, file: rel, role: roleOf(rel), to });
        }
      }
    }
  }
  return out;
}

function permitted(e: Edge): boolean {
  // Property 2's one licensed exception: canon's BUILD SCRIPTS may use the projector.
  if (e.from === 'canon' && e.to === 'forge' && e.role === 'build-script')
    return true;
  return PERMITTED.some(([a, b]) => a === e.from && b === e.to);
}

describe('ARCHITECTURE gate — the four load-bearing properties, enforced', () => {
  // REACH. A stripper that over-strips, or a glob that matches nothing, yields zero
  // edges — and zero edges passes every assertion below as if the tree were perfect.
  // The package set is a LITERAL, so it can go stale the moment a package is added —
  // and it did, for one day, when `schema` landed unscanned. Asserted against the
  // workspace itself so the next one cannot.
  it('scans EVERY workspace package — no package arrives unscanned', () => {
    const onDisk = execFileSync(
      'git',
      ['ls-files', 'packages/*/package.json'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    )
      .split('\n')
      .filter(Boolean)
      .map(
        (p) =>
          (
            p.match(/^packages\/([^/]+)\/package\.json$/) as string[] | null
          )?.[1],
      )
      .filter((n): n is string => Boolean(n))
      .sort();
    expect(
      [...PACKAGES].sort(),
      'PACKAGES is stale against the workspace',
    ).toEqual(onDisk);
  });

  it('reads a real edge set, with named anchors', () => {
    const es = edges();
    expect(
      es.length,
      'no edges found — the specifier scan is broken',
    ).toBeGreaterThan(20);
    const ks = new Set(es.map(key));
    // Known-live edges, one permitted and one violating, so neither a collapsed nor a
    // saturated scan can pass.
    expect(ks).toContain('memory/plugin.ts → runtime');
    // Was `canon/skills/wake/skill.ts → forge`, retired by the shapes extraction. The
    // violating anchor is now canon's root plugin declaration; the permitted one is
    // a build script using the projector as a tool. Was `toolkit/project-cli.ts`
    // until the build-steps-proxy-the-cli shard deleted it — projection is the
    // shipped `cratylus project --harness <name>` now, driven from the root
    // `cratylus.config.ts`, so the anchor moved to a build script that survives.
    expect(ks).toContain('canon/tooling/scaffold-cli.ts → forge');
    // `canon/index.ts → forge` was the violating witness until the plugin contract
    // moved to the schema. `scaffold-cli.ts → forge` above is a PERMITTED edge and
    // still witnesses a live canon→forge scan, so this leg is not vacuous.
    // Was `canon/skills/wake/skill.ts → schema`. The capability-vocabulary repair
    // moved every skill cell onto canon's OWN narrowed `Skill` (`manifest.ts`), so no
    // cell imports the shapes package directly any more and that witness went stale.
    // The corpus→shapes edge itself is very much alive — it just has one anchor now,
    // which is the manifest module, and that is the right place for it.
    expect(ks).toContain('canon/manifest.ts → schema');
    // Known NON-edges: import-shaped text in a template and in a comment.
    expect(ks).not.toContain('forge/config/scaffold.ts → canon');
    expect(ks).not.toContain('forge/deploy/seeds.ts → memory');
  });

  // COMPLETENESS, and it is separate from reach for a reason. The first scanner
  // collapsed `src/index.ts` from 2233 chars to 341 and lost its only forge import —
  // and the reach leg above still PASSED, because named anchors prove a scan is not
  // empty, never that it is whole. These counts are the byte-identity-shaped oracle
  // that catches a partial collapse: any silent loss or gain moves one of them.
  it('the edge counts are EXACT — a partial collapse moves one of these', () => {
    const es = edges();
    const canonCells = es.filter(
      (e) => e.from === 'canon' && e.to === 'forge' && e.role === 'cell',
    );
    const canonBuild = es.filter(
      (e) =>
        e.from === 'canon' && e.to === 'forge' && e.role === 'build-script',
    );
    const canonRoot = es.filter(
      (e) => e.from === 'canon' && e.to === 'forge' && e.role === 'root',
    );
    // WAS 22, IS 0 — the whole point of the shapes extraction, and the proof it landed.
    // (`ARCHITECTURE.md` carried "28" for months; it was never measured and it was
    // wrong.) A cell reaching the projector again moves this off zero.
    expect(canonCells.length, 'canon CELLS importing the projector').toBe(0);
    // WAS 9, THEN 6, THEN 4, IS 5 — and these are LICENSED: a corpus BUILT BY forge,
    // not DEFINED by it, which `ARCHITECTURE.md` names explicitly as not a divergence.
    // Three of the nine (`toolkit/{hooks,project,project-targets}.ts`) took only the
    // cell SHAPES and now take them from the schema, so their forge edge is gone
    // outright. Two more went with `toolkit/project-cli{,-codex}.ts`: they were one
    // program differing by an adapter string, and the shipped
    // `cratylus project --harness <name>` is that program.
    //
    // IT WENT UP BY ONE, and that is the property-1 repair's whole cost. Regenerating
    // a committed hook target means RESOLVING its worker template, and the facts live
    // in the projector — so `toolkit/project-targets.ts` took a forge import BACK.
    // The trade is the one the architecture asks for: a BUILD SCRIPT reaching the
    // projector (licensed, and the direction of every other entry here) in place of a
    // CELL reaching the runtime (property 1, the highest-ranked property there is).
    // This number does not go to zero, and driving it there would mean canon could no
    // longer build itself.
    expect(canonBuild.length, 'canon BUILD SCRIPTS using forge as a tool').toBe(
      5,
    );
    // WAS 3, THEN 1, IS 0 — property 2 holds with no exceptions. `manifest.ts` and
    // `manifest.test-d.ts` took their shapes from the schema; `index.ts` was the last
    // survivor and now takes `defineAgentPlugin` from there too. THIS ONE IS ALLOWED
    // TO BE ZERO, unlike the build-script count below: a corpus is BUILT BY the
    // projector, never DEFINED by it, so nothing in canon's root ever needs it.
    expect(canonRoot.length, 'canon root modules importing the projector').toBe(
      0,
    );
    // WAS 1, IS 0 — the last property-1 breach, retired by the worker-template seam.
    // ZERO IS THE FLOOR AND IT IS LOAD-BEARING: property 1 admits no licensed
    // exception the way property 2 admits build scripts. Nothing in canon may name an
    // implementation, so any move off zero is a defect and not a judgement call.
    expect(
      es.filter((e) => e.from === 'canon' && e.to === 'runtime').length,
      'property 1 breaches',
    ).toBe(0);
  });

  it('property 4 — runtime depends on nothing', () => {
    const bad = edges().filter((e) => e.from === 'runtime');
    expect(
      bad.map(key),
      'runtime is the deployed base and imports no sibling',
    ).toEqual([]);
  });

  it('property 1 — meaning and mechanism never reference each other', () => {
    const bad = edges()
      .filter(
        (e) =>
          (e.from === 'canon' && e.to === 'runtime') ||
          (e.from === 'runtime' && e.to === 'canon'),
      )
      .filter((e) => !ARCHITECTURE_RATCHET.has(key(e)))
      .map(
        (e) =>
          `ARCH ${key(e)} — a skill names a capability, never an implementation`,
      );
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('property 2 — nothing depends on projection, and no CELL reaches it', () => {
    const bad = edges()
      // The hub's edge is licensed in PERMITTED with a LIVE witness, so it needs no
      // exemption here — `permitted()` below already carries it, and routing it
      // through one home keeps a second licence from drifting out of step.
      .filter((e) => e.to === 'forge')
      .filter((e) => !permitted(e) && !ARCHITECTURE_RATCHET.has(key(e)))
      .map(
        (e) =>
          `ARCH ${key(e)} — a ${e.role} importing the projector; only canon's build scripts may`,
      );
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('every other edge is one the architecture permits', () => {
    const bad = edges()
      .filter((e) => !permitted(e) && !ARCHITECTURE_RATCHET.has(key(e)))
      .map((e) => `ARCH ${key(e)} — unpermitted edge`);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('the ratchet is shrink-only: every pin still names a LIVE violation', () => {
    const live = new Map(edges().map((e) => [key(e), e]));
    const stale: string[] = [];
    for (const pin of ARCHITECTURE_RATCHET) {
      const e = live.get(pin);
      if (e === undefined || permitted(e)) stale.push(pin);
    }
    expect(
      stale,
      `pins that no longer violate — REMOVE them:\n${stale.join('\n')}`,
    ).toEqual([]);
  });

  // The convicting fixture — the known-answer control, travelling the same path as the
  // live checks: the real stripper and the real specifier matcher, over synthetic source.
  it('FAILS a forbidden edge, and does NOT convict import-shaped text in a comment', () => {
    const real = `import { x } from '@cratylus/runtime/bin-name';`;
    const mention = `// TODO: export { y } from '@cratylus/runtime';\nconst t = \`import z from '@cratylus/forge';\`;`;

    const specs = (s: string) =>
      [...codeOnly(s).matchAll(SPEC)]
        .map((m) => pkgOf(m[1] as string))
        .filter(Boolean);

    // Assert the defect is PRESENT before reading the result.
    expect(specs(real)).toEqual(['runtime']);
    expect(specs(mention)).toEqual([]);

    const forbidden: Edge = {
      from: 'canon',
      file: 'skills/probe/skill.ts',
      role: 'cell',
      to: 'runtime',
    };
    expect(permitted(forbidden)).toBe(false);
    // …and the licensed exception is genuinely licensed, so the predicate is not
    // simply refusing everything.
    expect(
      permitted({
        from: 'canon',
        file: 'tooling/project.ts',
        role: 'build-script',
        to: 'forge',
      }),
    ).toBe(true);
  });

  // THE IMPORT GRAPH IS NOT THE DEPENDENCY GRAPH, and this suite could only see the
  // first. Every leg above reads `import` statements, so a workspace package declared in
  // a manifest and imported by nothing is INVISIBLE to all of them — the gate reports the
  // architecture clean while npm ships the coupling anyway.
  //
  // It was not hypothetical. `@cratylus/canon` declared BOTH `@cratylus/forge` and
  // `@cratylus/runtime` in `dependencies` with ZERO importers under `src/` — forge's 20
  // importers are all `tooling/` and `test/`, and runtime's two `src` hits are both
  // COMMENTS. Property 2 ("nothing depends on projection") held at the module level and
  // was breached at the manifest level, so anyone running `npm i @cratylus/canon` also
  // downloaded the projector — re-coupling at distribution exactly what ARCHITECTURE says
  // the package split exists to prevent, and what the two-bin decision is argued from.
  //
  // `dependencies` is the set a CONSUMER downloads. A package used only to build or test
  // this package is a `devDependency`; putting it in `dependencies` is a claim about the
  // shipped artifact that its own source contradicts.
  it('no PHANTOM runtime dependency — every declared workspace dep is imported by src/', () => {
    const offenders: string[] = [];
    let declared = 0;

    for (const pkg of PACKAGES) {
      const manifest = JSON.parse(
        readFileSync(join(repoRoot, `packages/${pkg}/package.json`), 'utf8'),
      ) as { dependencies?: Record<string, string> };

      // `src/` ONLY — deliberately narrower than `srcFiles()`, which also sweeps
      // `tooling/`. A build script's import justifies a devDependency, never a
      // dependency, and conflating the two is the whole defect this leg holds.
      const shipped = execFileSync('git', ['ls-files', `packages/${pkg}/src`], {
        cwd: repoRoot,
        encoding: 'utf8',
      })
        .split('\n')
        .filter((f) => f.endsWith('.ts'))
        .map((f) => codeOnly(readFileSync(join(repoRoot, f), 'utf8')))
        .join('\n');

      declared += phantomScan(manifest, shipped, pkg).examined;
      offenders.push(
        ...phantomScan(manifest, shipped, pkg).phantoms.map(
          (s) => `${pkg} → ${s}`,
        ),
      );
    }

    // NON-VACUITY. If no workspace dependency is declared anywhere, this leg is green for
    // having looked at nothing — the steady state here is zero offenders, so the count of
    // what was EXAMINED is the only thing that distinguishes clean from dark.
    expect(
      declared,
      'workspace deps examined — the scan is DARK',
    ).toBeGreaterThan(0);
    expect(
      offenders,
      'declared as a dependency, imported by no src/ file',
    ).toEqual([]);
  });

  // THE LIVE LEG ABOVE GOES DARK THE MOMENT THE CORPUS IS CLEAN — its subject is the real
  // manifests, and a clean tree is indistinguishable from a broken detector. It DID convict
  // on first run (`schema → @cratylus/runtime`, an edge ARCHITECTURE recorded as repaired
  // in 2026-08-05 while the manifest entry survived), but that violation is now fixed and
  // cannot be the standing proof.
  //
  // So the detector is driven over a SYNTHETIC subject it carries itself, through THE SAME
  // function — a control that reaches its verdict by another path proves only that the
  // other path works.
  it('the phantom detector CONVICTS a phantom and EXONERATES a real import', () => {
    const phantom = { dependencies: { '@cratylus/runtime': 'workspace:*' } };
    const real = { dependencies: { '@cratylus/schema': 'workspace:*' } };

    // convicting: declared, and the source never names it
    expect(phantomScan(phantom, 'export const x = 1;').phantoms).toEqual([
      '@cratylus/runtime',
    ]);
    // exonerating: declared AND imported — must NOT convict
    expect(
      phantomScan(real, "import type { Cell } from '@cratylus/schema';")
        .phantoms,
    ).toEqual([]);
    // an external dep is npm's problem, not this gate's
    expect(phantomScan({ dependencies: { zod: '^3' } }, '').examined).toBe(0);
  });
});

/** THE PURE PREDICATE both legs above rest on: which declared workspace deps does this
 *  package's shipped source never name? Pure so the synthetic fixture can drive the same
 *  function the live sweep does. `examined` is the denominator — reported separately so
 *  "found nothing" stays distinguishable from "could not look". */
function phantomScan(
  manifest: { dependencies?: Record<string, string> },
  shippedSource: string,
  owner?: string,
): { phantoms: string[]; examined: number } {
  const phantoms: string[] = [];
  let examined = 0;
  for (const spec of Object.keys(manifest.dependencies ?? {})) {
    if (pkgOf(spec) === null) continue; // external — not ours to police
    // A RESOLVABILITY DEPENDENCY IS NOT A PHANTOM. The hub declares the default
    // corpus so a CONSUMER'S CONFIG can resolve `@cratylus/canon` by ordinary Node
    // rules — including a global install, where a config outside every
    // `node_modules` cannot resolve it at all (`ERR_MODULE_NOT_FOUND`, measured).
    // The hub never imports it: depending on a corpus is not assuming one, and the
    // config still NAMES it, which is what keeps meaning out of projection.
    //
    // Narrow on purpose — one package, one spec. Widening this to "any dependency a
    // package chooses not to import" would retire the leg while leaving it green,
    // which is the failure this gate was written against.
    if (owner === 'cli' && spec === '@cratylus/canon') continue;
    examined += 1;
    if (!shippedSource.includes(spec)) phantoms.push(spec);
  }
  return { phantoms, examined };
}
