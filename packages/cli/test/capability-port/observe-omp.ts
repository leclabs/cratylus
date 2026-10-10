// Loaded LAST by real omp, after the adapter's session-start handlers.
// tap-omp is loaded first and retains real omp registry entries.
// Omp 18.8.7 exposes metadata, not execute, through getAllTools(). Its concrete
// API stores RegisteredTool entries in extension.tools; RegisteredToolAdapter
// delegates to entry.definition.execute(id, args, signal, update, realContext).
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { entries } from './tap-omp.js';

type Args = Record<string, unknown>;
interface API {
  getAllTools(): { name: string; parameters: unknown }[];
  getActiveTools(): string[];
  setActiveTools(names: string[]): Promise<void>;
  on(
    event: 'session_start',
    handler: (event: unknown, ctx: unknown) => unknown,
  ): void;
  on(event: 'before_agent_start', handler: () => void): void;
  on(
    event: 'message_end',
    handler: (event: { message: { role: string; content: unknown } }) => void,
  ): void;
}
export default function observe(pi: API) {
  pi.on('session_start', async (_event, ctx) => {
    try {
      const names: string[] = JSON.parse(process.env.CAPABILITY_TOOLS!);
      await pi.setActiveTools(names);
      const tools = pi
        .getAllTools()
        .filter((t) => pi.getActiveTools().includes(t.name))
        .map((t) => {
          const schema = t.parameters as {
            toJsonSchema?: (options: unknown) => unknown;
          };
          const definition = entries.get(t.name)?.definition;
          return {
            ...t,
            label: definition?.label,
            parameters:
              typeof schema?.toJsonSchema === 'function'
                ? schema.toJsonSchema({
                    fallback: (c: { base: unknown }) => c.base,
                  })
                : schema,
          };
        });
      const requests: Args[] = process.env.CAPABILITY_CALLS
        ? JSON.parse(readFileSync(process.env.CAPABILITY_CALLS, 'utf8'))
        : [];
      const results: unknown[] = [];
      for (const args of requests) {
        const entry = entries.get(names[0] ?? '');
        if (!entry) break;
        const approval =
          typeof entry.definition.approval === 'function'
            ? entry.definition.approval(args)
            : entry.definition.approval;
        try {
          const result = await entry.definition.execute(
            `cut6-${results.length}`,
            args,
            new AbortController().signal,
            undefined,
            ctx,
          );
          results.push({ args, approval, result });
        } catch (error) {
          results.push({
            args,
            approval,
            result: {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: error instanceof Error ? error.message : String(error),
                },
              ],
            },
          });
        }
      }
      writeFileSync(
        process.env.CAPABILITY_WIRING!,
        JSON.stringify(
          {
            active: pi.getActiveTools(),
            tools,
            registered: [...entries].map(([name, entry]) => ({
              name,
              path: entry.sourceInfo.path,
            })),
            results,
          },
          null,
          2,
        ),
      );
      if (process.env.CAPABILITY_INSPECT === '1') process.exit(0);
    } catch (error) {
      writeFileSync(
        process.env.CAPABILITY_WIRING!,
        JSON.stringify({ observerError: String(error) }),
      );
      process.exit(2);
    }
  });
  pi.on('before_agent_start', () => {
    if (process.env.CAPABILITY_INSPECT === '1')
      throw new Error('No-model inspection attempted a model turn');
  });
  pi.on('message_end', ({ message }) => {
    if (
      process.env.CAPABILITY_TRANSCRIPT &&
      ['assistant', 'toolResult'].includes(message.role)
    )
      appendFileSync(
        process.env.CAPABILITY_TRANSCRIPT,
        `${JSON.stringify(message)}\n`,
      );
  });
}
