import type { SelfEvaluation } from '@leclabs/koine/anatomy';

export const llmAsJudge: SelfEvaluation = {
  organ: 'self-evaluation',
  slug: 'llm-as-judge',
  definiens: `a separate LLM call scores/grades the output against a rubric (correctness, quality, constraints), returning verdict + rationale; gate on the judge's score.`,
};
