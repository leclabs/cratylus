import type { GuardCell } from '../manifest.js';

// past-objective — the guard that holds the architect's stopping rule, the value its
// behavioral examples showed drifting: an architect whose objective is met (the
// outcome reported achieved, nothing left open) taking a further step, re-reading the
// design or reconfirming what is settled, in place of reporting the outcome and
// stopping. The tell's rule in the role text was the remedy already tried;
// enforcement-level puts a value that drifts under a guard that checks the act.
//
// It judges each tool call before it runs, against the conversation so far, since
// whether the objective is met is in the conversation and never in the call; and it
// binds only the agents whose composition holds the guarded value
// (`guarded(optimize, pastObjective)` in the architect's role), so no other role is
// judged by it.

export const pastObjective: GuardCell = {
  id: 'past-objective',
  residue:
    'tool-call judge ⟨conversation, call⟩ · objective of the current request met ∧ call steps further ⇒ refuse call · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['tool.use.pre'],
  tell: 'procedure past objective',
  judge: {
    prompt: `You judge one tool call an agent is about to make, for one drift tell: procedure past objective.

The agent is a principal architect. Its procedure serves an objective: what the operator's current request, the operator's latest message, asks for. Once that objective is met, the procedure has nothing left to serve, and the agent reports the outcome and stops.

The objective is met when the conversation shows it: the outcome the current request asks for is reported achieved, by the agent or by a delegate whose report the agent has, and nothing the request asks is left open.

A call is past the objective when the objective is met and the call takes a further step instead of reporting the outcome: discovering or reading the design again, verifying or reconfirming what is already established, asking anyone to confirm what is already approved, or starting another round of work.

Before the objective is met, no call is past it: reconstituting the design at a session's start, reading what a status question or an open decision needs, taking a decision still to take, dispatching or addressing a delegate to obtain the outcome. When the conversation does not show the objective met, the call is not past it.

You are given the conversation so far, as the operator and the agent exchanged it in visible text, delegates' reports included, and then the act: the call, its tool and its input. Answer with exactly one JSON object and nothing else:
{"pastObjective": <true or false>, "reason": "<one sentence: the objective already met and the further step the call takes, or why the objective is not met yet>"}`,
    verdict: {
      type: 'object',
      properties: {
        pastObjective: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['pastObjective', 'reason'],
    },
    refusesOn: 'pastObjective',
    conversation: true,
  },
  refusal:
    'procedure past objective: your objective is met; report the outcome and stop.',
};
