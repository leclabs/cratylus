import type { Trigger } from '@leclabs/agent-forge/anatomy';

export const userMessage: Trigger = {
  organ: 'trigger',
  slug: 'user-message',
  definiens: `a human's natural-language directive · query · reply opens the turn; the primary intent-bearing input channel.`,
};
