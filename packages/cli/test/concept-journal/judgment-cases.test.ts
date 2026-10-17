// Architect-authorized judgment cases: merged identities and retirement.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type Context,
  type Decision,
  type TemporaryRepository,
  append,
  context,
  decisionArgs,
  define,
  expectedDecision,
  git,
  history,
  query,
  refuse,
  repositoryRoot,
  snapshot,
  temporaryRepository,
} from './fixture.js';

interface IdentifiedDecision extends Decision {
  entry: string;
}
interface DescribedContext extends Omit<Context, 'subject' | 'relation'> {
  subject: string | null;
  relation: string | null;
  competingDescriptions: { subject: string; relation: string }[];
}

let fixture: TemporaryRepository;
beforeEach(() => {
  fixture = temporaryRepository();
});
afterEach(() => {
  fixture.dispose();
});

function runNode(cwd: string, ...args: string[]) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
    },
  });
  if (result.error) throw result.error;
  expect(result.status, result.stderr).not.toBeNull();
  return result;
}

describe('concept journal judgment regressions', () => {
  it('D1 decisions — merged same-name decisions keep distinct entries and accept only an unambiguous reference', () => {
    const { root } = fixture;
    context(root);
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Shared context');
    const common = snapshot(root);
    git(root, 'switch', '-c', 'left');
    const leftArgs = decisionArgs('0022');
    leftArgs[leftArgs.indexOf('--title') + 1] = 'Left branch choice';
    append(root, ...leftArgs);
    const left = snapshot(root);
    const leftEntry = Object.keys(left)
      .find((path) => !(path in common))!
      .slice(0, 26);
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Left decision 0022');
    git(root, 'switch', '-c', 'right', 'journal');
    const rightArgs = decisionArgs('0022');
    rightArgs[rightArgs.indexOf('--title') + 1] = 'Right branch choice';
    append(root, ...rightArgs);
    const right = snapshot(root);
    const rightEntry = Object.keys(right)
      .find((path) => !(path in common))!
      .slice(0, 26);
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Right decision 0022');
    git(root, 'switch', 'left');
    git(root, 'merge', '--no-edit', 'right');
    expect(git(root, 'ls-files', '--unmerged')).toBe('');
    expect(snapshot(root)).toEqual({ ...left, ...right });
    expect(leftEntry).not.toBe(rightEntry);
    const expected = [
      {
        ...expectedDecision('0022'),
        entry: leftEntry,
        title: 'Left branch choice',
      },
      {
        ...expectedDecision('0022'),
        entry: rightEntry,
        title: 'Right branch choice',
      },
    ].sort((a, b) => a.entry.localeCompare(b.entry));
    for (const flags of [[], ['--open']]) {
      expect(
        query<{ decisions: IdentifiedDecision[] }>(
          root,
          'decisions',
          '--history',
          ...flags,
        ).decisions,
      ).toMatchObject(expected);
    }
    // The design state carries no decision; they are read with decisions alone.
    expect(query(root, 'state').contexts[0]).not.toHaveProperty('decisions');
    refuse(root, 'accept', '0022');
    append(
      root,
      'accept',
      leftEntry,
      '--reason',
      'Accept only the left branch decision.',
    );
    const accepted = expected.map((decision) => ({
      ...decision,
      status: decision.entry === leftEntry ? 'accepted' : 'open',
    }));
    expect(
      query<{ decisions: IdentifiedDecision[] }>(root, 'decisions', '--history')
        .decisions,
    ).toMatchObject(accepted);
    const stillOpen = accepted.filter(
      (decision) => decision.entry === rightEntry,
    );
    expect(
      query<{ decisions: IdentifiedDecision[] }>(
        root,
        'decisions',
        '--history',
        '--open',
      ).decisions,
    ).toMatchObject(stillOpen);
  });

  it.each([
    {
      difference: 'identical descriptions',
      subject: 'Shared subject.',
      relation: 'Shared relation.',
    },
    {
      difference: 'different subjects',
      subject: 'Right subject.',
      relation: 'Shared relation.',
    },
    {
      difference: 'different relations',
      subject: 'Shared subject.',
      relation: 'Right relation.',
    },
  ])(
    'D1 contexts — merged $difference retain one context and settle only competing descriptions',
    ({ difference, subject, relation }) => {
      const { root } = fixture;
      git(root, 'commit', '--allow-empty', '-m', 'Common ancestor');
      git(root, 'switch', '-c', 'left');
      append(
        root,
        'context',
        'workflow',
        '--subject',
        'Shared subject.',
        '--relation',
        'Shared relation.',
      );
      const left = snapshot(root);
      const leftEntry = Object.keys(left)[0]!;
      git(root, 'add', 'design/journal');
      git(root, 'commit', '-m', 'Left context');
      git(root, 'switch', '-c', 'right', 'journal');
      append(
        root,
        'context',
        'workflow',
        '--subject',
        subject,
        '--relation',
        relation,
      );
      const right = snapshot(root);
      const rightEntry = Object.keys(right)[0]!;
      git(root, 'add', 'design/journal');
      git(root, 'commit', '-m', 'Right context');
      git(root, 'switch', 'left');
      git(root, 'merge', '--no-edit', 'right');
      expect(git(root, 'ls-files', '--unmerged')).toBe('');
      expect(snapshot(root)).toEqual({ ...left, ...right });
      const current = query<{ contexts: DescribedContext[] }>(
        root,
        'design',
        '--history',
      );
      const common = {
        name: 'workflow',
        concepts: [],
        competing: [],
        retired: [],
      };
      if (difference === 'identical descriptions') {
        expect(current.contexts).toMatchObject([
          { ...common, subject, relation, competingDescriptions: [] },
        ]);
      } else {
        const descriptions = [
          {
            entry: leftEntry,
            subject: 'Shared subject.',
            relation: 'Shared relation.',
          },
          { entry: rightEntry, subject, relation },
        ]
          .sort((a, b) => a.entry.localeCompare(b.entry))
          .map(({ subject, relation }) => ({ subject, relation }));
        expect(current.contexts).toMatchObject([
          {
            ...common,
            subject: null,
            relation: null,
            competingDescriptions: descriptions,
          },
        ]);
        append(
          root,
          'context',
          'workflow',
          '--subject',
          'Settled subject.',
          '--relation',
          'Settled relation.',
          '--reason',
          'Keep both branches in one settled description.',
        );
        expect(
          query<{ contexts: DescribedContext[] }>(root, 'design', '--history')
            .contexts,
        ).toMatchObject([
          {
            ...common,
            subject: 'Settled subject.',
            relation: 'Settled relation.',
            competingDescriptions: [],
          },
        ]);
      }
      refuse(
        root,
        'context',
        'workflow',
        '--subject',
        'Cannot replace a settled description.',
      );
    },
  );

  it('D3 — supersession restores retirement consistently on one branch and after a retirement/live merge', () => {
    const { root } = fixture;
    context(root);
    define(root);
    const original = history(root).versions[0]!;
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Original reservation');
    git(root, 'switch', '-c', 'left');
    append(
      root,
      'supersede',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      'A reservation expires after twenty minutes.',
      '--reason',
      'Allow more time.',
    );
    const live = history(root).versions[1]!;
    const left = snapshot(root);
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Left live reservation');
    git(root, 'switch', '-c', 'right', 'journal');
    append(
      root,
      'retire',
      'reservation',
      '--context',
      'workflow',
      '--reason',
      'Stop taking reservations.',
    );
    const retired = history(root).versions[1]!;
    const right = snapshot(root);
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Right retired reservation');
    git(root, 'switch', 'left');
    git(root, 'merge', '--no-edit', 'right');
    expect(git(root, 'ls-files', '--unmerged')).toBe('');
    expect(snapshot(root)).toEqual({ ...left, ...right });
    const heads = [live, retired].sort((a, b) => a.id.localeCompare(b.id));
    expect(history(root).versions).toEqual([original, ...heads]);
    append(
      root,
      'supersede',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      'A reservation expires after fifteen minutes.',
      '--reason',
      'Reservations are needed again.',
      '--built-from',
      'time',
    );
    expect(query(root, 'design', '--history').contexts[0]).toMatchObject({
      concepts: [
        {
          name: 'reservation',
          wording: 'A reservation expires after fifteen minutes.',
          builtFrom: ['time'],
          reason: 'Reservations are needed again.',
        },
      ],
      competing: [],
      retired: [],
    });
    const after = history(root);
    expect(after.versions).toHaveLength(4);
    expect(after.versions.slice(0, 3)).toEqual([original, ...heads]);
    expect(after.versions[3]).toMatchObject({
      kind: 'supersede',
      wording: 'A reservation expires after fifteen minutes.',
      builtFrom: ['time'],
      reason: 'Reservations are needed again.',
    });
    expect(after.versions[3]!.supersedes.slice().sort()).toEqual(
      heads.map((version) => version.id).sort(),
    );
    // Return to the common ancestor to bind the same restoration without competing heads.
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Resolved merged reservation');
    git(root, 'switch', 'journal');
    append(
      root,
      'retire',
      'reservation',
      '--context',
      'workflow',
      '--reason',
      'Stop taking reservations.',
    );
    const before = history(root);
    expect(before.versions.map((version) => version.kind)).toEqual([
      'define',
      'retire',
    ]);
    expect(query(root, 'design', '--history').contexts[0]).toMatchObject({
      concepts: [],
      competing: [],
      retired: [{ name: 'reservation', reason: 'Stop taking reservations.' }],
    });
    append(
      root,
      'supersede',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      'A reservation expires after fifteen minutes.',
      '--reason',
      'Reservations are needed again.',
      '--built-from',
      'time',
    );
    expect(query(root, 'design', '--history').contexts[0]).toMatchObject({
      concepts: [
        {
          name: 'reservation',
          wording: 'A reservation expires after fifteen minutes.',
          builtFrom: ['time'],
          reason: 'Reservations are needed again.',
        },
      ],
      competing: [],
      retired: [],
    });
    const restored = history(root);
    expect(restored.versions.map((version) => version.kind)).toEqual([
      'define',
      'retire',
      'supersede',
    ]);
    expect(restored.versions.slice(0, 2)).toEqual(before.versions);
    expect(restored.versions[2]).toMatchObject({
      kind: 'supersede',
      wording: 'A reservation expires after fifteen minutes.',
      builtFrom: ['time'],
      reason: 'Reservations are needed again.',
      supersedes: [before.versions[1]!.id],
    });
  });

  it('D2 — legacy design is not delivered, while concepts and its design query remain', () => {
    const { root } = fixture;
    const bin = join(repositoryRoot, 'packages/cli/dist/cratylus.js');
    const help = runNode(root, bin, '--help');
    expect(help.status, help.stderr).toBe(0);
    const commands = help.stdout
      .split('\n')
      .flatMap((line) => /^\s{2}(\S+)/.exec(line)?.[1] ?? []);
    expect.soft(commands).not.toContain('design');
    expect(commands).toContain('concepts');
    const before = snapshot(root);
    const legacy = runNode(root, bin, 'design', 'show');
    expect.soft(legacy.status, `${legacy.stdout}${legacy.stderr}`).not.toBe(0);
    expect(snapshot(root)).toEqual(before);
    context(root);
    define(root);
    expect(query(root, 'design', '--history').contexts).toMatchObject([
      {
        name: 'workflow',
        concepts: [
          {
            name: 'reservation',
            wording: 'A reservation expires after ten minutes.',
            builtFrom: [],
            reason: 'Allow time to finish.',
          },
        ],
        competing: [],
        retired: [],
      },
    ]);
  });
});
