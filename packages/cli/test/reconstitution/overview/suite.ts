import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type ProofRecordings,
  judgeBatch,
  proveOffline,
} from '@cratylus/runtime';
import { describe, expect, it } from 'vitest';
import { host } from '../../capability-port/fixture.js';
import { liveBatch } from '../../rubric-judge.js';
import { capture, live } from './rubric-runner.js';
import {
  type Recording,
  type Scenario,
  assess,
  check,
  parseAnswers,
} from './rubric.js';

export function rubricSuite(directory: string) {
  const scenarios: Scenario[] = JSON.parse(
    readFileSync(join(directory, 'scenarios.json'), 'utf8'),
  );
  for (const scenario of scenarios)
    describe(`${scenario.ref} fixed rubric`, () => {
      const path = join(directory, 'recordings', scenario.ref.split('/')[1]!);
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
      const source = check(scenario);
      it('offline proof — authored goldens pass and each one-clause negative fails', async () => {
        expect(await proveOffline(source, recordings)).toEqual({
          proven: true,
          findings: [],
        });
      });
      for (const negative of recordings.negative)
        it(`seen red — ${negative.breaks}`, async () => {
          expect(
            Object.entries(assess(scenario, negative.recording))
              .filter(([, passes]) => !passes)
              .map(([id]) => id),
          ).toEqual([negative.breaks]);
          expect(
            (
              await judgeBatch(source, Array(5).fill(negative.recording), {
                atLeast: 4,
                of: 5,
              })
            ).passed,
          ).toBe(false);
        });
      it('four of five per rubric criterion; every never in all five', async () => {
        const good = recordings.golden[0]!.recording;
        expect(
          (await judgeBatch(source, Array(5).fill(good), { atLeast: 4, of: 5 }))
            .passed,
        ).toBe(true);
        for (const bad of recordings.negative) {
          const one = await judgeBatch(
            source,
            [good, good, good, good, bad.recording],
            { atLeast: 4, of: 5 },
          );
          expect(one.passed).toBe(
            !scenario.clauses.find((c) => c.id === bad.breaks)?.never,
          );
          expect(
            (
              await judgeBatch(
                source,
                [good, good, good, bad.recording, bad.recording],
                { atLeast: 4, of: 5 },
              )
            ).passed,
          ).toBe(false);
        }
      });
      it('judge answer schema rejects missing criteria and empty evidence', () => {
        expect(() => parseAnswers('{}', scenario)).toThrow();
        const answers = {
          ...recordings.golden[0]!.recording.answers,
          [scenario.clauses[0]!.id]: { pass: true, evidence: '' },
        };
        expect(() => parseAnswers(JSON.stringify(answers), scenario)).toThrow();
      });
      it('delivered-output preflight — captures the actual interface or account without a model', () => {
        const h = host();
        try {
          expect(capture(scenario, h).output.trim()).not.toBe('');
        } finally {
          h.dispose();
        }
      });
      it.runIf(process.env.RECONSTITUTION_RED === '1')(
        'red demonstration — rejects an unsatisfying recording',
        async () => {
          expect(
            (
              await judgeBatch(
                source,
                Array(5).fill(recordings.negative[0]!.recording),
                { atLeast: 4, of: 5 },
              )
            ).passed,
          ).toBe(true);
        },
      );
      it.runIf(process.env.EXECUTION_LIVE === '1')(
        'live — parallel rubric sessions stop when the outcome is decided',
        async () => {
          const output = join(
            process.env.EXECUTION_RECORDINGS ??
              mkdtempSync(join(tmpdir(), 'reconstitution-rubrics-')),
            scenario.ref.replace('/', '-'),
          );
          const result = await liveBatch(
            source,
            async (index, signal) => {
              const recording = await live(
                scenario,
                join(output, `run-${index}`),
                signal,
              );
              writeFileSync(
                join(output, `run-${index}.json`),
                JSON.stringify(recording, null, 2),
              );
              return recording;
            },
            output,
          );
          expect(result.passed, JSON.stringify(result)).toBe(true);
        },
        10_000_000,
      );
    });
}
