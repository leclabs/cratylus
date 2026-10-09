import { once } from 'node:events';
import { type Server, createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createOmpAgentScenarioRunner } from '../../src/adapters/omp/index.js';

const SCENARIO = {
  situation: 'A peer needs the release date.',
  trigger: 'Ask the release coordinator for the date.',
  run: 0,
} as const;

const servers: Server[] = [];
afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

async function modelEndpoint(
  action: 'peer' | 'lookup' | 'none' = 'peer',
): Promise<string> {
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const requestBody = JSON.parse(body) as {
      messages: readonly { role?: string }[];
    };
    const wantsTool =
      action !== 'none' &&
      !requestBody.messages.some((message) => message.role === 'tool');
    response.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
    });
    const chunks = wantsTool
      ? [
          { delta: { role: 'assistant' }, finish_reason: null },
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: 'call_fixture_tool',
                  type: 'function',
                  function: {
                    name: action === 'peer' ? 'message_peer' : 'lookup_release',
                    arguments: JSON.stringify(
                      action === 'peer'
                        ? {
                            to: 'release-coordinator',
                            content: 'What is the release date?',
                          }
                        : { day: 'Friday' },
                    ),
                  },
                },
              ],
            },
            finish_reason: null,
          },
          { delta: {}, finish_reason: 'tool_calls' },
        ]
      : [
          { delta: { role: 'assistant' }, finish_reason: null },
          {
            delta: { content: 'I completed the scenario.' },
            finish_reason: null,
          },
          { delta: {}, finish_reason: 'stop' },
        ];
    for (const [index, item] of chunks.entries()) {
      response.write(
        `data: ${JSON.stringify({
          id: `fixture-${index}`,
          object: 'chat.completion.chunk',
          created: 0,
          model: 'fixture',
          choices: [{ index: 0, ...item }],
        })}\n\n`,
      );
    }
    response.end('data: [DONE]\n\n');
  });
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('fixture server failed to bind');
  return `http://127.0.0.1:${address.port}/v1`;
}

function runner(
  baseUrl: string,
  tools: readonly {
    name: string;
    description: string;
    response: string;
  }[] = [],
) {
  return createOmpAgentScenarioRunner({
    model: {
      provider: 'scenario-fixture',
      id: 'fixture',
      baseUrl,
      apiKey: 'local-fixture',
    },
    systemPrompt: 'Use the available tools when the scenario requires them.',
    peers: [
      { name: 'release-coordinator', response: 'The release is Friday.' },
    ],
    tools,
  });
}

describe('OMP scenario runner', () => {
  it('snapshots model and peer configuration when the runner is created', async () => {
    const baseUrl = await modelEndpoint();
    const config = {
      model: {
        provider: 'scenario-fixture',
        id: 'fixture',
        baseUrl,
        apiKey: 'local-fixture',
      },
      systemPrompt: 'Use the available tools when the scenario requires them.',
      peers: [
        { name: 'release-coordinator', response: 'The release is Friday.' },
      ],
      tools: [],
    };
    const run = createOmpAgentScenarioRunner(config);

    config.model.baseUrl = 'http://127.0.0.1:1/v1';
    const [peer] = config.peers;
    if (!peer) throw new Error('test peer missing');
    peer.name = 'mutated-peer';

    await expect(run(SCENARIO)).resolves.toEqual({
      messages: [
        { to: 'release-coordinator', content: 'What is the release date?' },
      ],
      toolCalls: [
        {
          name: 'message_peer',
          arguments: {
            to: 'release-coordinator',
            content: 'What is the release date?',
          },
        },
      ],
    });
  }, 35_000);
  it('runs OMP and records the calls actually made to the configured stand-in peer', async () => {
    const run = runner(await modelEndpoint());
    const record = await run(SCENARIO);

    expect(record).toEqual({
      messages: [
        { to: 'release-coordinator', content: 'What is the release date?' },
      ],
      toolCalls: [
        {
          name: 'message_peer',
          arguments: {
            to: 'release-coordinator',
            content: 'What is the release date?',
          },
        },
      ],
    });
  }, 35_000);

  it('repeats the same configured OMP scenario deterministically', async () => {
    const run = runner(await modelEndpoint());
    const first = await run(SCENARIO);
    const second = await run(SCENARIO);

    expect(second).toEqual(first);
  }, 70_000);
  it('records calls made to caller-configured stand-in tools', async () => {
    const run = runner(await modelEndpoint('lookup'), [
      {
        name: 'lookup_release',
        description: 'Look up the release date',
        response: 'Friday',
      },
    ]);

    await expect(run(SCENARIO)).resolves.toEqual({
      messages: [],
      toolCalls: [{ name: 'lookup_release', arguments: { day: 'Friday' } }],
    });
  }, 35_000);

  it('returns an empty record when the configured model makes no tool call', async () => {
    const run = runner(await modelEndpoint('none'));

    await expect(run(SCENARIO)).resolves.toEqual({
      messages: [],
      toolCalls: [],
    });
  }, 35_000);
});
