// Use real built-ins only; never register stand-in tools or replace the role.
import { appendFileSync, writeFileSync } from 'node:fs';
interface Context {
  sessionManager: { getEntries(): unknown[]; buildSessionContext(): unknown };
}
interface Message {
  role: string;
  content: unknown;
}
interface Extension {
  getAllTools(): {
    name: string;
    parameters: {
      toJsonSchema?: (options: {
        fallback: (ctx: { base: unknown }) => unknown;
      }) => unknown;
    };
  }[];
  getActiveTools(): string[];
  setActiveTools(names: string[]): Promise<void>;
  on(
    event: 'session_start',
    handler: (event: unknown, ctx: Context) => void,
  ): void;
  on(event: 'before_agent_start', handler: () => void): void;
  on(
    event: 'message_end',
    handler: (event: { message: Message }) => void,
  ): void;
}
export default function observe(pi: Extension) {
  pi.on('session_start', async (_event, ctx) => {
    // --tools restricts built-ins but does not suppress configured MCP tools.
    // This is the same explicit tool selection for inspection and live runs.
    await pi.setActiveTools(['bash', 'read', 'grep', 'glob', 'write', 'edit']);
    const tools = pi
      .getAllTools()
      .filter((tool) => pi.getActiveTools().includes(tool.name))
      .map((tool) => ({
        ...tool,
        parameters:
          typeof tool.parameters?.toJsonSchema === 'function'
            ? tool.parameters.toJsonSchema({ fallback: (ctx) => ctx.base })
            : tool.parameters,
      }));
    writeFileSync(
      process.env.CONCEPT_WIRING_FILE!,
      JSON.stringify(
        {
          active: pi.getActiveTools(),
          tools,
          entries: ctx.sessionManager.getEntries(),
          context: ctx.sessionManager.buildSessionContext(),
        },
        null,
        2,
      ),
    );
    // Inspection has no prompt and terminates before any agent/model turn.
    if (process.env.CONCEPT_INSPECT_ONLY === '1') process.exit(0);
  });
  pi.on('before_agent_start', () => {
    if (process.env.CONCEPT_INSPECT_ONLY === '1')
      throw new Error('Offline inspection cannot start a model');
  });
  pi.on('message_end', (event) => {
    const message = event.message;
    if (message.role !== 'assistant' && message.role !== 'toolResult') return;
    appendFileSync(
      process.env.CONCEPT_TRANSCRIPT_FILE!,
      `${JSON.stringify(message)}\n`,
    );
  });
}
