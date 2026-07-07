import type { Actions } from '@leclabs/agent-forge/anatomy';

export const toolCall: Actions = `tool-call ≜ structured invocation of an external API/function with arguments + typed return — the general mutating-or-querying call (REST · MCP tool · function); excludes the specialized sibling effectors.`;
