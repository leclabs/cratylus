import type { Actions } from '@leclabs/koine/anatomy';

export const toolCall: Actions = {
  organ: 'actions',
  slug: 'tool-call',
  definiens: `Structured invocation of an external API/function with arguments and typed return — the general mutating-or-querying capability call (REST, MCP tool, function), excluding the specialized effectors below.`,
};
