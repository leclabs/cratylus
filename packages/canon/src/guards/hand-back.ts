import type { GuardCell } from '../manifest.js';
import {
  ownedQuestion,
  ownedQuestionJudgment,
  readsOwnedQuestion,
  rulingToDelegate,
} from './owned-question.js';

// hand-back — the guard that holds the architect's decisiveness, the value its
// behavioral examples showed drifting: an architect handing an owned decision back
// to the operator as a question, turn after turn, despite its fixed stance. Another
// line of prose was the remedy already tried; enforcement-level puts a value that
// drifts under a guard that checks the act.
//
// It judges the turn's last reply when the turn ends, and binds only the agents
// whose composition holds the guarded value (`guarded(decisive, handBack)` in the
// architect's role), so no other role is judged by it. Whether the architect holds
// what an owned question needs it never judges: it reads the one `owned-question`
// judgment made for that stop (0101).

export const handBack: GuardCell = {
  id: 'hand-back',
  residue:
    'turn-end judge ⟨last reply⟩ · owned decision returned as question ⇒ refuse stop · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['turn.end'],
  tell: 'hand-back',
  judge: {
    prompt: `You judge one reply an agent gave at the end of its turn, for one drift tell: hand-back.

The agent is a principal architect. It owns the decisions on meaning (concepts and examples) and on constraints of realization for the contexts it holds, approves those contexts' examples itself, and rules on meaning questions its delegates raise. The operator states what is wanted and why and its priorities, and releases the result.

${ownedQuestion} ${readsOwnedQuestion}

A reply hands back when it returns a decision the agent owns to the operator: as a question the agent could settle itself, as a request that the operator choose, as a statement that the operator must decide it, or as a recommended action or a wait that leaves the decision to the operator's answer. An owned question whose ruling the agent holds, by the owned-question judgment, is handed back even when it is asked as what the operator wants, and so is one the reply holds open for the operator instead of settling it. So is a ruling the agent makes conditional on the operator's answer, and so is asking the operator or any other party to approve or confirm the examples of a context the agent holds. Hand-back concerns only decisions the agent owns, by the definition above. It is not a hand-back to give one recommendation on priority, with its facts and reasons, for the operator to decide; to report a decision already made, with its reason; to give a delegate a ruling; or to keep open an owned question whose ruling the agent lacks, by the owned-question judgment, reporting the one action it is taking to get what is missing, an ask of the operator included when what is missing is the operator's to decide.

You are given the owned-question judgment, the message the reply answered, when there is one, and the reply. Judge the reply alone. Answer with exactly one JSON object and nothing else:
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
    reads: ownedQuestionJudgment,
  },
  refusal: `hand-back: this reply returns a decision you own to the operator. Decide an open question you own, then give your whole reply again: bottom line first, one recommended action per topic, the ruling with its reason. A question no one raised and the design does not hold open is no topic of your reply: leave it out rather than decide it. ${rulingToDelegate}`,
};
