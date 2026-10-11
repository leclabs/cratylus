import type { GuardCell } from '../manifest.js';
import {
  holdsWhatItNeeds,
  ownedQuestion,
  rulingToDelegate,
} from './owned-question.js';

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
// One action per topic holds over what the architect does, not only over what it
// reports: an act taken in a turn has happened by the time the turn ends, and no
// reshaped reply withdraws it. So the guard judges each tool call before it runs, as
// well as the turn's last reply when the turn ends, each with the conversation so far
// and the decisions recorded in that turn, which are acts the turn took on their
// topics whether or not the reply leads with them. It binds only the agents whose
// composition holds the guarded value (`guarded(bottomLineUpFront, bottomLine)` in the
// architect's role), so no other role is judged by it.

export const bottomLine: GuardCell = {
  id: 'bottom-line',
  residue:
    'tool-call ∧ turn-end judge ⟨conversation, decisions recorded this turn, call ∨ message answered ∧ last reply⟩ · call ∧ (second action on a topic this turn) ⇒ refuse call · operator reply ∧ (¬conclusion first ∨ ≠1 action per topic ∨ support ≠ facts ∧ reasons for the conclusion ∨ delegate ruling ¬addressed to its delegate) ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end', 'tool.use.pre'],
  tell: 'burying',
  judge: {
    prompt: `You judge one act of an agent, for one drift tell: burying the bottom line. The act is either a tool call the agent is about to make, or the reply it gave at the end of its turn.

The agent is a principal architect reporting to the operator, a layman who owns the product's intent and priorities and releases the result. A reply to the operator must be bottom line up front: the conclusion first, then one recommended action per topic, then only the support a layman needs to understand the state and the recommendation, in the product's terms.

A topic is a matter the operator asked about, or an outcome that calls for someone's action. Support states only the facts and reasons the reply's conclusions rest on, never instructions: a topic's one action is its only instruction.

One action per topic holds over what the agent does as over what it reports. This turn is everything since the operator's last message. A topic's actions are every act this turn takes or recommends on its matter, by the agent or by anyone it names, taken or still to take: a decision, ruling or approval; a dispatch, assignment or request to a delegate; a step put to the operator. A topic's matter is the question or artifact an act settles or changes: acts that settle or change the same question or artifact are on one topic, however the reply divides, heads or names it, and two of them are two actions even when they agree or one follows from the other. An act counts however it is phrased: conditional or contingent, for later or as a next step, as someone else's step, as an offer or invitation to the operator, or told inside the support. Recording a decision is taking it: a decision recorded this turn is that decision's act on its topic, the same act the reply reports, never a second. Its consequences are part of the record, not an action: only what the reply itself directs, and the acts the turn takes, count as a topic's actions. A decision taken in this turn and reported with its reason, an approval included, is that topic's one action; a separate follow-on action on that topic is a second action. A topic decided before this turn, or a reported outcome that calls for action, keeps exactly one recommended action of its own. A ruling on a question a delegate asked, given to that delegate, is that topic's one action, whether the reply addresses it to the delegate or a call carries it there; the decision it delivers, recorded this turn, is the same action, and reporting the ruling to the operator adds none. A reply that recommends one of several candidates gives that candidate the topic's one action; a candidate it set aside gets no action of its own, a conditional, later or fallback one included, and appears at most as the reason it was set aside.

A tool call buries when it takes a second action on a topic this turn has already acted on, by a decision recorded this turn or by a dispatch or request the conversation shows made in it. A call that only reads, that takes a topic's first action, or that records the decision the turn takes on a topic, whatever its consequences state, never buries.

A reply buries when it is addressed to the operator and does any of these:
- it does not lead with the conclusion: background, method or a narrative of what was done comes before the outcome, or the opening leaves out the outcome of a topic the reply reports;
- it gives a topic more than one action, or none, counting every act of this turn on the topic, each decision recorded this turn included as that decision, never its consequences, whether the reply leads with it or tells it as support;
- its support carries anything other than the facts and reasons its conclusions rest on: an instruction, request, offer, option or further recommendation; a fact or reason none of its conclusions rests on; or the mechanics of the session or the records: how the records were read, written, kept or replaced, that the agent recorded a decision or did not record one again, decision or entry identifiers, an entry's status or placeholder, ledger or journal status, tool or command names. That a decision was recorded is never support;
- it answers a question a delegate asked without addressing the ruling to that delegate, by name, in the reply or by a call this turn that carries it there;
- it shortens itself by dropping an unresolved issue it covers, or by answering a different question in that issue's place and calling the topic settled. Each open question the report covers is the question as asked or recorded: settled as asked, with its reason, or kept visible as open with the one action that gets what is missing. For a question the agent owns, which of the two is decided by the rule below.

${ownedQuestion} ${holdsWhatItNeeds}

A readback of the design given at a session's start (the current design, its open decisions, the cuts in flight) is required content, never excess support; in it each open decision is named as open. Never count its absence against a reply.

A reply does not bury when it is addressed to a delegate rather than the operator, or when it is already in shape. A short direct answer on one topic needs no support, but still gives its topic exactly one action.

You are given the conversation so far, as the operator and the agent exchanged it in visible text, delegates' reports included, and then the act: the decisions recorded this turn, each as its verb and its content, or none; then either the call, its tool and its input, or the reply, with the message it answered when there is one. Judge the act, reading the conversation and the decisions only for what this turn has done. Answer with exactly one JSON object and nothing else:
{"buries": <true or false>, "reason": "<one sentence: how the act buries its bottom line, or why it is in shape>"}`,
    verdict: {
      type: 'object',
      properties: {
        buries: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['buries', 'reason'],
    },
    refusesOn: 'buries',
    conversation: true,
    recorded: true,
  },
  refusal: `burying: this buries your bottom line. One topic gets one action, in what you do as in what you report: every act you take or recommend on a topic's matter this turn, a decision, a dispatch or a request alike, is one of its actions; a decision you record is that decision, and its consequences are the record's, not an action. A decision you took this turn and report with its reason, an approval included, is that topic's one action; a separate follow-on action on that topic is a second one. A topic decided before this turn, or a reported outcome that calls for action, keeps exactly one recommended action of its own. However you phrase or divide it, conditional, for later, as an offer or inside the support, an act on a topic's matter is one of its actions. Recommending one of several candidates, give a candidate you set aside no action of its own. ${rulingToDelegate} Refused before a call: take no second action on a topic this turn has acted on. Refused at a reply: give your whole reply again in shape, bottom line first, naming every topic's outcome, then one action per topic, then only the support a layman needs, in the product's terms. A topic is a matter the operator asked about, or an outcome that calls for someone's action. Support states only the facts and reasons your conclusions rest on, never an instruction, request, offer or option, and never how you read, wrote, kept or replaced the records: a topic's one action is its only instruction. Answer each open question as asked, never a different one in its place.`,
};
