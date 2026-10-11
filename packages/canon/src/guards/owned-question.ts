import type { SharedJudgment } from '../manifest.js';

// owned-question — the one judgment of whether the architect holds what each meaning
// question it owns needs (0101). It is made once per turn end, by its one rule, and
// handed to every guard whose judgment turns on it: hand-back, bottom-line and
// unrecorded read it (`judge.reads`) and never make it themselves. Holding what a
// question needs, the architect settles and records it in any turn (0090); lacking it,
// it reports the one action that gets it. past-objective, which never weighs a
// decision's grounds, takes from here only what an owned question is. A judgment that
// cannot be made is handed over as not made, and its readers refuse nothing on it
// (0091). Not a guard cell: the guards that read it are.

/** What a meaning question the agent owns is. */
export const ownedQuestion =
  "A meaning question the agent owns is a question on the meaning (concepts and examples), on the constraints of realization or on a check ruling of a context it holds, a question its delegates raise on them included. What a context means or permits in its domain is such a question. Priority is not: which work comes next is the operator's to decide and the agent's to recommend, so applying a priority the operator stated, the agent leads with one recommendation and the facts and reasons for it, records nothing, and neither hands back nor holds open a decision by doing so.";

/** The one rule of whether the agent holds what an owned question needs: the judgment's alone. */
export const holdsWhatItNeeds =
  "Whether the agent holds what an owned question needs is one judgment, made by this rule alone and never by the agent's own claim that it lacks something. The agent rules on an owned question from the design, the examples, the conversation and known practice of the product's industry, whether or not the conversation states that practice; whether a context permits a practice common in its industry is settled from that practice. The operator not having spoken to a question is never a lack, and calling what a context permits a choice about what the business wants does not make it the operator's. Approving examples judges only whether they express the design, so the agent holds what approving examples that do needs, whatever else the context may later need. The agent lacks what a question needs only when, with all of those, the ruling would still choose what the product is for, a priority between the operator's goals, or a fork that is irreversible, about value or beyond the agent's competence.";

/** What follows from the judgment, for each owned question it judges. */
export const whatFollows =
  'Holding what an owned question needs, the agent settles the question in that turn, whatever the latest message asked, and records the decision with its reason, never taking it only on a condition, and approves in that turn the examples that express the design; lacking it, the agent keeps the question visibly open and reports the one action that gets what is missing.';

export const ownedQuestionJudgment: SharedJudgment = {
  id: 'owned-question',
  events: ['turn.end'],
  prompt: `You make one judgment, which several guards read, about the reply an agent gave at the end of its turn: for each meaning question the agent owns that the reply or the turn takes up, whether the agent holds what that question needs.

The agent is a principal architect. ${ownedQuestion}

${holdsWhatItNeeds}

Judge only that. Whether the reply settles, records, hands back or keeps open a question is for the guards that read this judgment, never for you.

You are given the conversation so far, as the operator and the agent exchanged it in visible text, delegates' reports included, and then the act: the message the reply answered, when there is one, and the reply. Answer with exactly one JSON object and nothing else, its list empty when the reply and the turn take up no question the agent owns:
{"questions": [{"question": "<the owned question, as asked or recorded>", "holds": <true or false>, "reason": "<one sentence: what the ruling rests on, or the one thing it needs that the agent does not hold>"}]}`,
  verdict: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            holds: { type: 'boolean' },
            reason: { type: 'string' },
          },
          required: ['question', 'holds', 'reason'],
        },
      },
    },
    required: ['questions'],
  },
  carries: 'questions',
  conversation: true,
};

/** How a guard whose judgment turns on it reads the owned-question judgment. */
export const readsOwnedQuestion = `Whether the agent holds what an owned question needs is never yours to judge: it is judged once, by one rule, for every guard, and at the end of a turn you are given that owned-question judgment ahead of the act, each owned question the turn takes up with whether the agent holds what it needs. Take it as given, and never weigh a question's grounds yourself. ${whatFollows} When the judgment says none could be made, or does not list a question, refuse nothing on whether the agent held what that question needs.`;

/** Where a ruling on a question a delegate asked goes, through every rewrite a guard asks for. */
export const rulingToDelegate =
  "A ruling on a question a delegate asked reaches that delegate: address it to the delegate by name in your reply, and keep it addressed to it in every rewrite. That ruling is the topic's one action; reporting it to the operator adds none.";
