import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  repositoryRoot,
  snapshot,
  temporaryRepository,
} from '../../../../packages/cli/test/concept-journal/fixture.js';

import { type Attempt, type View, failures } from './check.js';

// Actual capabilities and authored output controls share this checker.
function protectedMeaning(
  attempt: Attempt,
  verb: string,
  concept: string,
  cut: string,
) {
  expect(failures(attempt, verb, concept, cut)).toEqual([]);
}

function project(
  context: string,
  concept: string,
  meaning: string,
  cuts: string[],
) {
  const f = temporaryRepository();
  function run(agent: string, ...args: string[]) {
    const result = spawnSync(
      process.execPath,
      [join(repositoryRoot, 'packages/cli/dist/cratylus.js'), ...args],
      {
        cwd: f.root,
        encoding: 'utf8',
        timeout: 30_000,
        env: {
          PATH: process.env.PATH,
          HOME: join(f.sandbox, 'home'),
          CRATYLUS_AGENT: agent,
          GIT_CONFIG_NOSYSTEM: '1',
          GIT_CONFIG_GLOBAL: '/dev/null',
        },
      },
    );
    if (result.error) throw result.error;
    return {
      code: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
  function ok(agent: string, ...args: string[]) {
    const result = run(agent, ...args);
    expect(result.code, `${args.join(' ')}\n${result.stderr}`).toBe(0);
    return JSON.parse(result.stdout);
  }
  function view(): View {
    return {
      bytes: snapshot(f.root),
      design: ok('lead', 'concepts', 'design', '--context', context),
      history: ok('lead', 'concepts', 'history', concept, '--context', context),
    };
  }
  try {
    ok(
      'architect',
      'concepts',
      'context',
      context,
      '--subject',
      `The ${context}'s design.`,
    );
    ok(
      'architect',
      'concepts',
      'define',
      concept,
      '--context',
      context,
      '--wording',
      meaning,
      '--reason',
      'Initial meaning.',
    );
    for (const cut of cuts) {
      const path = join(f.root, 'design/examples', context, `${cut}.md`);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(
        path,
        `1. (${concept}) **Given** the agreed meaning, **when** the cut realizes it, **then** it holds.\n`,
      );
      ok(
        'lead',
        'workPackage',
        'open',
        '--cut',
        cut,
        '--branch',
        `feature/${cut}`,
        '--architect',
        `${context}=architect`,
      );
    }
    return { ...f, run, ok, view };
  } catch (error) {
    f.dispose();
    throw error;
  }
}

for (const verb of ['supersede', 'retire']) {
  describe(`Held-out meaning-roles workflow — ${verb}`, () => {
    it("1: integrating one cut does not release another cut's concept", () => {
      const f = project(
        'museum',
        'receipt',
        'A receipt confirms the museum accepted payment.',
        ['receipt-print', 'receipt-reissue'],
      );
      try {
        f.ok('architect', 'workPackage', 'integrate', '--cut', 'receipt-print');
        const before = f.view();
        const result = f.run(
          'lead',
          'concepts',
          verb,
          'receipt',
          '--context',
          'museum',
          '--reason',
          'Make the remaining build easier.',
          ...(verb === 'supersede'
            ? ['--wording', 'A receipt confirms only a payment attempt.']
            : []),
        );
        protectedMeaning(
          { ...result, before, after: f.view() },
          verb,
          'receipt',
          'receipt-reissue',
        );
      } finally {
        f.dispose();
      }
    });

    it('2: an architect correction does not release the corrected meaning', () => {
      const original = 'Admission is permission to enter the theatre.';
      const correction =
        'Admission is permission to enter the theatre after ticket validation; a reservation is not admission.';
      const f = project('theatre', 'admission', original, ['admission']);
      try {
        const old = f.view();
        f.ok(
          'architect',
          'concepts',
          'supersede',
          'admission',
          '--context',
          'theatre',
          '--wording',
          correction,
          '--reason',
          'Distinguish a held seat from entry permission.',
        );
        const before = f.view();
        expect(before.history.versions.map((v) => v.wording)).toEqual([
          original,
          correction,
        ]);
        expect(before.history.versions[0]).toEqual(old.history.versions[0]);
        for (const [path, bytes] of Object.entries(old.bytes))
          expect(before.bytes[path]).toBe(bytes);
        expect(before.design.contexts[0]!.concepts).toEqual([
          expect.objectContaining({ name: 'admission', wording: correction }),
        ]);
        const result = f.run(
          'builder',
          'concepts',
          verb,
          'admission',
          '--context',
          'theatre',
          '--reason',
          'Match what the build currently does.',
          ...(verb === 'supersede'
            ? ['--wording', 'A reservation admits its holder.']
            : []),
        );
        protectedMeaning(
          { ...result, before, after: f.view() },
          verb,
          'admission',
          'admission',
        );
      } finally {
        f.dispose();
      }
    });
  });
}
