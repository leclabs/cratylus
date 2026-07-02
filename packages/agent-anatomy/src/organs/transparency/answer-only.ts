import type { Transparency } from '@leclabs/agent-forge/anatomy';

export const answerOnly: Transparency = {
  organ: 'transparency',
  slug: 'answer-only',
  definiens: `emit the conclusion alone; suppress reasoning, intermediate steps, rationale — opaque box, no justification offered.`,
};
