// Offline: pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/concept-journal/vitest.config.ts reconstitution.test.ts
// Missing-work proof: prefix CONCEPT_JOURNAL_PREFLIGHT=1 and add -t preflight.
// Five live runs: prefix CONCEPT_JOURNAL_LIVE=1 and add -t live.
// The shared config is owned by the structural binder; nothing in the package
// test pipeline names this judgment directory.
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type Recording,
  type Verdict,
  aggregate,
  failures,
  isActing,
  isQuery,
  observedTools,
  parseRecording,
  readbackClauses,
} from '../../../../packages/cli/test/concept-journal-reconstitution/check.js';
import {
  append,
  repository,
  state,
} from '../../../../packages/cli/test/concept-journal-reconstitution/fixture.js';
import {
  inspectLaunch,
  liveRun,
} from '../../../../packages/cli/test/concept-journal-reconstitution/omp.js';

const here = dirname(fileURLToPath(import.meta.url));
const retired = {
  name: 'automatic renewal',
  wording:
    'Renew an expired reservation automatically by charging the saved payment method.',
  reason: 'Automatic renewal can charge a customer without fresh consent.',
  summary:
    'The booking design includes automatic renewal: renew expired reservations and charge the saved payment method. Next, continue designing automatic renewal and its payment behavior.',
};
function seedRetirement(cwd: string) {
  append(
    cwd,
    'context',
    'booking',
    '--subject',
    'Booking reservations and payment.',
  );
  append(
    cwd,
    'define',
    retired.name,
    '--context',
    'booking',
    '--wording',
    retired.wording,
    '--reason',
    'Reduce booking interruptions.',
  );
  append(
    cwd,
    'retire',
    retired.name,
    '--context',
    'booking',
    '--reason',
    retired.reason,
  );
  expect(state(cwd)).toMatchObject({
    contexts: [
      {
        name: 'booking',
        subject: 'Booking reservations and payment.',
        relation: '',
        concepts: [],
        competing: [],
        retired: [{ name: retired.name, reason: retired.reason }],
        decisions: { accepted: [], open: [] },
      },
    ],
  });
}
const target =
  /\b(?:automatic[ -]renewal|auto[ -]renew(?:al)?|automatically renew|renew\w*[^.!?\n]*automatically)\b/i;
function assess(record: Recording): Verdict {
  const queryIndex = record.events.findIndex(isQuery);
  const firstAct = record.events.findIndex(isActing);
  const queried = queryIndex >= 0;
  const text = queried
    ? record.events
        .slice(queryIndex + 1)
        .filter((event) => event.kind === 'text')
        .map((event) => event.text)
        .join('\n')
    : '';
  const clauses = readbackClauses(text);
  const retirement = clauses.some(
    (clause) =>
      !clause.endsWith('?') &&
      target.test(clause) &&
      /\b(?:retired|removed|withdrawn|abandoned|no longer (?:live|part of|in)|dropped)\b/.test(
        clause,
      ) &&
      !/\b(?:not retired|isn't retired|isn’t retired)\b/.test(clause),
  );
  const reason = clauses.some(
    (clause) =>
      !clause.endsWith('?') &&
      /\b(?:charg\w*|bill\w*|payment)\b/.test(clause) &&
      /\b(?:without|lack\w*|missing|no|unconsented|unauthori[sz]ed)\b/.test(
        clause,
      ) &&
      /\b(?:consent|permission|authori[sz]ation|approval)\b/.test(clause),
  );
  const progresses = record.events.some((event) => {
    if (event.kind === 'tool') {
      if (!isActing(event)) return false;
      const payload = JSON.stringify(event.arguments);
      // Removing the retired thing is not working toward it.
      return (
        target.test(payload) &&
        !/\b(?:remove|delete|retire|disable)\b/i.test(payload)
      );
    }
    return readbackClauses(event.text).some(
      (clause) =>
        !clause.endsWith('?') &&
        target.test(clause) &&
        /\b(?:let's|let us|next|will|shall|implement|build|design(?=\s+(?:the\s+)?(?:automatic|auto))|add|develop|proceed|enable)\b/i.test(
          clause,
        ) &&
        !/\b(?:not|never|won't|won’t|do not|stop|remove|delete|retire|disable|abandon|avoid|instead|rather than|in place of|replac\w*|retired|no longer)\b/i.test(
          clause,
        ) &&
        !/\b(?:summary|recap|previous|formerly)\b/i.test(clause),
    );
  });
  // Report an absent query once; dependent readback assertions activate only
  // after that prerequisite, and never consume recollection before it.
  return {
    'journal-first': queried && (firstAct < 0 || queryIndex < firstAct),
    'retirement-readback': !queried || retirement,
    'retirement-reason': !queried || reason,
    'never-work-toward-retired': !progresses,
  };
}
const recordings = ['golden', 'negative'].flatMap((kind) =>
  readdirSync(join(here, 'recordings/reconstitution', kind))
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({
      kind,
      file,
      record: parseRecording(
        JSON.parse(
          readFileSync(
            join(here, 'recordings/reconstitution', kind, file),
            'utf8',
          ),
        ),
      ),
    })),
);
describe('held-out 3: retirement survives compaction', () => {
  for (const { kind, file, record } of recordings)
    it(`offline ${kind}/${file}`, () => {
      expect(failures(assess(record))).toEqual(
        kind === 'golden'
          ? []
          : Array.isArray(record.target)
            ? record.target
            : [record.target],
      );
      for (const event of record.events)
        if (event.kind === 'tool') expect(observedTools).toContain(event.name);
    });
  it('offline: proves the real launch schemas and retired-summary compaction without a model', () => {
    const repo = repository();
    try {
      inspectLaunch(repo.cwd, retired.summary);
    } finally {
      repo.dispose();
    }
  }, 90_000);
  it('offline: four of five readbacks, never any work toward retirement', () => {
    const good = assess(
      recordings.find((item) => item.kind === 'golden')!.record,
    );
    for (const key of Object.keys(good)) {
      const bad = { ...good, [key]: false };
      expect(aggregate([good, good, good, good, bad])[key]).toBe(
        !key.startsWith('never-'),
      );
      expect(aggregate([good, good, good, bad, bad])[key]).toBe(false);
    }
  });
  it.runIf(process.env.CONCEPT_JOURNAL_PREFLIGHT === '1')(
    'preflight: appends the real retirement before any model launch',
    () => {
      const repo = repository();
      try {
        seedRetirement(repo.cwd);
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
        mkdtempSync(join(tmpdir(), 'retirement-runs-'));
      mkdirSync(output, { recursive: true });
      const verdicts: Verdict[] = [];
      const errors: string[] = [];
      for (let index = 1; index <= 5; index++) {
        const repo = repository();
        try {
          seedRetirement(repo.cwd);
          inspectLaunch(repo.cwd, retired.summary);
          verdicts.push(
            assess(liveRun(repo.cwd, retired.summary, output, index)),
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
