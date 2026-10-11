import type { GuardCell } from '../manifest.js';

// unrecorded — the guard that holds the architect's deliverable, decisions with their
// reasons, the value its behavioral examples showed drifting: a reply that reports an
// owned meaning question settled while no decision carrying it was recorded, so the
// design still shows the question open. A decision is taken when it is recorded
// (0090); the text alone was the remedy already tried, so the value is held by a
// guard that checks the act.
//
// It judges the turn's last reply when the turn ends, with the decisions recorded in
// that turn, and binds only the agents whose composition holds the guarded value
// (`guarded(decisionsWithReasons, unrecorded)` in the architect's role), so no other
// role is judged by it.

export const unrecorded: GuardCell = {
  id: 'unrecorded',
  residue:
    'turn-end judge ⟨decisions recorded this turn, message answered, last reply⟩ · owned question reported settled this turn ∧ ¬recorded this turn ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end'],
  tell: 'holding open',
  judge: {
    prompt: `You judge one reply an agent gave at the end of its turn, for one drift tell: holding open a decision it could take.

The agent is a principal architect. It owns the meaning questions of the contexts it holds and settles one once it holds what it needs. A decision is taken only when it is recorded; until then the question stays open in the design, whatever a reply says.

A reply holds a decision open when it reports an owned meaning question decided or settled in this turn, and no decision recorded this turn carries it.

It never does when the decision it reports was recorded in an earlier turn, when it reports an approval of examples, or when it keeps the question open.

You are given the decisions recorded this turn, each as its verb and its content, or none; the message the reply answered, when there is one; and the reply. Answer with exactly one JSON object and nothing else:
{"unrecorded": <true or false>, "reason": "<one sentence: the question reported settled that no recorded decision carries, or why the reply holds nothing open>"}`,
    verdict: {
      type: 'object',
      properties: {
        unrecorded: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['unrecorded', 'reason'],
    },
    refusesOn: 'unrecorded',
    recorded: true,
  },
  refusal:
    'holding open: a decision is taken when it is recorded. Record it, then report it.',
};
