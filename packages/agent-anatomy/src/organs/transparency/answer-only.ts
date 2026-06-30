import type { Transparency } from '@leclabs/agent-forge/anatomy';

export const answerOnly: Transparency = {
  organ: 'transparency',
  slug: 'answer-only',
  definiens: `Emit the conclusion/output alone; suppress all reasoning, intermediate steps, and rationale — opaque box, no justification offered.`,
};
