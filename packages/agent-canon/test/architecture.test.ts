// ARCHITECTURE gate — the four load-bearing properties of `ARCHITECTURE.md`, enforced.
//
// Named for the ground it enforces, on this corpus's own precedent: `cratylism.test.ts`
// is named for the principle it enforces, not for a property-noun. Five cold legs were
// spent looking for a quality-noun and the best of them returned `import-acyclicity`,
// which is simply WRONG — the law is stricter than acyclicity. `agent-canon` importing
// `agent-runtime` introduces no cycle and is still forbidden. A sign naming a weaker
// property than the law would mislead exactly the reader who trusted it.
//
// WHY THIS EXISTS. `ARCHITECTURE.md` states four properties "in order of how much they
// matter", and a census of the whole repository found that **nothing has ever checked
// any of them** — no dependency-cruiser, no import lint, no CI, and the single
// import-scanning assertion in the tree covers 4 files of one direction. A property
// stated only in prose drifts silently. That is the same lesson this corpus already
// learned about signs, one level up.
//
// AND PROPERTY 1 IS PINNED. `src/hooks/memory-consolidation-nudge.ts` — a canon CELL —
// imports `@leclabs/agent-runtime`, and `bin-name-single-home.test.ts` asserts that the
// import STAYS. Repairing the architecture turns that test red. It is ratcheted here,
// visibly, rather than quietly excluded: amending the counter-gate is a design decision
// and it is owed BEFORE the repair, not during it.
//
// SPECIFIERS ARE PARSED, NOT GREPPED. Comments and template literals in this repo are
// full of import-shaped text that is not an import: `config/scaffold.ts` holds a
// scaffold TEMPLATE containing `import canon from '@leclabs/agent-canon'`, and
// `deploy/seeds.ts` has a TODO discussing an `@leclabs/agent-memory` import that does
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

type Pkg = 'canon' | 'forge' | 'runtime' | 'memory' | 'cli' | 'schema';

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
  ['cli', 'forge'],
  ['cli', 'runtime'],
  ['cli', 'memory'],
];

/**
 * Today's breaches, pinned in the open and shrink-only. Each is a real divergence
 * `ARCHITECTURE.md` already names, not an exemption.
 *
 * 25 of these retire in one act — extracting `agent-schema` (PLAN §1). The 26th is
 * property 1's pinned breach and retires only after `bin-name-single-home` is amended.
 */
const ARCHITECTURE_RATCHET: ReadonlySet<string> = new Set([
  'canon/hooks/memory-consolidation-nudge.ts → runtime',
  'canon/anatomy.test-d.ts → forge',
  'canon/anatomy.ts → forge',
  'canon/hooks/memory-consolidation-nudge.ts → forge',
  'canon/hooks/praxis-continuity.ts → forge',
  'canon/hooks/resume-availability-notice.ts → forge',
  'canon/hooks/stance-guardrail-pre.ts → forge',
  'canon/hooks/stance-guardrail.ts → forge',
  'canon/index.ts → forge',
  'canon/rules/repo-preamble.ts → forge',
  'canon/skills/carry-on/skill.ts → forge',
  'canon/skills/conceptualize/skill.ts → forge',
  'canon/skills/create-agent/skill.ts → forge',
  'canon/skills/create-skill/skill.ts → forge',
  'canon/skills/dream/skill.ts → forge',
  'canon/skills/elicit/skill.ts → forge',
  'canon/skills/event-tap/skill.ts → forge',
  'canon/skills/exemplify/skill.ts → forge',
  'canon/skills/formalize/skill.ts → forge',
  'canon/skills/handoff/skill.ts → forge',
  'canon/skills/introspect/skill.ts → forge',
  'canon/skills/materialize/skill.ts → forge',
  'canon/skills/praxis/skill.ts → forge',
  'canon/skills/probe/skill.ts → forge',
  'canon/skills/signify/skill.ts → forge',
  'canon/skills/wake/skill.ts → forge',
]);

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
    /^@leclabs\/agent-(canon|forge|runtime|memory|cli|schema)/,
  );
  return m ? (m[1] as Pkg) : null;
}

function roleOf(rel: string): Role {
  if (/^(dimensions|skills|agents|hooks|rules|genus)\//.test(rel))
    return 'cell';
  if (rel.startsWith('toolkit/')) return 'build-script';
  return 'root';
}

function srcFiles(pkg: string): string[] {
  return execFileSync('git', ['ls-files', `packages/agent-${pkg}/src`], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => f.endsWith('.ts'));
}

function edges(): Edge[] {
  const out: Edge[] = [];
  for (const pkg of ['canon', 'forge', 'runtime', 'memory', 'cli'] as const) {
    for (const path of srcFiles(pkg)) {
      const rel = path.replace(`packages/agent-${pkg}/src/`, '');
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
    expect(ks).toContain('canon/skills/wake/skill.ts → forge');
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
    // 22 cells is the number PLAN §1 must drive to ZERO. `ARCHITECTURE.md` carried
    // "28" for months; it was never measured and it was wrong.
    expect(canonCells.length, 'canon CELLS importing the projector').toBe(22);
    // These 9 are LICENSED — a corpus built by forge, not defined by it. If this
    // number moves, the cell/build-script line moved with it.
    expect(canonBuild.length, 'canon BUILD SCRIPTS using forge as a tool').toBe(
      9,
    );
    expect(canonRoot.length, 'canon root modules importing the projector').toBe(
      3,
    );
    expect(
      es.filter((e) => e.from === 'canon' && e.to === 'runtime').length,
      'property 1 breaches',
    ).toBe(1);
  });

  it('property 4 — agent-runtime depends on nothing', () => {
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
      .filter((e) => e.to === 'forge' && e.from !== 'cli')
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
    const real = `import { x } from '@leclabs/agent-runtime/bin-name';`;
    const mention = `// TODO: export { y } from '@leclabs/agent-runtime';\nconst t = \`import z from '@leclabs/agent-forge';\`;`;

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
        file: 'toolkit/project.ts',
        role: 'build-script',
        to: 'forge',
      }),
    ).toBe(true);
  });
});
