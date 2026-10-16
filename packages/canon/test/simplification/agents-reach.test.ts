// agents · reach (decision 0142(2), (3)): who dispatches whom is never refused, and each
// role starts with the harness's default tools, narrowed only where its declaration
// names the observed harm.
//
// Read from the delivered project as omp receives it: the projected agent declarations
// (the settings omp's own dispatch honours) and the projected extension modules, loaded
// in process into a stand-in omp (no omp, agent or model runs).

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanScratch, git, scratchDir } from './support/cli.js';
import {
  SETTLED_CUT,
  type StandIn,
  completeAssignment,
  fenced,
  standIn,
} from './support/omp-stand-in.js';
import {
  type Declaration,
  type Projection,
  projection,
} from './support/projection.js';

let p: Projection;
let cwd: string;
beforeAll(() => {
  p = projection();
  // A repository on the branch of the cut the stand-in command answers for, so no read
  // of a cut's state finds anything to object to.
  cwd = scratchDir('simplification-reach-');
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

/** Whom a declaration's dispatch setting limits it to, or `undefined` for anyone. */
function limit(d: Declaration): string | undefined {
  const spawns = d.front.spawns;
  if (spawns === undefined || spawns === null) return undefined;
  const said = (
    Array.isArray(spawns) ? spawns.join(',') : String(spawns)
  ).trim();
  return said === '*' ? undefined : said;
}

describe('agents/4 — any delivered role dispatches any other, and nothing refuses it for who dispatches whom', () => {
  it('agents/4: no delivered declaration limits whom it may dispatch', () => {
    const limited = p.agents
      .filter((d) => limit(d) !== undefined)
      .map((d) => `${d.name}: spawns ${JSON.stringify(d.front.spawns)}`);
    expect(limited, 'declarations limiting whom they dispatch').toEqual([]);
  });

  it('agents/4: the harness lets every delivered agent, launched or dispatched, dispatch every other', async () => {
    const refused: string[] = [];
    for (const from of p.agents) {
      for (const kind of ['main', 'sub'] as const) {
        // Who dispatches whom is all this asks: a judge of anything else gives no
        // verdict, and the session has already spoken.
        const s = await standIn(p, {
          ...(kind === 'main' ? { agent: from.name } : {}),
          answers: SETTLED_CUT,
          verdict: 'none',
          cwd,
        });
        open.push(s);
        const at = kind === 'main' ? { kind } : { kind, name: from.name };
        await s.fire('session_start', {}, at);
        await s.fire(
          'before_agent_start',
          { prompt: 'Begin.', systemPrompt: ['base'] },
          at,
        );
        const reply = {
          role: 'assistant',
          content: [{ type: 'text', text: 'Read back: the design stands.' }],
        };
        await s.fire('message_end', { message: reply }, at);
        for (const to of p.agents) {
          if (to.name === from.name) continue;
          const spawn = await s.fire(
            'before_subagent_spawn',
            { agent: to.name },
            at,
          );
          if (spawn.blocked !== undefined || spawn.threw !== undefined)
            refused.push(
              `${from.name} (${kind}) → ${to.name} at spawn: ${spawn.blocked ?? spawn.threw}`,
            );
          const task = fenced(
            completeAssignment(to.front.assignment),
            `Work for ${to.name}.`,
          );
          const call = await s.fire(
            'tool_call',
            {
              toolName: 'task',
              toolCallId: `${from.name}-${to.name}`,
              input: { tasks: [{ agent: to.name, name: 'One', task }] },
            },
            at,
          );
          if (call.blocked !== undefined || call.threw !== undefined)
            refused.push(
              `${from.name} (${kind}) → ${to.name} at dispatch: ${call.blocked ?? call.threw}`,
            );
        }
        s.close();
      }
    }
    expect(refused, `refused dispatches:\n${refused.join('\n')}`).toEqual([]);
  }, 120_000);
});

describe("agents/5 — each delivered role starts with the harness's default tools", () => {
  /** How a declaration narrows its tools without naming the observed harm, if it does:
   *  a tools list, disallowed tools, or a dispatch setting that empties or lists whom
   *  the dispatch tool may reach. */
  function narrowedWithoutHarm(d: Declaration): string | undefined {
    const what: string[] = [];
    if (d.front.tools !== undefined)
      what.push(`tools ${JSON.stringify(d.front.tools)}`);
    if (
      d.front.disallowedTools !== undefined ||
      d.front['disallowed-tools'] !== undefined
    )
      what.push('disallowed tools');
    if (limit(d) !== undefined)
      what.push(`spawns ${JSON.stringify(d.front.spawns)}`);
    return what.length > 0 && !/\bharm\b/i.test(d.text)
      ? `${d.name}: ${what.join(', ')}`
      : undefined;
  }

  it('agents/5: no delivered declaration narrows its tools, or the dispatch tool, without naming the observed harm', () => {
    const narrowed = p.agents.flatMap((d) => narrowedWithoutHarm(d) ?? []);
    expect(
      narrowed,
      'declarations narrowed with no observed harm named',
    ).toEqual([]);
  });

  it('FLAGS a declaration narrowed with no harm named, and passes one left whole, so the reading above is not dark', () => {
    const declared = (front: Record<string, unknown>, body = 'Body.') =>
      ({ name: 'x', file: 'x.md', front, body, text: body }) as Declaration;
    expect(narrowedWithoutHarm(declared({ tools: ['read'] }))).toBeDefined();
    expect(narrowedWithoutHarm(declared({ spawns: '' }))).toBeDefined();
    expect(narrowedWithoutHarm(declared({ spawns: 'lead' }))).toBeDefined();
    expect(
      narrowedWithoutHarm(
        declared(
          { tools: ['read'] },
          'Narrowed: the observed harm was a deleted journal.',
        ),
      ),
    ).toBeUndefined();
    expect(narrowedWithoutHarm(declared({}))).toBeUndefined();
    expect(narrowedWithoutHarm(declared({ spawns: '*' }))).toBeUndefined();
  });

  it("agents/5: the harness leaves every delivered agent's active tools as the harness set them", async () => {
    const touched: string[] = [];
    for (const d of p.agents) {
      const s = await standIn(p, { agent: d.name, cwd });
      open.push(s);
      await s.fire('session_start', {});
      await s.fire('before_agent_start', {
        prompt: 'Begin.',
        systemPrompt: ['the base prompt'],
      });
      const set = s.shown.filter((x) => /ActiveTools|tools/i.test(x.kind));
      if (set.length > 0) touched.push(`${d.name}: ${JSON.stringify(set)}`);
      s.close();
    }
    expect(touched, 'agents whose active tools the harness set').toEqual([]);
  });
});
