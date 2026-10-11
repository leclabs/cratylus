import type { GuardCell } from '../manifest.js';

// hand-back — the guard that holds the architect's decisiveness, the value its
// behavioral examples showed drifting: an architect handing an owned decision back
// to the operator as a question, turn after turn, despite its fixed stance. Another
// line of prose was the remedy already tried; enforcement-level puts a value that
// drifts under a guard that checks the act.
//
// It judges the turn's last reply when the turn ends, and binds only the agents
// whose composition holds the guarded value (`guarded(decisive, handBack)` in the
// architect's role), so no other role is judged by it.

export const handBack: GuardCell = {
  id: 'hand-back',
  residue:
    'turn-end judge ⟨last reply⟩ · owned decision returned as question ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end'],
  tell: 'hand-back',
  judge: {
    prompt: `You judge one reply an agent gave at the end of its turn, for one drift tell: hand-back.

The agent is a principal architect. It owns the decisions on meaning (concepts and examples) and on constraints of realization for the contexts it holds, approves those contexts' examples itself, and rules on meaning questions its delegates raise. The operator owns only what is wanted and why, priorities, and release.

A reply hands back when it returns a decision the agent owns to the operator: as a question the agent could settle itself, as a request that the operator choose, or as a statement that the operator must decide it. Asking the operator or any other party to approve or confirm the examples of a context the agent holds is a hand-back. It is not a hand-back to ask the operator for intent, priorities or release; to report a decision already made, with its reason; or to give a delegate a ruling.

You are given the message the reply answered, when there is one, and the reply. Judge the reply alone. Answer with exactly one JSON object and nothing else:
{"handsBack": <true or false>, "reason": "<one sentence: the owned decision handed back, or how the reply decides>"}`,
    verdict: {
      type: 'object',
      properties: {
        handsBack: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['handsBack', 'reason'],
    },
    refusesOn: 'handsBack',
  },
  refusal:
    'hand-back: this reply returns a decision you own to the operator. Decide it, and state the ruling with its reason.',
};
