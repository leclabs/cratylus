import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
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
  argv,
  host,
  openDecision,
  run,
  seedWindow,
  success,
} from './fixture.js';

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
  if (tools.includes('concept_journal')) h.offered(h.inspect([], tools), tools);
  mkdirSync(output, { recursive: true });
  const transcript = join(output, 'messages.jsonl');
  writeFileSync(transcript, '');
  // A provider key in the environment or the host's credential broker supplies
  // auth without borrowing its extensions, rules, skills, settings or role.
  const auth = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => /^OMP_AUTH_/.test(key)),
  );
  const result = run(
    'omp',
    [...h.launchArgs(), prompt],
    h.cwd,
    {
      ...h.env,
      ...auth,
      CAPABILITY_INSPECT: '0',
      CAPABILITY_TOOLS: JSON.stringify(tools),
      CAPABILITY_WIRING: join(output, 'wiring.json'),
      CAPABILITY_TRANSCRIPT: transcript,
    },
    300_000,
  );
  writeFileSync(join(output, 'stdout'), result.stdout);
  writeFileSync(join(output, 'stderr'), result.stderr);
  success(result);
  const messages: unknown[] = readFileSync(transcript, 'utf8')
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
