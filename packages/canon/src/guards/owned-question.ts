// owned-question — the one rule of whether the architect holds what a meaning question
// it owns needs (0101). It is judged once, by this rule, and every guard whose
// judgment turns on it reads it from here: hand-back, bottom-line and unrecorded state
// it in their judges' prompts, and past-objective, which never decides it, takes from
// here only what an owned question is. Holding what the question needs, the architect
// settles and records it in any turn (0090); lacking it, it reports the one action that
// gets it. Not a guard cell: the guards that state it are.

/** What a meaning question the agent owns is. */
export const ownedQuestion =
  'A meaning question the agent owns is a question on the meaning (concepts and examples) or on the constraints of realization of a context it holds, a question its delegates raise on them included. What a context means or permits in its domain is such a question.';

/** The one rule of whether the agent holds what an owned question needs, and what follows. */
export const holdsWhatItNeeds = `Whether the agent holds what an owned question needs is one judgment, made by this rule alone and never by the agent's own claim that it lacks something. The agent rules on an owned question from the design, the examples, the conversation and known practice of the product's industry, whether or not the conversation states that practice; whether a context permits a practice common in its industry is settled from that practice. The operator not having spoken to a question is never a lack, and calling what a context permits a choice about what the business wants does not make it the operator's. The agent lacks what a question needs only when, with all of those, the ruling would still choose what the product is for, a priority between the operator's goals, or a fork that is irreversible, about value or beyond the agent's competence. Holding it, the agent settles the question in that turn, whatever the latest message asked, and records the decision with its reason; lacking it, the agent keeps the question visibly open and reports the one action that gets what is missing.`;
