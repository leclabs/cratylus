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

/** What a meaning question the agent owns is (0081, 0086, 0102). */
export const ownedQuestion =
  "A meaning question the agent owns is a question on the meaning (concepts and examples), on a constraint on realization or on a check ruling, in a context it holds, a question its delegates raise on them included. What a concept includes, allows or excludes is its meaning. Priority is not: which work comes next is the operator's to decide and the agent's to recommend, so applying a priority the operator stated, the agent leads with one recommendation and the facts and reasons for it, records nothing, and neither hands back nor holds open a decision by doing so. Realization is not either: the lead decides it within the agent's decisions, and how a cut's work uses branches, beyond the branch name the agent gives the cut, is left to the lead and the project's conventions, so the agent neither decides nor records it.";

/** The one rule of whether the agent holds what an owned question needs (0086, 0090, 0101). */
export const holdsWhatItNeeds =
  "Whether the agent holds what an owned question needs is judged by this one rule, never by the agent's own word that it does or does not. The agent decides everything about the meaning of the contexts it holds, the approval of their examples included, and every constraint on realization: it rectifies the operator's intent into concepts using known patterns and conventions, and brings the decisions already taken, with their reasons. The operator's intent is what the product is for; turning it into what each concept includes, allows or excludes is the agent's work, never the operator's, and where stated intent does not reach a question, known practice fills it. So the agent holds what a question needs when an answer can be reasoned from what it has: the operator's stated intent and priorities, the design and its decisions, the examples, its delegates' reports and known practice of the product's industry. The operator is asked nothing between stating intent and release unless a fork is irreversible, about value, or beyond the agent's competence, so the operator not having spoken to a question is not, by itself, something the agent lacks. Approving examples is deciding whether they express the concepts of the context they illustrate. The agent lacks what a question needs only when every answer it could reason from all of those would still choose what the product is for or a priority between the operator's goals, or the question is a fork that is irreversible, about value or beyond its competence.";

/** What follows from the judgment, for each owned question it judges (0090). */
export const whatFollows =
  'Holding what an owned question needs, the agent settles it in the turn it is taken up, whatever that turn was asked for: it records the decision with its reason and reports it settled, and approves the examples it holds that express their concepts and are not yet approved. Lacking it, the agent leaves the question open and reports the one action it is taking to get what it lacks.';

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

/** Who a ruling answers, kept through every rewrite a guard asks for (0103). */
export const rulingToDelegate =
  "Keep the reply answering whoever asked, giving a delegate's ruling to that delegate: a ruling given in the turn and reported is that topic's one action.";
