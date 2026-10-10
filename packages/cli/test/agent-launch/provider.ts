import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface Request {
  model: string;
  reasoning_effort?: string;
  messages: { role: string; content?: unknown }[];
  tools?: { function: { name: string } }[];
}
export type Reply =
  | { text: string }
  | { tool: string; args: Record<string, unknown> };
// Scripted transport only: omp still discovers declarations, dispatches tasks,
// builds prompts and selects models/effort. No live model or credentials.
export async function provider(reply: (request: Request) => Reply) {
  const requests: Request[] = [];
  const errors: unknown[] = [];
  const server = createServer(async (request, response) => {
    try {
      let raw = '';
      for await (const chunk of request) raw += chunk;
      const body: Request = JSON.parse(raw);
      requests.push(body);
      const result = reply(body);
      response.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
      });
      const emit = (delta: unknown, finish: string | null = null) =>
        response.write(
          `data: ${JSON.stringify({ id: `fixture-${requests.length}`, object: 'chat.completion.chunk', created: 0, model: body.model, choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`,
        );
      emit({ role: 'assistant' });
      if ('text' in result) {
        emit({ content: result.text });
        emit({}, 'stop');
      } else {
        emit({
          tool_calls: [
            {
              index: 0,
              id: `call_${requests.length}`,
              type: 'function',
              function: {
                name: result.tool,
                arguments: JSON.stringify(result.args),
              },
            },
          ],
        });
        emit({}, 'tool_calls');
      }
      response.end('data: [DONE]\n\n');
    } catch (error) {
      errors.push(error);
      response.writeHead(500);
      response.end(String(error));
    }
  });
  const listening = Promise.withResolvers<void>();
  server.once('error', listening.reject);
  server.listen(0, '127.0.0.1', () => listening.resolve());
  await listening.promise;
  return {
    requests,
    errors,
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`,
    close: () => {
      server.closeAllConnections();
      server.close();
    },
  };
}
