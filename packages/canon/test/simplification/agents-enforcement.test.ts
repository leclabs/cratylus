// agents · enforcement-level and drift (decision 0142(1), (2)): a value a profile marks
// firm or fixed is never on that ground alone held by refusing an act; nothing judges
// an agent's replies or stance, by guard, hook or model.
//
// Run on the delivered harness itself (the projected omp extension modules, loaded in
// process into a stand-in omp whose judge is a stand-in that finds against the agent,
// or for it, every time it is asked), and read off the projected tree.

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { refusedActs } from './support/acts.js';
import { cleanScratch, git, scratchDir } from './support/cli.js';
import type { StandIn } from './support/omp-stand-in.js';
import { type Projection, projection } from './support/projection.js';
import { type Hit, hitsIn, listed } from './support/repo.js';

let p: Projection;
let cwd: string;
beforeAll(() => {
  p = projection();
  cwd = scratchDir('simplification-enforcement-');
  git(cwd, 'init', '-q', '-b', 'feature/lantern');
  git(
    cwd,
    '-c',
    'user.name=f',
    '-c',
    'user.email=f@e',
    'commit',
    '-q',
    '--allow-empty',
    '-m',
    'start',
  );
}, 120_000);
const open: StandIn[] = [];
afterEach(() => {
  for (const s of open.splice(0)) s.close();
});
afterAll(cleanScratch);

/** A model asked to judge: a model client, a call that completes a prompt, or a
 *  harness or agent command run to print an answer. */
const MODEL_JUDGED =
  /completeSimple|@oh-my-pi\/pi-ai|@anthropic-ai\/sdk|\bfrom\s+['"]openai['"]|\b(claude|omp|codex|gemini)\s+(-p|--print)\b/;

/** Every place in the projected tree a model is asked something. */
const modelCalls = (files: Readonly<Record<string, string>>): Hit[] =>
  Object.entries(files).flatMap(([path, text]) =>
    hitsIn(path, text, MODEL_JUDGED),
  );

describe('agents/6 — a firm or fixed value is never held by refusing an act on that ground alone', () => {
  it('agents/6: every delivered agent marks values firm or fixed (the ground under test is present)', () => {
    for (const d of p.agents)
      expect(d.body, `${d.name} marks no value firm or fixed`).toMatch(
        /\((fixed|firm)\)/,
      );
  });

  it('agents/6: no act of any delivered agent, launched or dispatched, is refused, whatever a judge of its values finds', async () => {
    const refused: string[] = [];
    for (const d of p.agents)
      refused.push(...(await refusedActs(p, d, cwd, open)).refused);
    expect(refused, `acts refused:\n${refused.join('\n')}`).toEqual([]);
  }, 240_000);
});

describe("agents/7 — no guard, hook or model-judged check holds an agent's replies or stance", () => {
  it('agents/7: the delivered tree asks no model to judge anything', () => {
    const hits = modelCalls(p.files);
    expect(hits, `model calls in the delivered tree:\n${listed(hits)}`).toEqual(
      [],
    );
  });

  it('FLAGS a delivered module that asks a model, so the scan above is not dark', () => {
    const planted = {
      'enforcing/x.ts': "import { completeSimple } from '@oh-my-pi/pi-ai';",
    };
    expect(modelCalls(planted)).not.toEqual([]);
    expect(modelCalls({ 'hooks/x.sh': 'claude -p "judge this"' })).not.toEqual(
      [],
    );
    expect(modelCalls({ 'agents/x.md': 'the operator judges in use' })).toEqual(
      [],
    );
  });

  it('agents/7: no delivered agent is judged by a model, held or answered back on its replies, launched or dispatched', async () => {
    const all = { refused: [] as string[], judged: 0, sent: [] as string[] };
    for (const d of p.agents) {
      const r = await refusedActs(p, d, cwd, open);
      all.refused.push(...r.refused);
      all.judged += r.judged;
      all.sent.push(...r.sent);
    }
    expect(all.judged, 'times a model was asked to judge an agent').toBe(0);
    expect(all.sent, `replies answered back:\n${all.sent.join('\n')}`).toEqual(
      [],
    );
    expect(
      all.refused,
      `acts or replies held:\n${all.refused.join('\n')}`,
    ).toEqual([]);
  }, 240_000);
});
