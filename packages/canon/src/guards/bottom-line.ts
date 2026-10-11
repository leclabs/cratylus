import type { GuardCell } from '../manifest.js';
import { holdsWhatItNeeds, ownedQuestion } from './owned-question.js';

// bottom-line — the guard that holds the architect's bottom-line-up-front ordering
// (0070, 0078), the value its behavioral examples showed drifting: a report to the
// operator that gives a topic other than one recommended action, or buries the
// outcome under the records' mechanics. A topic is a matter the operator asked about,
// or an outcome that calls for someone's action; support states facts and reasons,
// never instructions (0100). A decision taken in the turn and reported with its
// reason, an approval included, is its topic's one action (0090, 0097).
// Whether the architect holds what an owned question needs, so settles it or keeps it
// open with the one action that gets what is missing, is the one rule `owned-question`
// states (0101).
// The ordering's text alone was the remedy already tried; enforcement-level puts a
// value that drifts under a guard that checks the act.
//
// It judges the turn's last reply when the turn ends, with the decisions recorded in
// that turn, which are acts the turn took on their topics whether or not the reply
// leads with them; it binds only the agents whose composition holds the guarded value
// (`guarded(bottomLineUpFront, bottomLine)` in the architect's role), so no other role
// is judged by it.

export const bottomLine: GuardCell = {
  id: 'bottom-line',
  residue:
    'turn-end judge ⟨decisions recorded this turn, message answered, last reply⟩ · operator reply ∧ (¬conclusion first ∨ ≠1 action per topic ∨ support ≠ facts ∧ reasons for the conclusion) ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end'],
  tell: 'burying',
  judge: {
    prompt: `You judge one reply an agent gave at the end of its turn, for one drift tell: burying the bottom line.

The agent is a principal architect reporting to the operator, a layman who owns the product's intent and priorities and releases the result. A reply to the operator must be bottom line up front: the conclusion first, then one recommended action per topic, then only the support a layman needs to understand the state and the recommendation, in the product's terms.

A topic is a matter the operator asked about, or an outcome that calls for someone's action. Support states only the facts and reasons the reply's conclusions rest on, never instructions: a topic's one action is its only instruction.

A reply buries when it is addressed to the operator and does any of these:
- it does not lead with the conclusion: background, method or a narrative of what was done comes before the outcome, or the opening leaves out the outcome of a topic the reply reports;
- it gives a topic more than one action, or none. A topic's actions are every act the reply reports or recommends on its matter, by the agent or by anyone it names, taken or still to take: a decision, ruling or approval; a dispatch, assignment or request to a delegate; a step put to the operator. Every act on a topic's matter belongs to that topic, however the reply divides or names it, and two acts on one topic are two actions even when they agree or one follows from the other. Each decision recorded this turn is an act on its topic, whether the reply leads with it or tells it as support. A decision taken in this turn and reported with its reason, an approval included, is that topic's one action; a separate follow-on action on that topic is a second action. A topic decided before this turn, or a reported outcome that calls for action, keeps exactly one recommended action of its own. A ruling addressed to the delegate who asked for it, inside a reply to the operator, is that topic's action, not a second one;
- its support carries anything other than the facts and reasons its conclusions rest on: an instruction, request, offer, option or further recommendation; a fact or reason none of its conclusions rests on; or the mechanics of the session or the records, such as decision or entry identifiers, an entry's status or placeholder, how records are superseded or edited, ledger or journal status, tool or command names;
- it shortens itself by dropping an unresolved issue it covers, or by answering a different question in that issue's place and calling the topic settled. Each open question the report covers is the question as asked or recorded: settled as asked, with its reason, or kept visible as open with the one action that gets what is missing. For a question the agent owns, which of the two is decided by the rule below.

${ownedQuestion} ${holdsWhatItNeeds}

A readback of the design given at a session's start (the current design, its open decisions, the cuts in flight) is required content, never excess support; in it each open decision is named as open. Never count its absence against a reply.

It does not bury when the reply is addressed to a delegate rather than the operator, when it is a short direct answer on one topic, or when it is already in shape.

You are given the decisions recorded this turn, each as its verb and its content, or none; the message the reply answered, when there is one; and the reply. Judge the reply, reading the decisions only as acts the turn took. Answer with exactly one JSON object and nothing else:
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
    recorded: true,
  },
  refusal:
    "burying: this reply buries its bottom line. Give your whole reply again in shape: bottom line first, naming every topic's outcome, then one action per topic, then only the support a layman needs, in the product's terms. A topic is a matter the operator asked about, or an outcome that calls for someone's action. Every act you take or recommend on a topic's matter, a decision, a dispatch or a request alike, is one of that topic's actions, and a topic gets one, in what you do as in what you report. A decision you took this turn and report with its reason, an approval included, is that topic's one action; a separate follow-on action on that topic is a second one. A topic decided before this turn, or a reported outcome that calls for action, keeps exactly one recommended action of its own. Support states only the facts and reasons your conclusions rest on, never an instruction, request, offer or option: a topic's one action is its only instruction. Answer each open question as asked, never a different one in its place. Keep the reply answering whoever asked, giving a delegate's ruling to that delegate.",
};
