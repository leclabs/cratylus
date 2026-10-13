// agents · binding (decision 0142(3)): a dispatch or launch whose assignment is
// incomplete is shown its typed assignment and warned, and never refused; a complete one
// is shown it and not warned.
//
// Exercised on the delivered harness itself: the projected omp extension modules,
// loaded in process into a stand-in omp that discovers the projected agent
// declarations. A dispatch is the harness's `tool_call` of a task; a launch is a main
// session started `--agent <name>`. What counts as shown is everything the modules put
// before the session: its notices, messages and status, its stderr, and the turn's
// system prompt.

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanScratch } from './support/cli.js';
import {
  type Outcome,
  type Shown,
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
let agent: Declaration;
let schema: { required: string[]; properties: Record<string, unknown> };
beforeAll(() => {
  p = projection();
  // A delivered agent that takes a typed assignment of two or more fields and opens no
  // cut's work (so nothing about a cut's state is read for it).
  const typed = p.agents.filter((d) => {
    const a = d.front.assignment as { required?: string[] } | undefined;
    return (a?.required?.length ?? 0) >= 2;
  });
  const chosen =
    typed.find((d) => d.name === 'assayer') ??
    typed.find((d) => d.name === 'illustrator') ??
    typed[0];
  if (chosen === undefined)
    throw new Error('no delivered agent takes a typed assignment');
  agent = chosen;
  schema = agent.front.assignment as typeof schema;
}, 120_000);
const open: StandIn[] = [];
afterEach(() => {
  for (const s of open.splice(0)) s.close();
});
afterAll(cleanScratch);

async function session(
  start: Parameters<typeof standIn>[1] = {},
): Promise<StandIn> {
  const s = await standIn(p, start);
  open.push(s);
  return s;
}

/** A warning: a notice at warning or error level, or text that says warn, missing,
 *  incomplete or refused. */
const isWarning = (s: Shown): boolean =>
  (s.kind === 'notify' && (s.level === 'warning' || s.level === 'error')) ||
  /warn|missing|incomplete|refus/i.test(s.text);

/** Everything a session is shown, as text: its turn's system prompt and each thing shown. */
const allShown = (o: Outcome, turn?: Outcome): string =>
  [
    ...(turn?.systemPrompt ?? []),
    ...(turn?.shown ?? []).map((s) => s.text),
    ...o.shown.map((s) => s.text),
  ].join('\n');

/** A dispatch of `agent` carrying `assignment`, from a plain main session that has
 *  started a turn. */
async function dispatched(assignment: Record<string, unknown>) {
  const s = await session();
  await s.fire('session_start', {});
  const turn = await s.fire('before_agent_start', {
    prompt: 'Have the cut judged.',
    systemPrompt: ['the base prompt'],
  });
  const input = {
    tasks: [
      {
        agent: agent.name,
        name: 'One',
        task: fenced(assignment, 'Judge the cut.'),
      },
    ],
  };
  const call = await s.fire('tool_call', {
    toolName: 'task',
    toolCallId: 'call-1',
    input,
  });
  return { s, turn, call, input };
}

describe('agents/1 — an incomplete dispatch is shown its typed assignment, warned and started', () => {
  it('agents/1: the dispatch is not refused, the agent is still dispatched, and a warning names the missing field', async () => {
    const full = completeAssignment(schema);
    const missing = schema.required[1] as string;
    const { [missing]: _left, ...partial } = full;
    const { turn, call, input } = await dispatched(partial);
    expect(call.threw, 'the dispatch threw').toBeUndefined();
    expect(
      call.blocked,
      `the dispatch was refused: ${call.blocked}`,
    ).toBeUndefined();
    expect(
      input.tasks.map((t) => t.agent),
      'the agent is no longer among those dispatched',
    ).toContain(agent.name);
    const warned = call.shown.filter(
      (s) => isWarning(s) && s.text.includes(missing),
    );
    expect(
      warned,
      `no warning naming the missing field '${missing}' was shown; shown: ${JSON.stringify(call.shown)}`,
    ).not.toEqual([]);
    // The typed assignment itself is shown: every field it requires.
    const shownText = allShown(call, turn);
    for (const field of schema.required)
      expect(
        shownText,
        `the typed assignment shown lacks '${field}'`,
      ).toContain(field);
  });
});

describe('agents/3 — a complete dispatch is shown its typed assignment and not warned', () => {
  it('agents/3: the dispatch goes ahead with its typed assignment shown, no warning, and nothing said of refusing it', async () => {
    const { turn, call } = await dispatched(completeAssignment(schema));
    expect(call.threw, 'the dispatch threw').toBeUndefined();
    expect(
      call.blocked,
      `the dispatch was refused: ${call.blocked}`,
    ).toBeUndefined();
    expect(
      call.shown.filter(isWarning),
      'a complete dispatch was warned about',
    ).toEqual([]);
    const shownText = allShown(call, turn);
    for (const field of schema.required)
      expect(
        shownText,
        `the typed assignment shown lacks '${field}'`,
      ).toContain(field);
    // Shown with the typed assignment, no word that a dispatch is refused: the harness
    // never refuses one for its assignment.
    expect(
      shownText,
      'what is shown with the typed assignment says a dispatch is refused',
    ).not.toMatch(/\brefus(ed|es|al)\b/i);
  });
});

describe('agents/2 — a launch with no assignment is warned and starts', () => {
  /** Warnings a launch was shown, as text, anywhere: notices, stderr, the turn's prompt. */
  const warningsOf = (...outcomes: Outcome[]): string[] =>
    outcomes.flatMap((o) => [
      ...o.shown.filter(isWarning).map((s) => s.text),
      ...(o.systemPrompt ?? []).filter((t) => /incomplete|missing/i.test(t)),
    ]);
  /** A warning that the assignment is incomplete: it says so, of the assignment. */
  const saysIncomplete = (t: string): boolean =>
    /assignment/i.test(t) && /incomplete|missing/i.test(t);

  /** A launch as the agent, its prompt typed in the session. */
  async function typed(prompt: string) {
    const s = await session({ agent: agent.name });
    const started = await s.fire('session_start', {});
    const input = await s.fire('input', {
      text: prompt,
      source: 'interactive',
    });
    const turn = await s.fire('before_agent_start', {
      prompt,
      systemPrompt: ['the base prompt'],
    });
    return { started, input, turn };
  }

  it('agents/2: a launch whose typed prompt carries no assignment reads it and starts as the agent, warned the assignment is incomplete', async () => {
    const { started, input, turn } = await typed('Judge the cut.');
    expect(started.threw, 'the launch ended at its start').toBeUndefined();
    expect(input.handled, 'the prompt was taken from the agent').toBe(false);
    expect(input.threw, 'the prompt was refused').toBeUndefined();
    expect(turn.threw, `the turn was refused: ${turn.threw}`).toBeUndefined();
    expect(
      (turn.systemPrompt ?? []).join('\n'),
      'the turn does not run as the launched agent',
    ).toContain(agent.body.trim().split('\n')[0] ?? agent.name);
    // The warning is the incomplete launch's own: a complete one is not given it.
    const control = await typed(
      fenced(completeAssignment(schema), 'Judge the cut.'),
    );
    const own = warningsOf(started, input, turn).filter(
      (w) =>
        saysIncomplete(w) &&
        !warningsOf(control.started, control.input, control.turn).includes(w),
    );
    expect(
      own,
      'no warning that the assignment is incomplete was shown',
    ).not.toEqual([]);
  });

  it('agents/2: a launch whose command-line prompt carries no assignment starts, warned the assignment is incomplete', async () => {
    const s = await session({
      agent: agent.name,
      cliPrompts: ['Judge the cut.'],
    });
    const started = await s.fire('session_start', {});
    expect(
      started.threw,
      `the launch ended at its start: ${started.threw}`,
    ).toBeUndefined();
    const turn = await s.fire('before_agent_start', {
      prompt: 'Judge the cut.',
      systemPrompt: ['the base prompt'],
    });
    expect(turn.threw, `the turn was refused: ${turn.threw}`).toBeUndefined();
    expect(
      warningsOf(started, turn).filter(saysIncomplete),
      'no warning that the assignment is incomplete was shown',
    ).not.toEqual([]);
  });
});
