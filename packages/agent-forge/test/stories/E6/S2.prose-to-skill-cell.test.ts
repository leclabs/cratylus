/**
 * E6.S2 — prose procedure → self-sufficient set-builder skill cell.
 *
 * GRADUATED: the pipeline ships in `src/core/exemplify/`. The cell SPEC
 * below is the LLM formalize pass's output over the prose fixture (the test
 * plays the operating agent); the frame renders the SKILL.md
 * deterministically and enforces the mechanical cell laws (kebab name,
 * declarations-above / laws-below, no undeclared symbol). The assertions are
 * the pinned structural contract plus the answer-key round-trip: the formal
 * block ALONE re-derives the procedure steps, in order.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import {
  type ConceptRecord,
  type SkillCellSpec,
  optimize,
  renderSkillCell,
} from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** The raw multi-step how-to (no structure) the pipeline must cell-ify. */
const PROSE_PROCEDURE = `To release the package you first make sure the
working tree is clean, then you bump the version in package.json according
to semver, then you regenerate the changelog from the merged pull requests,
then you build the artifacts and run the whole test suite, and only if the
suite is green you tag the commit with the version and push the tag, which
triggers the publish workflow.
`;

/** Pinned answer key: the steps a blind reader must recover from the formal
 * block alone (order-sensitive). */
const ANSWER_KEY_STEPS = [
  'clean',
  'bump',
  'changelog',
  'build',
  'green',
  'tag',
  'push',
  'publish',
];

const SKILL_PATH = 'skills/release/SKILL.md';

/** The LLM formalize pass's output over the prose (the cell spec). */
const CELL: SkillCellSpec = {
  name: 'release',
  description:
    'release the package — clean worktree through published tag, gate ordered',
  verb: 'release',
  declarations: [
    { symbol: 'clean', definiens: 'worktree holds zero uncommitted changes' },
    { symbol: 'bump', definiens: 'package.json version := semver-next' },
    { symbol: 'changelog', definiens: 'regenerated from merged pull requests' },
    { symbol: 'build', definiens: 'artifacts compiled' },
    { symbol: 'green', definiens: 'the whole test suite passes' },
    { symbol: 'tag', definiens: 'git tag v<version> at the release commit' },
    { symbol: 'push', definiens: 'the tag pushed to origin' },
    { symbol: 'publish', definiens: 'workflow triggered by the pushed tag' },
  ],
  laws: [
    'release ≜ clean → bump → changelog → build → green → tag → push → publish',
    '¬green ⇒ ¬tag',
  ],
};

/** The routing plan: each step-concept homed at the cell. */
const CONCEPTS: ConceptRecord[] = ANSWER_KEY_STEPS.map((step, i) => ({
  gloss: `release step ${i + 1}: ${step}`,
  anchor: step,
  home: SKILL_PATH,
  rank: i,
}));

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
  writeFileSync(join(cwd, 'release-howto.md'), PROSE_PROCEDURE, 'utf8');
  optimize({
    source: join(cwd, 'release-howto.md'),
    concepts: CONCEPTS,
    artifacts: [{ path: SKILL_PATH, body: renderSkillCell(CELL) }],
    outDir: cwd,
  });
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S2',
  'the emitted SKILL.md is a well-formed cell: name+description frontmatter, verb H1, fenced declarations-above/laws-below formal block with no undeclared symbol',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    const skillFile = join(cwd, SKILL_PATH);
    expect(existsSync(skillFile)).toBe(true);
    const md = readFileSync(skillFile, 'utf8');
    // Spec-valid frontmatter [S6].
    expect(md).toMatch(/^---\n(?:.*\n)*?name: [a-z0-9-]+\n/);
    expect(md).toMatch(/\ndescription: .+\n/);
    // A verb H1.
    expect(md).toMatch(/\n# \w+/);
    // A fenced formal block…
    const fence = md.match(/```(?:text)?\n([\s\S]*?)```/);
    expect(fence).not.toBeNull();
    const block = (fence as RegExpMatchArray)[1] as string;
    // …declarations above (≜ definitions) and laws below…
    const declarations = [...block.matchAll(/^(\S+)\s*(?:≜|:)/gmu)].map(
      (m) => m[1] as string,
    );
    expect(declarations.length).toBeGreaterThan(0);
    // …self-sufficiency: every non-ASCII-operator symbol token used in the
    // block resolves to an in-block declaration (mechanical symbol table).
    const used = new Set(
      [...block.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)].map(
        (m) => m[1] as string,
      ),
    );
    const undeclared = [...used].filter((s) => !declarations.includes(s));
    expect(undeclared).toEqual([]);
  },
);

story(
  'E6.S2',
  'round-trip: the formal block alone re-derives the procedure steps of the pinned answer key',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    const skillFile = join(cwd, SKILL_PATH);
    expect(existsSync(skillFile)).toBe(true);
    const md = readFileSync(skillFile, 'utf8');
    const fence = md.match(/```(?:text)?\n([\s\S]*?)```/);
    expect(fence).not.toBeNull();
    const block = (fence as RegExpMatchArray)[1] as string;
    // Equivalence spot-check: every pinned step is recoverable from the
    // formal block WITHOUT the source prose, in order.
    let cursor = -1;
    for (const step of ANSWER_KEY_STEPS) {
      const at = block.toLowerCase().indexOf(step, cursor + 1);
      expect(
        at,
        `step '${step}' not derivable from the formal block`,
      ).toBeGreaterThan(-1);
      cursor = at;
    }
  },
);
