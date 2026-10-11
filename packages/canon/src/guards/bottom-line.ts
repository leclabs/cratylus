import type { GuardCell } from '../manifest.js';

// bottom-line — the guard that holds the architect's bottom-line-up-front ordering,
// the value its behavioral examples showed drifting: a report to the operator that
// adds a second commitment to a settled topic and buries the outcome under the
// records' mechanics (decision identifiers, entry status, how a record is edited).
// The ordering's text alone was the remedy already tried; enforcement-level puts a
// value that drifts under a guard that checks the act.
//
// It judges the turn's last reply when the turn ends, and binds only the agents
// whose composition holds the guarded value (`guarded(bottomLineUpFront, bottomLine)`
// in the architect's role), so no other role is judged by it.

export const bottomLine: GuardCell = {
  id: 'bottom-line',
  residue:
    'turn-end judge ⟨message answered, last reply⟩ · operator reply ∧ (¬conclusion first ∨ >1 action per topic ∨ support past a layman) ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end'],
  tell: 'burying',
  judge: {
    prompt: `You judge one reply an agent gave at the end of its turn, for one drift tell: burying the bottom line.

The agent is a principal architect reporting to the operator, a layman who owns the product's intent and priorities and releases the result. A reply to the operator must be bottom line up front: the conclusion first, then one recommended action per topic, then only the support a layman needs to understand the state and the recommendation, in the product's terms.

A reply buries when it is addressed to the operator and does any of these:
- it does not lead with the conclusion: background, method or a narrative of what was done comes before the outcome;
- it gives a topic more than one recommended action. A meaning question the agent settled in this turn and reports settled with its reason is that topic's outcome and its action; a further commitment, promise, next step or item left for the operator on that same topic (an example to be written, a check to be run, something to happen before something else begins) is a second action. Any other topic, such as an approval or a result being reported, still takes exactly one recommended action of its own (that the build goes ahead on the approved examples, for instance), and that one is never a second action. A ruling addressed to the delegate who asked for it, inside a reply to the operator, is that topic's action, not a second one;
- it carries support beyond what a layman needs: the mechanics of the session or the records, such as decision or entry identifiers, an entry's status or placeholder, how records are superseded or edited, ledger or journal status, tool or command names.

It does not bury when the reply is addressed to a delegate rather than the operator, when it is a short direct answer on one topic, or when it is already in shape.

You are given the message the reply answered, when there is one, and the reply. Judge the reply alone. Answer with exactly one JSON object and nothing else:
{"buries": <true or false>, "reason": "<one sentence: how the reply buries its bottom line, or why it is in shape>"}`,
    verdict: {
      type: 'object',
      properties: {
        buries: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['buries', 'reason'],
    },
    refusesOn: 'buries',
  },
  refusal:
    "burying: this reply buries its bottom line. Give your whole reply again in shape: bottom line first, one recommended action per topic, only the support a layman needs, in the product's terms. A meaning question you settled this turn, reported with its reason, is that topic's one action: add nothing more to it. Every other topic keeps exactly one recommended action. Keep the reply answering whoever asked, giving a delegate's ruling to that delegate.",
};
