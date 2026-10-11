import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runSession } from '../rubric-judge.js';
import {
  type Recording,
  type Scenario,
  type Verdict,
  aggregate,
  decodeMessages,
  failures,
} from './check.js';
import {
  type Host,
  type Wiring,
  argv,
  host,
  openDecision,
  run,
  seedWindow,
  success,
} from './fixture.js';
import { assessIsolation } from './isolation.js';

interface ModelWiring extends Wiring {
  systemPrompt: string[];
  memory: { backend: string; active: boolean };
  credentialResolved: boolean;
}
interface PreparedLaunch {
  executable: string;
  args: string[];
  env: NodeJS.ProcessEnv & {
    CAPABILITY_WIRING: string;
    CAPABILITY_TRANSCRIPT: string;
    CAPABILITY_PROMPTS: string;
  };
}

export function modelLaunch(
  h: Host,
  tools: string[],
  output: string,
): PreparedLaunch {
  // Context-file discovery is separate from --no-rules in omp. Do not expose
  // the operator's home: copy ONLY the credential store to another empty home.
  // The installed adapter remains in h.home and is passed explicitly.
  h.offered(h.inspect());
  const home = join(h.root, 'model-home');
  const agent = join(home, '.omp/agent');
  mkdirSync(agent, { recursive: true });
  for (const suffix of ['', '-wal', '-shm']) {
    const source = join(homedir(), '.omp/agent', `agent.db${suffix}`);
    if (existsSync(source)) cpSync(source, join(agent, `agent.db${suffix}`));
  }
  mkdirSync(output, { recursive: true });
  const config = join(h.root, 'model-config.json');
  writeFileSync(config, JSON.stringify({ memory: { backend: 'off' } }));
  const path = [
    ...new Set([
      join(h.prefix, 'node_modules/.bin'),
      dirname(process.execPath),
      '/usr/bin',
      '/bin',
    ]),
  ];
  expect(
    path.filter((directory) => existsSync(join(directory, 'cratylus'))),
  ).toEqual([join(h.prefix, 'node_modules/.bin')]);
  const executable = success(run('which', ['omp'], h.cwd)).trim();
  const auth = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => /^OMP_AUTH_/.test(key)),
  );
  return {
    executable,
    args: [...h.launchArgs(), '--config', config],
    env: {
      ...h.env,
      ...auth,
      HOME: home,
      PATH: path.join(':'),
      CAPABILITY_INSPECT: '0',
      CAPABILITY_ISOLATION: '1',
      CAPABILITY_CHECK_CREDENTIALS: '1',
      CAPABILITY_TOOLS: JSON.stringify(tools),
      CAPABILITY_WIRING: join(output, 'wiring.json'),
      CAPABILITY_TRANSCRIPT: join(output, 'messages.jsonl'),
      CAPABILITY_PROMPTS: join(output, 'prompts.jsonl'),
    },
  };
}

export function inspectModelLaunch(h: Host, tools: string[], output: string) {
  const launch = modelLaunch(h, tools, output);
  const result = run(launch.executable, launch.args, h.cwd, {
    ...launch.env,
    CAPABILITY_INSPECT: '1',
  });
  success(result);
  const wiring: ModelWiring = JSON.parse(
    readFileSync(launch.env.CAPABILITY_WIRING, 'utf8'),
  );
  expect(
    wiring.credentialResolved,
    'omp resolves credentials without a model turn',
  ).toBe(true);
  expect(failures(assessIsolation(wiring, tools))).toEqual([]);
  return wiring;
}

export function seed(h: Host, scenario: Scenario) {
  if (scenario.seed === 'window') seedWindow(h);
  else {
    h.seed();
    if (scenario.seed === 'decision') h.concepts(...argv(openDecision));
  }
  // Fixture contains only Git and the real seeded journal, no guidance files.
  expect(existsSync(join(h.cwd, 'AGENTS.md'))).toBe(false);
  expect(existsSync(join(h.cwd, 'CANON.md'))).toBe(false);
}
export function launch(
  h: Host,
  prompt: string,
  tools: string[],
  output: string,
): Recording {
  if (
    process.env.CAPABILITY_PORT_LIVE !== '1' &&
    process.env.CAPABILITY_PORT_RUBRIC !== '1'
  )
    throw new Error('A live launch needs an explicit opt-in');
  const prepared = modelLaunch(h, tools, output);
  const transcript = prepared.env.CAPABILITY_TRANSCRIPT;
  writeFileSync(transcript, '');
  writeFileSync(prepared.env.CAPABILITY_PROMPTS, '');
  const result = run(
    prepared.executable,
    [...prepared.args, prompt],
    h.cwd,
    prepared.env,
    300_000,
  );
  writeFileSync(join(output, 'stdout'), result.stdout);
  writeFileSync(join(output, 'stderr'), result.stderr);
  success(result);
  return collect(prepared, tools, output);
}

/** Parallel rubric runs need cancellation; the existing sync launch stays unchanged. */
export async function launchAsync(
  h: Host,
  prompt: string,
  tools: string[],
  output: string,
  signal?: AbortSignal,
): Promise<Recording> {
  if (process.env.EXECUTION_LIVE !== '1')
    throw new Error('A live rubric launch needs EXECUTION_LIVE=1');
  signal?.throwIfAborted();
  const prepared = modelLaunch(h, tools, output);
  writeFileSync(prepared.env.CAPABILITY_TRANSCRIPT, '');
  writeFileSync(prepared.env.CAPABILITY_PROMPTS, '');
  const result = await runSession(
    prepared.executable,
    [...prepared.args, prompt],
    {
      cwd: h.cwd,
      env: prepared.env,
      timeout: 300_000,
      signal,
    },
  );
  writeFileSync(join(output, 'stdout'), result.stdout);
  writeFileSync(join(output, 'stderr'), result.stderr);
  if (result.error) throw result.error;
  success({
    code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  return collect(prepared, tools, output);
}

function collect(
  prepared: PreparedLaunch,
  tools: string[],
  output: string,
): Recording {
  const wiring: ModelWiring = JSON.parse(
    readFileSync(prepared.env.CAPABILITY_WIRING, 'utf8'),
  );
  expect(wiring.credentialResolved).toBe(true);
  expect(failures(assessIsolation(wiring, tools))).toEqual([]);
  const prompts: ModelWiring[] = readFileSync(
    prepared.env.CAPABILITY_PROMPTS,
    'utf8',
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  expect(
    prompts.length,
    'every model run records its rendered system prompt',
  ).toBeGreaterThan(0);
  for (const turn of prompts)
    expect(failures(assessIsolation(turn, tools))).toEqual([]);
  const messages: unknown[] = readFileSync(
    prepared.env.CAPABILITY_TRANSCRIPT,
    'utf8',
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const recording = { name: output, events: decodeMessages(messages) };
  expect(recording.events.length).toBeGreaterThan(0);
  for (const event of recording.events)
    if (event.kind === 'tool') expect(tools).toContain(event.name);
  writeFileSync(
    join(output, 'recording.json'),
    JSON.stringify(recording, null, 2),
  );
  return recording;
}
export function behavioral(scenario: Scenario) {
  describe(`${scenario.name}: installed interface behavior`, () => {
    it('preflight: real omp offers every observed tool with its parameter schema, before any model', () => {
      const h = host();
      try {
        seed(h, scenario);
        h.offered(h.inspect([], scenario.tools), scenario.tools);
      } finally {
        h.dispose();
      }
    });
    it.runIf(process.env.CAPABILITY_PORT_LIVE === '1')(
      'live: five plain sessions satisfy four-of-five and every never assertion',
      () => {
        const output = join(
          process.env.CAPABILITY_PORT_RECORDINGS ??
            mkdtempSync(join(tmpdir(), 'capability-runs-')),
          scenario.name,
        );
        mkdirSync(output, { recursive: true });
        const verdicts: Verdict[] = [];
        const errors: string[] = [];
        // A single failing no-model preflight prevents ALL model launches.
        const preflight = host();
        try {
          seed(preflight, scenario);
          preflight.offered(
            preflight.inspect([], scenario.tools),
            scenario.tools,
          );
        } finally {
          preflight.dispose();
        }
        for (let index = 1; index <= 5; index++) {
          const h = host();
          try {
            seed(h, scenario);
            verdicts.push(
              scenario.assess(
                launch(
                  h,
                  scenario.prompt,
                  scenario.tools,
                  join(output, `run-${index}`),
                ),
              ),
            );
            writeFileSync(
              join(output, `run-${index}`, 'final-state.json'),
              JSON.stringify(h.concepts('state'), null, 2),
            );
          } catch (error) {
            errors.push(`run ${index}: ${String(error)}`);
          } finally {
            h.dispose();
          }
        }
        const assessment = verdicts.length === 5 ? aggregate(verdicts) : {};
        writeFileSync(
          join(output, 'assessment.json'),
          JSON.stringify({ verdicts, errors, assessment }, null, 2),
        );
        expect(errors, `Recordings: ${output}`).toEqual([]);
        expect(failures(assessment), `Recordings: ${output}`).toEqual([]);
      },
      1_900_000,
    );
  });
}
