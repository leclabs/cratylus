// GATE — the canon is the GENERIC design, so every harness gets it.
//
// WHY THIS EXISTS. `.render-ts-codex/` carried `agents`, `AGENTS.md` and `skills`
// and NO hooks at all: every codex agent ran with no stance guardrail, no memory
// nudge, no resume notice. The whole suite was green. Nothing was broken in a way
// any gate could see, because the loss was authored — a build step deleted canon's
// hooks dir from the codex plugin set, on a comment claiming codex had no hook
// surface. A considered-looking omission is invisible to every test that checks
// what IS emitted rather than what ISN'T.
//
// So this gate reads BOTH renders and compares them. It does not check that the
// bytes match — they must not; a face is harness-specific by construction. It
// checks that no cell is silently ABSENT from one harness while present on
// another, and that no harness's artifacts carry another harness's paths.
//
// A harness genuinely unable to realize a cell is not a violation — the projector
// degrades and warns for that. What this forbids is the SILENT drop.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const canon = join(here, '..');
const CLAUDE = join(canon, '.render-ts');
const CODEX = join(canon, '.render-ts-codex');

/** Every harness render this corpus produces, with the artifact naming its hooks. */
const RENDERS = [
  {
    harness: 'claude',
    root: CLAUDE,
    hooksFile: 'settings.json',
    home: '.claude',
  },
  { harness: 'codex', root: CODEX, hooksFile: 'hooks.json', home: '.codex' },
] as const;

const present = RENDERS.filter((r) => existsSync(r.root));

function hookDirs(root: string): string[] {
  const d = join(root, 'hooks');
  return existsSync(d)
    ? readdirSync(d, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];
}

/**
 * The PURE core, so the gate can be convicted without corrupting a render.
 * Returns the violations found in a set of ⟨harness, cells, hookConfig⟩ readings.
 */
function parityViolations(
  readings: readonly {
    harness: string;
    cells: readonly string[];
    config: string | null;
    home: string;
    foreignHomes: readonly string[];
  }[],
): string[] {
  const out: string[] = [];
  const [first, ...rest] = readings;
  if (!first) return out;
  for (const other of rest) {
    if (other.cells.join('\u0000') !== first.cells.join('\u0000')) {
      out.push(
        `${other.harness} deploys [${other.cells.join(', ')}] where ${first.harness} deploys [${first.cells.join(', ')}]`,
      );
    }
  }
  for (const r of readings) {
    if (r.cells.length > 0 && r.config === null) {
      out.push(`${r.harness} has hook cells but emitted no hook config`);
      continue;
    }
    if (r.config === null) continue;
    for (const foreign of r.foreignHomes) {
      if (r.config.includes(foreign))
        out.push(`${r.harness} config names foreign home ${foreign}`);
    }
    if (!r.config.includes(r.home))
      out.push(`${r.harness} config names no home at all`);
  }
  return out;
}

describe('CONVICTING FIXTURES — the gate fed inputs it MUST reject', () => {
  type Reading = Parameters<typeof parityViolations>[0][number];
  const ok: Reading[] = [
    {
      harness: 'claude',
      cells: ['a', 'b'],
      config: 'sh "$HOME/.claude/hooks/a/a.sh"',
      home: '.claude',
      foreignHomes: ['.codex'],
    },
    {
      harness: 'codex',
      cells: ['a', 'b'],
      config: 'sh "$HOME/.codex/hooks/a/a.sh"',
      home: '.codex',
      foreignHomes: ['.claude'],
    },
  ];

  it('passes a clean pair — the negative control', () => {
    expect(parityViolations(ok)).toEqual([]);
  });

  it('CONVICTS the original defect: a harness silently missing every cell', () => {
    const bad = [
      ok[0] as Reading,
      { ...(ok[1] as Reading), cells: [], config: null },
    ];
    expect(parityViolations(bad).join(' | ')).toMatch(/codex deploys \[\]/);
  });

  it('CONVICTS a harness missing ONE cell', () => {
    const bad = [ok[0] as Reading, { ...(ok[1] as Reading), cells: ['a'] }];
    expect(parityViolations(bad)).not.toEqual([]);
  });

  it('CONVICTS a config carrying another harness’s home', () => {
    const bad = [
      ok[0] as Reading,
      { ...(ok[1] as Reading), config: 'sh "$HOME/.claude/hooks/a/a.sh"' },
    ];
    expect(parityViolations(bad).join(' | ')).toMatch(/foreign home \.claude/);
  });

  it('CONVICTS cells present with no config emitted', () => {
    const bad = [ok[0] as Reading, { ...(ok[1] as Reading), config: null }];
    expect(parityViolations(bad).join(' | ')).toMatch(/no hook config/);
  });
});

describe('GATE — no cell is silently absent from a harness', () => {
  it('both renders exist — else this gate is vacuous', () => {
    // The control. With one render missing, every comparison below passes by
    // having nothing to compare, which is exactly how the original defect hid.
    expect(
      present.map((r) => r.harness).sort(),
      'run `pnpm canon:project` and `pnpm --filter @cratylus/canon project:codex` first',
    ).toEqual(['claude', 'codex']);
  });

  it('every harness deploys the SAME set of governance cells', () => {
    const byHarness = present.map((r) => ({
      harness: r.harness,
      cells: hookDirs(r.root),
    }));
    const [first, ...rest] = byHarness;
    expect(
      first?.cells.length,
      'a render with zero hook cells',
    ).toBeGreaterThan(0);
    for (const other of rest) {
      expect(
        other.cells,
        `${other.harness} deploys a different cell set than ${first?.harness} — if a harness genuinely cannot realize one, the projector must WARN, never drop it silently`,
      ).toEqual(first?.cells);
    }
  });

  it('every harness emits its own hook config artifact', () => {
    for (const r of present) {
      expect(
        existsSync(join(r.root, r.hooksFile)),
        `${r.harness} has hook cells but no ${r.hooksFile}`,
      ).toBe(true);
    }
  });
});

describe('GATE — no harness carries another harness’s paths', () => {
  it('each hook config references only its OWN harness home', () => {
    for (const r of present) {
      const raw = readFileSync(join(r.root, r.hooksFile), 'utf8');
      const foreign = RENDERS.filter((o) => o.home !== r.home);
      for (const o of foreign) {
        expect(
          raw.includes(o.home),
          `${r.harness}'s ${r.hooksFile} names ${o.home} — a command derived from the wrong adapter, i.e. a cell that chose a face`,
        ).toBe(false);
      }
      // The positive half: it must name its own, or the command is nonsense.
      expect(raw, `${r.harness} names no home at all`).toContain(r.home);
    }
  });
});
