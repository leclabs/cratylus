import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { judgeBatch, proveOffline } from '@cratylus/runtime';
import { describe, expect, it } from 'vitest';
import {
  type Recording,
  type Scenario,
  assess,
  check,
  rubricPrompt,
} from '../../../../packages/cli/test/reconstitution/architect/check.js';
import {
  liveRun,
  recordingDirectory,
} from '../../../../packages/cli/test/reconstitution/architect/runner.js';
import { liveBatch } from '../../../../packages/cli/test/rubric-judge.js';

type Negative = { name: string; breaks: string[]; recording: Recording };

export function architectSuite(directory: string) {
  const scenarios: Scenario[] = JSON.parse(
    readFileSync(join(directory, 'scenarios.json'), 'utf8'),
  );
  for (const scenario of scenarios) {
    describe(`Meaning roles ${scenario.ref} — ${scenario.title}`, () => {
      const source = check(scenario);
      const path = join(directory, 'recordings', String(scenario.number));
      const names = readdirSync(path);
      const golden = names
        .filter((name) => name.startsWith('golden-'))
        .map((name) => ({
          name,
          recording: JSON.parse(
            readFileSync(join(path, name), 'utf8'),
          ) as Recording,
        }));
      const negative: Negative[] = names
        .filter((name) => name.startsWith('negative-'))
        .map((name) => ({
          name,
          ...JSON.parse(readFileSync(join(path, name), 'utf8')),
        }));
      const good = golden[0]?.recording;
      if (!good) throw new Error('Missing golden recording');

      it('offline proof: varied goldens, each bound assertion seen failing, no host reads', async () => {
        // Some words entail others: withholding a recommendation also omits it.
        // Preserve every failure in those recordings. Project one assertion at a
        // time into the existing single-assertion-negative proof, never forge a
        // passing answer for an overlapping obligation to satisfy its API.
        for (const assertion of source.assertions) {
          const projected = {
            ...source,
            assertions: [assertion],
            judge: (record: Recording) => ({
              [assertion.id]: assess(scenario, record)[assertion.id] === true,
            }),
          };
          expect(
            await proveOffline(projected, {
              golden,
              negative: negative
                .filter((n) => n.breaks.includes(assertion.id))
                .map((n) => ({ ...n, breaks: assertion.id })),
            }),
            assertion.id,
          ).toEqual({ proven: true, findings: [] });
        }
      });

      for (const control of negative) {
        it(`seen red: ${control.name}`, async () => {
          const failures = Object.entries(assess(scenario, control.recording))
            .filter(([, pass]) => !pass)
            .map(([id]) => id)
            .sort();
          expect(failures).toEqual([...control.breaks].sort());
          expect(
            (
              await judgeBatch(source, Array(5).fill(control.recording), {
                atLeast: 4,
                of: 5,
              })
            ).passed,
          ).toBe(false);
        });
      }

      it('the rubric sees the delivered violation and its later correction', () => {
        const corrected = negative.find(
          (n) => n.name === 'negative-corrected.json',
        )?.recording;
        if (!corrected) throw new Error('Missing corrected negative recording');
        const prompt = rubricPrompt(scenario, corrected);
        for (const message of corrected.messages as {
          role: string;
          content: { type: string; text?: string }[];
        }[]) {
          if (message.role !== 'assistant') continue;
          for (const part of message.content) {
            if (part.type === 'text')
              expect(prompt).toContain(JSON.stringify(part.text));
          }
        }
      });

      it('four of five for ordinary clauses; every never holds in all five', async () => {
        expect(
          (await judgeBatch(source, Array(5).fill(good), { atLeast: 4, of: 5 }))
            .passed,
        ).toBe(true);
        for (const bad of negative) {
          const one = await judgeBatch(
            source,
            [good, good, good, good, bad.recording],
            { atLeast: 4, of: 5 },
          );
          for (const result of one.assertions) {
            const assertion = source.assertions.find(
              (item) => item.id === result.id,
            );
            if (!assertion)
              throw new Error(`Undeclared assertion ${result.id}`);
            expect(result.passed, `${bad.name}/${result.id}`).toBe(
              !(bad.breaks.includes(result.id) && assertion.never === true),
            );
          }
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

      it.runIf(process.env.EXECUTION_RED === '1')(
        'red demonstration: one never violation fails the batch',
        async () => {
          const bad = negative.find((n) =>
            n.breaks.some((id) => id.startsWith('never-')),
          );
          if (!bad) throw new Error('Missing never-violation recording');
          expect(
            (
              await judgeBatch(
                source,
                [good, good, good, good, bad.recording],
                { atLeast: 4, of: 5 },
              )
            ).passed,
          ).toBe(true);
        },
      );

      it.runIf(process.env.EXECUTION_LIVE === '1')(
        'judgment only: installed architect, continuing session, five-run threshold',
        async () => {
          const directory =
            process.env.EXECUTION_RECORDINGS ??
            mkdtempSync(join(tmpdir(), 'meaning-roles-judgment-'));
          const output = recordingDirectory(directory, scenario);
          const batch = await liveBatch(
            source,
            (index, signal) =>
              liveRun(scenario, join(output, `run-${index}`), signal),
            output,
          );
          expect(batch.passed, JSON.stringify(batch)).toBe(true);
        },
        10_000_000,
      );
    });
  }
}
