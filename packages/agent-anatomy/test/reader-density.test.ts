// READER-DENSITY gate — the enforcement leg of the reader binding ρ
// (`src/skills/signify.ts`, READER BINDING): the RULE is
//
//   conform(a) ⇔ register(a) = ρ(a)
//
// enforced here one-sidedly: ρ(a) = LLM ⇒ register(a) = LLM. `register(a)` is
// decided by a deterministic detector that witnesses register=human via named
// lexical signal classes (`reader-register.ts`, the shared model); absence of
// a witness = register LLM. For
// ρ(a) = human artifacts (README · human docs · commit messages) the gate
// ABSTAINS — exemption falls out of ρ, never a special-cased path; the detector
// is one-sided (it can witness human register, not certify it), so it cannot
// convict a human-facing artifact.
//
// REGISTER ≠ DENSITY. The gate convicts reader=human REGISTER (tutorial
// second-person address, hedge/connective prose, human-gloss walkthrough); it
// does NOT score density-to-the-bar — that is `remediation-fanout` judge
// territory (calibration 2026-07-01 proved raw glue-ratio does not separate:
// live verbose-but-LLM-register cells overlap human prose).
//
// SIGNAL CLASSES (thresholds frozen from the 2026-07-01 corpus sweep; each has
// live-corpus margin — the 4 densified exemplars and the whole non-pinned
// corpus sit at 0 hits, the pinned genus bodies at 5.4–5.5 second-person/100):
//   HEDGE          — ≥2 distinct tutorial/hedge/connective patterns
//                    (live max = 1, on pinned ideas/memory.md; seed fixture = 6)
//   SECOND-PERSON  — ≥2 hits ∧ ≥4 per 100 words (one incidental agent-address
//                    hit is legal: carry-on delineation = 1 hit @3.1)
//   FPP-WALKTHROUGH— ≥2 first-person-plural walkthrough tokens (live = 0)
//
// RATCHET — explicit, shrink-only allowlist. Empty when the corpus fully
// conforms; a violation may only be pinned here deliberately, in the open.
// No silent exemptions: a pinned surface that STOPS failing FAILS the suite
// (remove the pin); a new violation is never pinnable silently (the sets are
// literal here). Cross-organ consistency (root-cause H3): `llm-native` ∧
// `natural-language` in one agent vector = a register contradiction.
//
// NON-VACUOUS: a seeded human-register definiens is convicted with named
// signals; the same text under a ρ=human class is exempt BY THE MODEL; the 4
// densified exemplars pass. All asserted below.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Agent, Fragment } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';
import type { SkillCell } from '../src/toolkit/skill-cell.js';
// ρ + register(a) + conform — ONE shared model (`reader-register.ts`), also
// enforced over the runtime frontiers by `reader-reach.test.ts`; RHO mirrors
// the READER BINDING subset lists (signify).
import {
  type ArtClass,
  conform,
  humanRegisterSignals,
  registerOf,
} from './reader-register.js';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(anatomyRoot, 'src');

// ── RATCHET — explicit, shrink-only ─────────────────────────────────────────────

/** Known non-conforming R=LLM surfaces, pinned until wave(3) `remediation-fanout`. */
const REGISTER_RATCHET: ReadonlySet<string> = new Set([]);

/** root-cause H3: (engineering-principle, output-format) pairs that contradict. */
const CONTRADICTION_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['llm-native', 'natural-language'],
];

/** Agents with a known organ contradiction, pinned until the anatomy fix-class task. */
const CONTRADICTION_RATCHET: ReadonlySet<string> = new Set([]);

// ── surface enumeration (source grain — the projections follow the source) ──────

interface Surface {
  readonly label: string;
  readonly cls: ArtClass;
  readonly text: string;
}

/** Lines of `body` OUTSIDE ``` fences — fences are formal notation (symbols gate). */
function proseOutsideFences(body: string): string {
  let open = false;
  return body
    .split('\n')
    .filter((l) => {
      if (l.startsWith('```')) {
        open = !open;
        return false;
      }
      return !open;
    })
    .join('\n');
}

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) {
    out.push(p);
  }
  return out.sort();
}

async function allSurfaces(): Promise<Surface[]> {
  const surfaces: Surface[] = [];
  for (const rel of await collect('organs/**/*.ts')) {
    const f = await firstExport<Fragment>(join(srcRoot, rel));
    surfaces.push({
      label: `organ ${relative('organs', rel).replace(/\.ts$/, '')}`,
      cls: 'organ-definiens',
      text: f.definiens,
    });
  }
  for (const rel of await collect('skills/*.ts')) {
    const s = await firstExport<SkillCell>(join(srcRoot, rel));
    surfaces.push({
      label: `skill ${s.name} (delineation)`,
      cls: 'skill-delineation',
      text: s.delineation,
    });
    surfaces.push({
      label: `skill ${s.name} (prose)`,
      cls: 'skill-prose',
      text: proseOutsideFences(s.body),
    });
  }
  for (const name of ['memory.md', 'persona.md']) {
    const raw = readFileSync(join(anatomyRoot, 'ideas', name), 'utf8');
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
    // ρ binds at the finest separately-consumed grain: `## Protocol` projects
    // into every SOUL; the sibling sections are corpus/skill-dir surfaces.
    // Each section is its own artifact — none silently skipped.
    for (const section of body.split(/^(?=## )/m)) {
      const head = section.startsWith('## ')
        ? (section.split('\n')[0] as string).split(' — ')[0]
        : '(preamble)';
      surfaces.push({
        label: `genus ideas/${name} ${head}`,
        cls: 'genus-protocol',
        text: section,
      });
    }
  }
  return surfaces;
}

async function allAgents(): Promise<Array<{ rel: string; agent: Agent }>> {
  const out: Array<{ rel: string; agent: Agent }> = [];
  for (const rel of await collect('agents/*.ts')) {
    if (rel.endsWith('base.ts')) {
      continue;
    }
    const mod = (await import(
      pathToFileURL(join(srcRoot, rel)).href
    )) as Record<string, unknown>;
    const key = Object.keys(mod).find(
      (k) => k !== 'default' && !k.endsWith('Resolved'),
    );
    out.push({ rel, agent: mod[key as string] as Agent });
  }
  return out;
}

/** The contradiction pairs `agent` carries (root-cause H3). */
function organContradictions(agent: Agent): string[] {
  const principles = (agent.engineeringPrinciples ?? []).map((f) => f.slug);
  const output = agent.outputFormat?.slug;
  return CONTRADICTION_PAIRS.filter(
    ([p, o]) => principles.includes(p) && output === o,
  ).map(([p, o]) => `${p} ∧ ${o}`);
}

// ── the gate ────────────────────────────────────────────────────────────────────

describe('READER-DENSITY gate — conform(a) ⇔ register(a) = ρ(a)', () => {
  it('the 4 densified exemplars PASS (calibration anchors)', async () => {
    for (const rel of [
      'organs/role/curate.ts',
      'organs/objective/parsimony.ts',
      'organs/transparency/decision-rationale.ts',
      'organs/capabilities/research-investigation.ts',
    ]) {
      const f = await firstExport<Fragment>(join(srcRoot, rel));
      expect(
        humanRegisterSignals(f.definiens),
        `${rel} is a PASS exemplar`,
      ).toEqual([]);
    }
  });

  it('every ρ=LLM surface conforms, or is an explicit ratchet pin', async () => {
    const surfaces = await allSurfaces();
    // cardinality sanity — the gate SEES the whole corpus incl. both genus protocols
    const genusLabels = surfaces
      .filter((s) => s.cls === 'genus-protocol')
      .map((s) => s.label);
    expect(genusLabels).toContain('genus ideas/memory.md ## Protocol');
    expect(genusLabels).toContain('genus ideas/persona.md ## Protocol');
    expect(
      surfaces.filter((s) => s.cls === 'organ-definiens').length,
    ).toBeGreaterThan(100);
    const failures = surfaces
      .filter((s) => !conform(s.cls, s.text) && !REGISTER_RATCHET.has(s.label))
      .map(
        (s) =>
          `REGISTER ${s.label}: ρ=LLM but register=human — ${humanRegisterSignals(s.text).join(' · ')}`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('the ratchet is shrink-only: every pin still FAILS (else remove the pin)', async () => {
    const surfaces = await allSurfaces();
    for (const label of REGISTER_RATCHET) {
      const s = surfaces.find((x) => x.label === label);
      expect(s, `ratchet pin ${label} names a scanned surface`).toBeDefined();
      expect(
        registerOf((s as Surface).text),
        `${label} now conforms — REMOVE its ratchet pin`,
      ).toBe('human');
    }
  });

  it('no agent vector carries a register contradiction (root-cause H3), or is pinned', async () => {
    const agents = await allAgents();
    expect(agents.length).toBe(11);
    const failures = agents
      .filter(
        ({ agent }) =>
          organContradictions(agent).length > 0 &&
          !CONTRADICTION_RATCHET.has(agent.name),
      )
      .map(
        ({ agent }) =>
          `CONTRADICTION ${agent.name}: ${organContradictions(agent).join(' · ')}`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
    // shrink-only, same law as the register ratchet
    for (const name of CONTRADICTION_RATCHET) {
      const entry = agents.find(({ agent }) => agent.name === name);
      expect(
        entry,
        `contradiction pin ${name} names a live agent`,
      ).toBeDefined();
      expect(
        organContradictions((entry as { agent: Agent }).agent).length,
        `${name} no longer contradicts — REMOVE its ratchet pin`,
      ).toBeGreaterThan(0);
    }
  });

  // ── NON-VACUOUS: the gate BITES, and the exemption is the model's ─────────────
  const humanSeed =
    'This value means that the agent should always be helpful and make sure ' +
    'that it explains its reasoning clearly, because it is important for you ' +
    'to understand what is going on. In other words, note that clarity matters ' +
    'and you should keep it in mind.';

  it('FAILS a seeded human-register definiens, with named signals', () => {
    const signals = humanRegisterSignals(humanSeed);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.join(' ')).toContain('HEDGE');
    expect(conform('organ-definiens', humanSeed)).toBe(false);
  });

  it('EXEMPTS the same human-register text when ρ(a)=human — by the model, not a path', () => {
    expect(registerOf(humanSeed)).toBe('human'); // the detector still sees it…
    expect(conform('readme', humanSeed)).toBe(true); // …ρ exempts it
    expect(conform('human-doc', humanSeed)).toBe(true);
    expect(conform('commit-message', humanSeed)).toBe(true);
  });

  it('convicts each signal class independently (calibration margins hold)', () => {
    // SECOND-PERSON: rate + hits both required — one agent-address hit is legal.
    expect(
      humanRegisterSignals('closing a check-in and returning you to execution'),
    ).toEqual([]);
    expect(
      humanRegisterSignals(
        'you drift; you own it; your stance decays; hold yours',
      ),
    ).toEqual([expect.stringContaining('SECOND-PERSON')]);
    // FPP walkthrough.
    expect(humanRegisterSignals('we walk the tree, then we prune it')).toEqual([
      expect.stringContaining('FPP-WALKTHROUGH'),
    ]);
    // one hedge alone is NOT a conviction (threshold = 2 distinct patterns).
    expect(humanRegisterSignals('for example, a fenced block')).toEqual([]);
  });
});
