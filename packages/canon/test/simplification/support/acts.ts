// A battery of acts a delivered agent takes, run through the delivered harness with a
// judge that finds against the agent and with one that finds for it, before the agent
// has said anything and after it has: whatever a guard, a readback gate or any other
// check of the agent's behaviour would make of the act, the act is offered to it.

import {
  SETTLED_CUT,
  type StandIn,
  completeAssignment,
  fenced,
  standIn,
} from './omp-stand-in.js';
import type { Declaration, Projection } from './projection.js';

/** One act: a tool call as the harness receives it. */
export interface Act {
  readonly toolName: string;
  readonly input: Record<string, unknown>;
}

/** Reading, writing, editing and running the work itself, and dispatching a delegate. */
export function actsOf(p: Projection): Act[] {
  const delegate =
    p.agents.find((d) => d.name === 'illustrator') ??
    p.agents.find((d) => d.front.assignment !== undefined) ??
    p.agents[0];
  return [
    { toolName: 'read', input: { path: 'src/index.ts' } },
    { toolName: 'grep', input: { pattern: 'export', path: 'src' } },
    {
      toolName: 'write',
      input: { path: 'src/added.ts', content: 'export {};\n' },
    },
    {
      toolName: 'edit',
      input: {
        path: 'src/index.ts',
        edits: [{ old_text: 'a', new_text: 'b' }],
      },
    },
    { toolName: 'bash', input: { command: 'pnpm test' } },
    {
      toolName: 'task',
      input: {
        tasks: [
          {
            agent: delegate?.name ?? 'task',
            name: 'One',
            task: fenced(
              completeAssignment(delegate?.front.assignment),
              'Do the work.',
            ),
          },
        ],
      },
    },
  ];
}

/** A reply that drifts every way a stance can: a menu, a hand-back, a question it
 *  could answer, a descent into the work. */
export const DRIFTING_REPLY =
  'Here are three options, which would you prefer? Should I open the source and fix the test myself? Let me know what you think.';

const said = (text: string) => ({
  message: { role: 'assistant', content: [{ type: 'text', text }] },
});

/** Every act of the battery the harness refused or failed, for `agent` launched (a main
 *  session) or dispatched (a sub session), judged each way, before and after it spoke. */
export async function refusedActs(
  p: Projection,
  agent: Declaration,
  cwd: string,
  opened: StandIn[],
  kinds: readonly ('main' | 'sub')[] = ['main', 'sub'],
): Promise<{ refused: string[]; judged: number; sent: string[] }> {
  const refused: string[] = [];
  const sent: string[] = [];
  let judged = 0;
  for (const kind of kinds) {
    for (const verdict of [true, false]) {
      for (const spoken of [false, true]) {
        const s = await standIn(p, {
          ...(kind === 'main' ? { agent: agent.name } : {}),
          answers: SETTLED_CUT,
          verdict,
          cwd,
        });
        opened.push(s);
        const at = kind === 'main' ? { kind } : { kind, name: agent.name };
        const where = `${agent.name} (${kind}, judge ${verdict}, ${spoken ? 'after' : 'before'} speaking)`;
        await s.fire('session_start', {}, at);
        await s.fire(
          'before_agent_start',
          { prompt: 'Begin.', systemPrompt: ['base'] },
          at,
        );
        if (spoken) {
          await s.fire('assistant_message', said(DRIFTING_REPLY), at);
          await s.fire('message_end', said(DRIFTING_REPLY), at);
        }
        for (const act of actsOf(p)) {
          const o = await s.fire(
            'tool_call',
            {
              toolName: act.toolName,
              toolCallId: `${act.toolName}-1`,
              input: structuredClone(act.input),
            },
            at,
          );
          if (o.blocked !== undefined || o.threw !== undefined)
            refused.push(`${where} ${act.toolName}: ${o.blocked ?? o.threw}`);
        }
        // The turn ends on the reply: nothing holds it, nor answers it back.
        for (const event of ['turn_end', 'agent_end', 'stop', 'session_stop']) {
          const o = await s.fire(
            event,
            {
              ...said(DRIFTING_REPLY),
              messages: [said(DRIFTING_REPLY).message],
            },
            at,
          );
          if (o.blocked !== undefined || o.threw !== undefined || o.handled)
            refused.push(
              `${where} ${event}: ${o.blocked ?? o.threw ?? 'handled'}`,
            );
          for (const x of o.shown)
            if (/message|sendUser|sendMessage|followUp|steer/i.test(x.kind))
              sent.push(`${where} ${event}: ${x.kind} ${x.text.slice(0, 200)}`);
        }
        judged += s.judged();
        s.close();
      }
    }
  }
  return { refused, judged, sent };
}
