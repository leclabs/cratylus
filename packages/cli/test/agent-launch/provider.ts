import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect } from 'vitest';
import type { Fixture, Frame, LaunchOptions, Observation } from './fixture.js';

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

export function requestText(request: Request) {
  return JSON.stringify(request.messages);
}

export interface ExerciseResult {
  observation: Observation;
  observations: Observation[];
  requests: Request[];
  afterCompaction: Request[];
  reached: boolean;
  results: Frame[];
  frames: Frame[];
}

// A real turn, optionally inside native task dispatch, with one attempted
// descendant. The provider never decides permission: reaching that descendant
// and omp's tool result are the observations.
export async function exercise(
  f: Fixture,
  options: LaunchOptions & {
    dispatched?: string;
    subjectBody?: string;
    target?: string;
    targetBody?: string;
    compact?: boolean;
  } = {},
): Promise<ExerciseResult> {
  let parentIssued = false;
  let subjectIssued = false;
  const server = await provider((request) => {
    // Routing-hint compression and advisor calls are not the acting session.
    if (!request.tools?.length || request.model === 'adviser')
      return { text: 'Observation complete.' };
    const text = requestText(request);
    const child = request.tools?.some((tool) => tool.function.name === 'yield');
    const subject = options.dispatched
      ? text.includes(options.subjectBody!)
      : !child;
    const task = (name: string): Reply => ({
      tool: 'task',
      args: {
        context: 'Exercise dispatch through omp.',
        tasks: [
          {
            agent: name,
            task: 'Record the session.',
            solutionSpace: 'Do not edit files.',
          },
        ],
      },
    });
    if (options.dispatched && !child && !parentIssued) {
      parentIssued = true;
      return task(options.dispatched);
    }
    if (subject && options.target && !subjectIssued) {
      subjectIssued = true;
      return task(options.target);
    }
    // A harmless native read completes one assistant turn before yield: omp
    // injects startup prewalk steering at that boundary, not into empty history.
    if (
      subject &&
      !subjectIssued &&
      request.tools.some((tool) => tool.function.name === 'read')
    ) {
      subjectIssued = true;
      return { tool: 'read', args: { path: '.' } };
    }
    return child
      ? { tool: 'yield', args: { data: 'Observation complete.' } }
      : { text: 'Observation complete. The estuary survey is recorded.' };
  });
  f.models(server.baseUrl);
  const session = f.launch({ ...options, inspect: false });
  try {
    async function turn(message: string) {
      const previous = new Set(session.frames);
      await session.command({ type: 'prompt', message });
      await session.waitFor(
        (frame) => !previous.has(frame) && frame.type === 'agent_end',
      );
    }
    await turn('Record the session without changing files.');
    let afterCompaction: Request[] = [];
    if (options.compact) {
      await session.command({
        type: 'compact',
        customInstructions: 'Summarize the survey briefly.',
      });
      const before = server.requests.length;
      await turn('Continue the survey.');
      afterCompaction = server.requests.slice(before);
    }
    const observations = f.observed();
    const subjectObservations = observations.filter(
      (item) =>
        item.phase === 'context' &&
        (options.dispatched
          ? item.kind === 'sub' &&
            item.prompt.join('\n').includes(options.subjectBody!)
          : item.kind === 'main'),
    );
    const subject = subjectObservations[0];
    expect(subject, JSON.stringify(session.frames)).toBeDefined();
    expect(server.errors).toEqual([]);
    const requests = server.requests.filter(
      (request) =>
        request.tools?.length &&
        request.model !== 'adviser' &&
        (options.dispatched
          ? requestText(request).includes(options.subjectBody!)
          : !request.tools.some((tool) => tool.function.name === 'yield')),
    );
    const reached =
      options.targetBody !== undefined &&
      observations.some(
        (item) =>
          item.kind === 'sub' &&
          item.prompt.join('\n').includes(options.targetBody!),
      );
    const results = session.frames.filter(
      (frame) => frame.type === 'tool_execution_end',
    );
    return {
      observation: {
        ...subject!,
        prewalkArmed: subjectObservations.some((item) => item.prewalkArmed),
      },
      observations,
      requests,
      afterCompaction,
      reached,
      results,
      frames: session.frames,
    };
  } finally {
    session.stop();
    await session.done;
    server.close();
  }
}
