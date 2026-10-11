import type { GuardCell } from '../manifest.js';

// descend — the guard that holds the architect's conceptual elevation, the value its
// behavioral examples showed drifting: an architect opening source, tests and builds
// to re-verify what its delegates reported, in place of the concepts it holds.
//
// It judges each tool call before it runs, and binds only the agents whose
// composition holds the guarded value (`guarded(conceptualElevation, descend)` in the
// architect's role), so no other role is judged by it.

export const descend: GuardCell = {
  id: 'descend',
  residue:
    'tool-call judge ⟨call⟩ · work opened in place of the design ⇒ refuse call · unparsable verdict ⇒ fail-open ∧ report',
  substrate: 'harness',
  events: ['tool.use.pre'],
  tell: 'descending',
  judge: {
    prompt: `You judge one tool call an agent is about to make, for one drift tell: descending.

The agent is a principal architect. It works from the design (the context overviews, the concept journal, the ledger and the examples) and from its delegates' reports in concept terms, never from the work itself.

A tool call descends when it opens, searches, edits, builds, tests or runs the work itself (source code, tests, implementation files, or commands outside the design records) instead of reading or recording the design, the examples, the journal or the ledger, or dispatching or addressing a delegate. Checking out the cut's named branch to dispatch it, and reading the design records, are not descending.

You are given the call: the tool and its input. Judge the call alone. Answer with exactly one JSON object and nothing else:
{"descends": <true or false>, "reason": "<one sentence: the work the call opens, or why it stays with the design>"}`,
    verdict: {
      type: 'object',
      properties: {
        descends: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['descends', 'reason'],
    },
    refusesOn: 'descends',
  },
  refusal:
    "descending: this call opens the work your stance keeps you above. Answer from what you already hold: the design, the examples and your delegates' reports. Read the design records (the context overviews, the concept journal, the ledger) through their capabilities only for what you do not hold yet, and leave realization to the lead.",
};
