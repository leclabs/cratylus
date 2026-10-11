import { appendFileSync, writeFileSync } from 'node:fs';
import { snapshot } from './snapshot.js';

// Passive observer only: no tool, declaration, permission, or prompt replacement.
export default function observe(pi: {
  getActiveTools(): string[];
  getAllTools(): {
    name: string;
    parameters: {
      toJsonSchema?: (options: {
        fallback: (ctx: { base: unknown }) => unknown;
      }) => unknown;
    };
  }[];
  on(
    event: string,
    handler: (
      event: { systemPrompt: string[]; message: unknown },
      ctx: { model?: { provider: string; id: string; api: string } },
    ) => void,
  ): void;
}) {
  pi.on('before_agent_start', (event, ctx) => {
    const active = pi.getActiveTools();
    writeFileSync(
      process.env.EXECUTION_WIRING!,
      JSON.stringify({
        prompt: event.systemPrompt,
        model: ctx.model && {
          provider: ctx.model.provider,
          id: ctx.model.id,
          api: ctx.model.api,
        },
        active,
        tools: pi
          .getAllTools()
          .filter((tool) => active.includes(tool.name))
          .map((tool) => ({
            name: tool.name,
            parameters: tool.parameters?.toJsonSchema
              ? tool.parameters.toJsonSchema({ fallback: (ctx) => ctx.base })
              : tool.parameters,
          })),
      }),
    );
    if (process.env.EXECUTION_INSPECT === '1') process.exit(0);
  });
  pi.on('message_end', (event) => {
    appendFileSync(
      process.env.EXECUTION_MESSAGES!,
      `${JSON.stringify(event.message)}\n`,
    );
    appendFileSync(
      process.env.EXECUTION_SNAPSHOTS!,
      `${JSON.stringify(snapshot(process.env.EXECUTION_PROJECT!))}\n`,
    );
  });
}
