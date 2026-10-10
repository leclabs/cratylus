import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect } from 'vitest';
import type { Fixture, LaunchOptions } from './fixture.js';

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
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
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

// Native task dispatch remains the oracle: this helper only scripts transport
// and returns the passive observer's child turn.
export async function dispatch(
  f: Fixture,
  name: string,
  options: LaunchOptions = {},
) {
  const server = await provider((request) => {
    if (request.tools?.some((tool) => tool.function.name === 'yield'))
      return {
        tool: 'yield',
        args: { data: { summary: 'Recorded.', files: [], architecture: '' } },
      };
    if (request.messages.some((message) => message.role === 'tool'))
      return { text: 'Dispatch complete.' };
    return {
      tool: 'task',
      args: {
        context: 'Record the declaration.',
        tasks: [
          {
            agent: name,
            task: 'Return the observation.',
            solutionSpace: 'Do not edit files.',
          },
        ],
      },
    };
  });
  f.models(server.baseUrl);
  const session = f.launch({ ...options, inspect: false, tools: ['task'] });
  try {
    await session.command({ type: 'prompt', message: 'Dispatch the task.' });
    await session.waitFor((frame) => frame.type === 'agent_end');
    const child = f
      .observed()
      .find((item) => item.kind === 'sub' && item.phase === 'turn');
    expect(child, JSON.stringify(session.frames)).toBeDefined();
    expect(server.errors).toEqual([]);
    return { child: child!, requests: server.requests };
  } finally {
    session.stop();
    await session.done;
    server.close();
  }
}
