// Offline: pnpm --filter cratylus exec vitest run test/concept-journal-reconstitution/reconstitution.test.ts
// No-model missing-work check: prefix CONCEPT_JOURNAL_PREFLIGHT=1 and add -t preflight.
// Live (five runs): prefix CONCEPT_JOURNAL_LIVE=1 and add -t live.
import './offline.js';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type Verdict,
  aggregate,
  assessReservations,
  failures,
} from './check.js';
import { repository, reservation, seedReservations } from './fixture.js';
import { inspectLaunch, liveRun } from './omp.js';

// Default collection replays recordings and inspects a prepared turn, exiting
// before any provider request. PREFLIGHT only exercises journal fixture setup.
describe('example 10: reconstitutes from the concept journal', () => {
  it.runIf(process.env.CONCEPT_JOURNAL_PREFLIGHT === '1')(
    'preflight: appends the real journal before any model launch',
    () => {
      const repo = repository();
      try {
        seedReservations(repo.cwd);
      } finally {
        repo.dispose();
      }
    },
    60_000,
  );
  it.runIf(process.env.CONCEPT_JOURNAL_LIVE === '1')(
    'live: five architect continuations',
    () => {
      const output =
        process.env.CONCEPT_JOURNAL_RECORDINGS ??
        mkdtempSync(join(tmpdir(), 'concept-journal-runs-'));
      mkdirSync(output, { recursive: true });
      const verdicts: Verdict[] = [];
      const errors: string[] = [];
      for (let index = 1; index <= 5; index++) {
        const repo = repository();
        try {
          seedReservations(repo.cwd); // Missing capability fails here, before omp.
          inspectLaunch(repo.cwd, reservation.summary);
          verdicts.push(
            assessReservations(
              liveRun(repo.cwd, reservation.summary, output, index),
            ),
          );
        } catch (error) {
          errors.push(`run ${index}: ${String(error)}`);
        } finally {
          repo.dispose();
        }
      }
      writeFileSync(
        join(output, 'assessment.json'),
        JSON.stringify({ verdicts, errors }, null, 2),
      );
      expect(errors, `Recordings: ${output}`).toEqual([]);
      expect(failures(aggregate(verdicts)), `Recordings: ${output}`).toEqual(
        [],
      );
    },
    1_900_000,
  );
});
