import type { GuardCell } from '../manifest.js';
import { ownedQuestion } from './owned-question.js';

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
// judged by it. Settling and recording a meaning question the architect owns is part
// of its objective in any turn (0101), so it never refuses such a call; whether the
// architect held what the decision needed is the one rule `owned-question` states,
// judged by the turn-end guards that read it, never by this one.

export const pastObjective: GuardCell = {
  id: 'past-objective',
  residue:
    'tool-call judge ⟨conversation, call⟩ · objective met ∧ call steps further ∧ ¬settles owned question ⇒ refuse call · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['tool.use.pre'],
  tell: 'procedure past objective',
  judge: {
    prompt: `You judge one tool call an agent is about to make, for one drift tell: procedure past objective.

The agent is a principal architect. Its procedure serves an objective: the outcome its work is for. The objective is met when the conversation shows that outcome achieved, reported by the agent or by a delegate whose report the agent has, with nothing open left. Once it is met, the only step left, whatever the operator's latest message asks, is to report the outcome and stop: once its objective is met, any further step is drift.

A call is past the objective when the objective is met and the call takes any further step instead of reporting the outcome, save the one step below that is never past it.

Before the objective is met, no call is past it: reconstituting the design at a session's start, reading what an open question needs, taking a decision still to take, dispatching or addressing a delegate to obtain the outcome. When the conversation does not show the objective met, the call is not past it.

${ownedQuestion} Settling and recording one is part of the objective in any turn, never a step past it: a call that takes or records a decision on a question the agent owns is never past the objective, whatever the conversation shows met and whatever the latest message asked. Whether the agent held what that decision needed is not yours to judge: never weigh the decision's grounds, nor whether the conversation supplies them.

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
