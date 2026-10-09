import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface OmpScenario {
  readonly situation: string;
  readonly trigger: string;
  readonly run: number;
}

export interface OmpBehaviorRecord {
  readonly messages: readonly {
    readonly to: string;
    readonly content: string;
  }[];
  readonly toolCalls: readonly {
    readonly name: string;
    readonly arguments: Readonly<Record<string, unknown>>;
  }[];
}

export interface OmpScenarioHarnessConfig {
  readonly model: {
    readonly provider: string;
    readonly id: string;
    readonly baseUrl: string;
    readonly apiKey: string;
  };
  readonly systemPrompt: string;
  readonly peers: readonly {
    readonly name: string;
    readonly response: string;
  }[];
  readonly tools: readonly {
    readonly name: string;
    readonly description: string;
    readonly response: string;
  }[];
}

export type OmpScenarioRunner = (
  scenario: OmpScenario,
) => Promise<OmpBehaviorRecord>;

/** Bind an OMP agent, model endpoint, stand-in peers and tools to the runtime runner seam. */
export function createOmpAgentScenarioRunner(
  config: OmpScenarioHarnessConfig,
): OmpScenarioRunner {
  return (scenario) => runConfiguredScenario(scenario, config);
}

async function runConfiguredScenario(
  scenario: OmpScenario,
  config: OmpScenarioHarnessConfig,
): Promise<OmpBehaviorRecord> {
  const directory = await mkdtemp(join(tmpdir(), 'cratylus-omp-scenario-'));
  const recordPath = join(directory, 'behavior.jsonl');
  const extensionPath = join(directory, 'harness.mjs');
  const availableTools = [
    ...(config.peers.length > 0 ? ['message_peer'] : []),
    ...config.tools.map(({ name }) => name),
  ];

  try {
    await writeFile(extensionPath, createExtension(config, recordPath));
    const prompt = [
      `Situation: ${scenario.situation}`,
      `Trigger: ${scenario.trigger}`,
      `Run: ${scenario.run + 1}`,
    ].join('\n');
    const { stdout, stderr, code } = await runOmp(
      [
        '--print',
        '--no-session',
        '--no-skills',
        '--no-rules',
        '--no-extensions',
        '--extension',
        extensionPath,
        '--model',
        `${config.model.provider}/${config.model.id}`,
        ...(availableTools.length === 0
          ? ['--no-tools']
          : ['--tools', availableTools.join(',')]),
        '--system-prompt',
        config.systemPrompt,
        prompt,
      ],
      { ...process.env, PI_CODING_AGENT_DIR: directory },
    );
    if (code !== 0)
      throw new Error(
        `OMP scenario failed (exit ${code}): ${stderr || stdout}`,
      );

    const lines = await readFile(recordPath, 'utf8').catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return '';
        throw error;
      },
    );
    type BehaviorEntry =
      | {
          readonly type: 'message';
          readonly to: string;
          readonly content: string;
        }
      | {
          readonly type: 'toolCall';
          readonly name: string;
          readonly arguments: Readonly<Record<string, unknown>>;
        };
    const entries = lines
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as BehaviorEntry);
    return {
      messages: entries
        .filter(
          (entry): entry is Extract<BehaviorEntry, { type: 'message' }> =>
            entry.type === 'message',
        )
        .map(({ to, content }) => ({ to, content })),
      toolCalls: entries
        .filter(
          (entry): entry is Extract<BehaviorEntry, { type: 'toolCall' }> =>
            entry.type === 'toolCall',
        )
        .map(({ name, arguments: args }) => ({ name, arguments: args })),
    };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function createExtension(
  config: OmpScenarioHarnessConfig,
  recordPath: string,
): string {
  const serializedConfig = JSON.stringify({ ...config, recordPath });
  return `
import { appendFileSync } from 'node:fs';
export default function (pi) {
  const config = ${serializedConfig};
  const log = (entry) => appendFileSync(config.recordPath, JSON.stringify(entry) + '\\n');
  const z = pi.zod;
  pi.registerProvider(config.model.provider, {
    baseUrl: config.model.baseUrl,
    api: 'openai-completions',
    apiKey: config.model.apiKey,
    models: [{
      id: config.model.id,
      name: config.model.id,
      api: 'openai-completions',
      reasoning: false,
      input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 32000,
      maxTokens: 2048,
    }],
  });
  if (config.peers.length > 0) {
    pi.registerTool({
      name: 'message_peer',
      label: 'Message peer',
      description: 'Send a message to a stand-in peer',
      parameters: z.object({ to: z.enum(config.peers.map((peer) => peer.name)), content: z.string() }),
      async execute(_id, args) {
        log({ type: 'toolCall', name: 'message_peer', arguments: args });
        log({ type: 'message', to: args.to, content: args.content });
        const peer = config.peers.find((item) => item.name === args.to);
        return { content: [{ type: 'text', text: peer.response }] };
      },
    });
  }
  for (const tool of config.tools) {
    pi.registerTool({
      name: tool.name,
      label: tool.name,
      description: tool.description,
      parameters: z.record(z.unknown()),
      async execute(_id, args) {
        log({ type: 'toolCall', name: tool.name, arguments: args });
        return { content: [{ type: 'text', text: tool.response }] };
      },
    });
  }
}
`;
}

function runOmp(
  args: readonly string[],
  env: NodeJS.ProcessEnv,
): Promise<{
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number;
}> {
  const { promise, resolve, reject } = Promise.withResolvers<{
    readonly stdout: string;
    readonly stderr: string;
    readonly code: number;
  }>();
  const child = spawn('omp', args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    stderr += chunk;
  });
  const timeout = setTimeout(() => {
    child.kill('SIGTERM');
    reject(new Error(`OMP scenario exceeded 30 seconds: ${stderr || stdout}`));
  }, 30_000);
  child.once('error', reject);
  child.once('close', (code) => {
    clearTimeout(timeout);
    resolve({ stdout, stderr, code: code ?? 1 });
  });
  return promise;
}
