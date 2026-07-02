import type { SelfEvaluation } from '@leclabs/agent-forge/anatomy';

export const llmAsJudge: SelfEvaluation = {
  organ: 'self-evaluation',
  slug: 'llm-as-judge',
  definiens: `a separate LLM call grades the output against a rubric (correctness · quality · constraints) → verdict + rationale; gate on the judge's score.`,
};
