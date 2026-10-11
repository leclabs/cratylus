import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type ProofRecordings,
  judgeBatch,
  proveOffline,
} from '@cratylus/runtime';
import { describe, expect, it } from 'vitest';
import { type Recording, type Scenario, assess, check } from './check.js';
import { liveRun, preflight } from './runner.js';

// Controls are authored transcripts with recorded rubric answers; captured
// goldens identify their source and any evidence-preserving normalization in
// their provenance. Live runs compute fresh answers from the same fixed rubric.
// Offline proof validates wiring, mechanical predicates, answer schema, clause
// isolation and aggregation; it does not claim to validate a model judge.
export function roleSuite(directory: string) {
  const scenarios: Scenario[] = JSON.parse(
    readFileSync(join(directory, 'scenarios.json'), 'utf8'),
  );
  for (const scenario of scenarios)
    describe(`Example ${scenario.number} — ${scenario.title}`, () => {
      const source = check(scenario);
      const path = join(directory, 'recordings', String(scenario.number));
      const recordings: ProofRecordings<Recording> = {
        golden: readdirSync(path)
          .filter((name) => name.startsWith('golden-'))
          .map((name) => ({
            name,
            recording: JSON.parse(readFileSync(join(path, name), 'utf8')),
          })),
        negative: readdirSync(path)
          .filter((name) => name.startsWith('negative-'))
          .map((name) => ({
            name,
            ...JSON.parse(readFileSync(join(path, name), 'utf8')),
          })),
      };
      it('offline proof: varied goldens, one-clause negatives, no host reads', async () => {
        expect(await proveOffline(source, recordings)).toEqual({
          proven: true,
          findings: [],
        });
      });
      for (const negative of recordings.negative)
        it(`seen red: ${negative.breaks}`, async () => {
          const failed = Object.entries(assess(scenario, negative.recording))
            .filter(([, pass]) => !pass)
            .map(([id]) => id);
          expect(failed).toEqual([negative.breaks]);
          const batch = await judgeBatch(
            source,
            Array(5).fill(negative.recording),
            { atLeast: 4, of: 5 },
          );
          expect(batch.passed).toBe(false);
        });
      it('offline aggregation: four of five, every never in all five', async () => {
        const good = recordings.golden[0]!.recording;
        expect(
          (await judgeBatch(source, Array(5).fill(good), { atLeast: 4, of: 5 }))
            .passed,
        ).toBe(true);
        for (const negative of recordings.negative) {
          const never =
            source.assertions.find((item) => item.id === negative.breaks)!
              .never === true;
          const one = await judgeBatch(
            source,
            [good, good, good, good, negative.recording],
            { atLeast: 4, of: 5 },
          );
          expect(
            one.assertions.find((item) => item.id === negative.breaks)!.passed,
          ).toBe(!never);
          const two = await judgeBatch(
            source,
            [good, good, good, negative.recording, negative.recording],
            { atLeast: 4, of: 5 },
          );
          expect(two.passed).toBe(false);
        }
      });
      it.runIf(process.env.EXECUTION_RED === '1')(
        'red demonstration: rejects unsatisfying work',
        async () => {
          // Intentionally fails when explicitly requested; never expected in the
          // normal test run. Select a behavioral failure, not merely wrong wiring.
          const bad = recordings.negative.find(
            (record) => record.breaks !== 'installed-role',
          )!;
          expect(
            await judgeBatch(source, Array(5).fill(bad.recording), {
              atLeast: 4,
              of: 5,
            }),
          ).toMatchObject({ passed: true });
        },
      );
      it.runIf(process.env.EXECUTION_PREFLIGHT === '1')(
        'preflight: composed installed declaration and tools, no model',
        () => {
          const output = process.env.EXECUTION_RECORDINGS
            ? join(
                process.env.EXECUTION_RECORDINGS,
                String(scenario.number),
                'preflight',
              )
            : undefined;
          preflight(scenario, output);
        },
        90_000,
      );
      it.runIf(process.env.EXECUTION_LIVE === '1')(
        'live: five installed-agent runs against the fixed scenario',
        async () => {
          const directory =
            process.env.EXECUTION_RECORDINGS ??
            mkdtempSync(join(tmpdir(), 'execution-roles-'));
          const output = join(directory, String(scenario.number));
          mkdirSync(output, { recursive: true });
          const runs: Recording[] = [];
          const errors: string[] = [];
          for (let index = 1; index <= 5; index++) {
            try {
              runs.push(liveRun(scenario, join(output, `run-${index}`)));
            } catch (error) {
              errors.push(`Run ${index}: ${String(error)}`);
            }
          }
          writeFileSync(
            join(output, 'errors.json'),
            JSON.stringify(errors, null, 2),
          );
          expect(errors, `Recordings: ${output}`).toEqual([]);
          const batch = await judgeBatch(source, runs, { atLeast: 4, of: 5 });
          writeFileSync(
            join(output, 'assessment.json'),
            JSON.stringify(batch, null, 2),
          );
          expect(batch.passed, JSON.stringify(batch)).toBe(true);
        },
        3_900_000,
      );
    });
}
