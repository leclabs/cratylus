import type { GuardCell } from '../manifest.js';
import {
  ownedQuestion,
  ownedQuestionJudgment,
  readsOwnedQuestion,
  rulingToDelegate,
} from './owned-question.js';

// bottom-line — the guard that holds the architect's bottom-line-up-front ordering
// (0070, 0078), the value its behavioral examples showed drifting: a report to the
// operator that gives a topic other than one recommended action, or buries the
// outcome under the records' mechanics. A topic is a matter the operator asked about,
// or an outcome that calls for someone's action; support states facts and reasons,
// never instructions (0100), and a fact is stated as the records show it, an inference
// as inferred (the architect's honesty guardrail). A decision taken in the turn and
// reported with its reason, an approval included, is its topic's one action (0090,
// 0097), as is any act the turn takes and reports; only what the reply itself directs
// counts as an action, never a recorded decision's consequences (0102, 0103). A topic
// decided before the turn, or an outcome that calls for someone's action, keeps one
// action of its own, directed to whoever takes it: the architect owns delivery, the
// operator decides intent, priority and release (0086, 0097).
// Whether the architect holds what an owned question needs, so settles it or keeps it
// open with the one action that gets what is missing, it never judges: it reads the
// one `owned-question` judgment made for that stop (0101).
// The ordering's text alone was the remedy already tried; enforcement-level puts a
// value that drifts under a guard that checks the act.
//
// Ordering is the sequence a reply presents its content in (0078), so the guard judges
// the turn's last reply when the turn ends, never a tool call: an act counts as a
// topic's action through the reply that reports it (0103). It reads the conversation
// and the decisions recorded in the turn only to know what the turn did. It binds
// only the agents whose composition holds the guarded value
// (`guarded(bottomLineUpFront, bottomLine)` in the architect's role), so no other role
// is judged by it.

export const bottomLine: GuardCell = {
  id: 'bottom-line',
  residue:
    'turn-end judge ⟨conversation, decisions recorded this turn, message answered, last reply⟩ · operator reply ∧ (¬conclusion first ∨ ≠1 action per topic ∨ menu ∨ support ≠ facts ∧ reasons a layman needs ∨ claim > records) ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end'],
  tell: 'burying',
  judge: {
    prompt: `You judge one reply an agent gave at the end of its turn, for one drift tell: burying the bottom line.

The agent is a principal architect reporting to the operator, a layman who owns the product's intent and priorities and releases the result. A reply to the operator must be bottom line up front: the conclusion first, then one recommended action per topic, then only the support a layman needs to understand the state and the recommendation, in the product's terms; never a menu of options or a question the agent can answer itself.

A topic is a matter the operator asked about, or an outcome that calls for someone's action. Support states facts and reasons, never instructions: a topic's one action is its only instruction, so an instruction anywhere in the reply is one of its topic's actions. A fact is what the records and the delegates' reports show, stated no stronger than they show it, and what the agent infers is said as inferred. The facts and reasons a conclusion rests on concern the product and its work, never how the agent worked: what it read, recorded, attempted or was refused this session is mechanics, which a layman does not need.

This turn is everything since the operator's last message. A topic's actions are what the reply itself directs on it and the acts this turn took on it that the reply reports. A decision taken in this turn and reported with its reason, an approval included, is that topic's one action; so is any other act the agent took this turn and reports, such as a dispatch or a request to a delegate, and a separate follow-on action on that topic is a second action, even when it does not compete. A recorded decision's consequences are part of its record, not an action of the reply. A decision taken before this turn is no action of this turn: a topic decided before it, like a reported outcome that calls for action, keeps exactly one recommended action of its own, the next step on it. An outcome that calls for someone's action has, as its one action, that step, directed to whoever takes it or taken by the agent in the turn; the agent owns the delivery of what the design describes, and the operator decides only what is wanted, its priorities and release. Applying a priority the operator stated, the agent leads with one recommendation on what comes next and the facts and reasons for it.

A reply buries when it is addressed to the operator and does any of these:
- it does not lead with the conclusion: background, method or a narrative of what was done comes before the outcome, or the opening leaves out the outcome of a topic the reply reports, or states it stronger than the records and reports show;
- it gives a topic more than one action, or none, a decision taken before this turn never counting as an action of it;
- it offers a menu of options in place of its one recommendation, or asks a question the agent can answer itself;
- its support carries an instruction, a claim stronger than the records and reports show, or more than a layman needs: the mechanics of the session or the records, such as what the agent read, recorded, attempted or was refused, decision or entry identifiers, an entry's status or placeholder, how records are superseded or edited, ledger or journal status, tool or command names;
- it shortens itself by dropping an unresolved issue it covers, or by answering a different question in that issue's place and calling the topic settled. Each open question the report covers is the question as asked or recorded: settled as asked, with its reason, or kept visible as open with the one action that gets what is missing. For a question the agent owns, which of the two follows from the owned-question judgment, as below.

${ownedQuestion} ${readsOwnedQuestion}

A readback of the design given at a session's start (the current design, its open decisions, the cuts in flight) is required content, never excess support; in it each open decision is named as open. Never count its absence against a reply.

A reply does not bury when it is addressed to a delegate rather than the operator, or when it is already in shape. A short reply on one topic still gives that topic its one action; only its support may be brief.

You are given the conversation so far, as the operator and the agent exchanged it in visible text, delegates' reports included, and then the act: the decisions recorded this turn, each as its verb and its content, or none; the owned-question judgment; the message the reply answered, when there is one; and the reply. Judge the reply, reading the conversation and the decisions only for what this turn did. Answer with exactly one JSON object and nothing else:
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
    conversation: true,
    recorded: true,
    reads: ownedQuestionJudgment,
  },
  refusal: `burying: this reply buries its bottom line. Give your whole reply again in shape: bottom line first, naming every topic's outcome, then one recommended action per topic, then only the support a layman needs, in the product's terms; never a menu of options or a question you can answer yourself. A topic is a matter the operator asked about, or an outcome that calls for someone's action. Support states facts and reasons, never instructions: a topic's one action is its only instruction. State facts no stronger than the records and reports show them, say what you infer as inferred, and leave out how you worked this session. A decision you took this turn and report with its reason, an approval included, is that topic's one action, as is any other act you took this turn and report; a separate follow-on action on that topic is a second one, and a recorded decision's consequences belong to its record, not to your reply. A decision taken before this turn is no action of this turn: that topic, like a reported outcome that calls for action, keeps exactly one recommended action of its own, the next step on it, directed to whoever takes it. Answer each open question as asked, never a different one in its place. ${rulingToDelegate}`,
};
