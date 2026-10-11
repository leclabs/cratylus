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
    'turn-end judge ⟨message answered, last reply⟩ · operator reply ∧ (¬conclusion first ∨ ≠1 action per topic ∨ support past a layman) ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end'],
  tell: 'burying',
  judge: {
    prompt: `You judge one reply an agent gave at the end of its turn, for one drift tell: burying the bottom line.

The agent is a principal architect reporting to the operator, a layman who owns the product's intent and priorities and releases the result. A reply to the operator must be bottom line up front: the conclusion first, then one recommended action per topic, then only the support a layman needs to understand the state and the recommendation, in the product's terms.

A reply buries when it is addressed to the operator and does any of these:
- it does not lead with the conclusion: background, method or a narrative of what was done comes before the outcome, or the opening leaves out the outcome of a topic the reply reports;
- it gives a topic more than one recommended action, or none. A decision the agent took in this turn, a meaning question settled or examples approved now, reported with its reason, is that topic's outcome and its action; a further commitment, promise, next step or item left for the operator or a delegate on that same topic (an example to be written, a check to be run, the build to go ahead, something to happen before something else begins) is a second action. Any other topic, such as a result being reported or an approval given before this turn, takes exactly one recommended action of its own (that the build goes ahead on examples approved earlier, for instance): leaving it with none is as much burying as giving it two. A ruling addressed to the delegate who asked for it, inside a reply to the operator, is that topic's action, not a second one;
- it carries support beyond what a layman needs: the mechanics of the session or the records, such as decision or entry identifiers, an entry's status or placeholder, how records are superseded or edited, ledger or journal status, tool or command names;
- it shortens itself by dropping an unresolved issue it covers, or by answering a different question in that issue's place and calling the topic settled. Each open question the report covers is the question as asked or recorded: settled as asked, with its reason, or, only when settling it needs something the agent does not hold, kept visible as open with the one action that obtains it.

A readback of the design given at a session's start (the current design, its open decisions, the cuts in flight) is required content, never excess support; in it each open decision is named as open. Never count its absence against a reply.

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
    "burying: this reply buries its bottom line. Give your whole reply again in shape: bottom line first, naming every topic's outcome, then one recommended action per topic, then only the support a layman needs, in the product's terms. A decision you took this turn, a meaning question settled or examples approved now, reported with its reason, is that topic's one action: add nothing more to it, not even a next step. Every other topic, an approval given before this turn included, keeps exactly one recommended action of its own. Answer each open question as asked, never a different one in its place. Keep the reply answering whoever asked, giving a delegate's ruling to that delegate.",
};
