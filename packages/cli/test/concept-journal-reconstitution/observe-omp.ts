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
  on(
    event: 'before_agent_start',
    handler: (event: { systemPrompt: string[] }, ctx: Context) => void,
  ): void;
  on(
    event: 'message_end',
    handler: (event: { message: Message }) => void,
  ): void;
}
export default function observe(pi: Extension) {
  // Loaded after install's cratylus extension. Observe its chained turn prompt;
  // unlike session_start's base prompt, this includes per-turn overrides.
  pi.on('before_agent_start', (event, ctx) => {
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
          systemPrompt: event.systemPrompt,
          tools,
          entries: ctx.sessionManager.getEntries(),
          context: ctx.sessionManager.buildSessionContext(),
        },
        null,
        2,
      ),
    );
    // A turn is prepared, but no provider request is made during inspection.
    if (process.env.CONCEPT_INSPECT_ONLY === '1') process.exit(0);
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
