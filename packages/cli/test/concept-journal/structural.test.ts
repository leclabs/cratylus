// Checks the concept journal through the built command, in consumer-owned repositories.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type Decision,
  type Design,
  type History,
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
  runConcepts,
  snapshot,
  successful,
  temporaryRepository,
  unchangedFiles,
} from './fixture.js';

let fixture: TemporaryRepository;
beforeEach(() => {
  fixture = temporaryRepository();
});
afterEach(() => {
  fixture.dispose();
});

const ten = 'A reservation expires after ten minutes.';
const fifteen = 'A reservation expires after fifteen minutes.';
const firstReason = 'Allow time to finish.';
const laterReason = 'Customers need five more minutes.';

function twoVersions(root: string): History {
  context(root);
  define(root);
  const first = history(root);
  append(
    root,
    'supersede',
    'reservation',
    '--context',
    'workflow',
    '--wording',
    fifteen,
    '--reason',
    laterReason,
    '--built-from',
    'time',
    '--built-from',
    'expiry',
  );
  return first;
}

describe('concept journal', () => {
  it('binds a concept to exactly one recorded context, and refuses incomplete definitions without a write', () => {
    const { root } = fixture;
    context(root);
    append(
      root,
      'context',
      'delivery',
      '--subject',
      'Reaching a harness.',
      '--relation',
      'Delivers workflow capabilities.',
    );
    append(
      root,
      'define',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      ten,
      '--reason',
      firstReason,
      '--built-from',
      'time',
      '--built-from',
      'expiry',
    );
    expect(query(root, 'design', '--history')).toMatchObject({
      contexts: [
        {
          name: 'workflow',
          subject: 'The workflow subject.',
          relation: '',
          concepts: [
            {
              name: 'reservation',
              wording: ten,
              builtFrom: ['time', 'expiry'],
              reason: firstReason,
            },
          ],
          competing: [],
          retired: [],
        },
        {
          name: 'delivery',
          subject: 'Reaching a harness.',
          relation: 'Delivers workflow capabilities.',
          concepts: [],
          competing: [],
          retired: [],
        },
      ],
    });
    expect(
      query(root, 'design', '--history', '--context', 'workflow').contexts,
    ).toHaveLength(1);
    const invalid = [
      [
        'define',
        'unbound',
        '--wording',
        'A complete wording.',
        '--reason',
        'A reason.',
      ],
      [
        'define',
        'ambiguous',
        '--context',
        'workflow',
        '--context',
        'delivery',
        '--wording',
        'A complete wording.',
        '--reason',
        'A reason.',
      ],
      [
        'define',
        'unknown',
        '--context',
        'absent',
        '--wording',
        'A complete wording.',
        '--reason',
        'A reason.',
      ],
      [
        'define',
        'unreasoned',
        '--context',
        'workflow',
        '--wording',
        'A complete wording.',
      ],
      ['context', 'workflow', '--subject', 'A second subject.'],
    ];
    for (const args of invalid) refuse(root, ...args);
  });

  it('supersedes by appending, preserves both reasons and refuses unreasoned or unknown replacements', () => {
    const { root } = fixture;
    const first = twoVersions(root);
    expect(query(root, 'design', '--history').contexts[0]).toMatchObject({
      concepts: [
        {
          name: 'reservation',
          wording: fifteen,
          builtFrom: ['time', 'expiry'],
          reason: laterReason,
        },
      ],
      competing: [],
      retired: [],
    });
    const past = history(root);
    expect(past.versions).toHaveLength(2);
    expect(past.versions[0]).toEqual(first.versions[0]);
    expect(past.versions[0]).toMatchObject({
      kind: 'define',
      wording: ten,
      builtFrom: [],
      reason: firstReason,
      supersedes: [],
    });
    expect(past.versions[1]).toMatchObject({
      kind: 'supersede',
      wording: fifteen,
      builtFrom: ['time', 'expiry'],
      reason: laterReason,
      supersedes: [first.versions[0]!.id],
    });
    refuse(
      root,
      'supersede',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      'Twenty minutes.',
    );
    refuse(
      root,
      'supersede',
      'missing',
      '--context',
      'workflow',
      '--wording',
      'Twenty minutes.',
      '--reason',
      'More time.',
    );
  });

  it('retirement removes the live concept, records its reason and retains every earlier version', () => {
    const { root } = fixture;
    twoVersions(root);
    const before = history(root);
    const reason = 'Reservations are no longer part of this workflow.';
    append(
      root,
      'retire',
      'reservation',
      '--context',
      'workflow',
      '--reason',
      reason,
    );
    expect(query(root, 'design', '--history').contexts[0]).toMatchObject({
      concepts: [],
      competing: [],
      retired: [{ name: 'reservation', reason }],
    });
    const after = history(root);
    expect(after.versions).toHaveLength(3);
    expect(after.versions.slice(0, 2)).toEqual(before.versions);
    expect(after.versions[2]).toMatchObject({
      kind: 'retire',
      reason,
      supersedes: [before.versions[1]!.id],
    });
    expect(after.versions[2]).not.toHaveProperty('wording');
    expect(after.versions[2]).not.toHaveProperty('builtFrom');
  });

  it('records an open decision with all three parts and refuses missing parts or an invalid status', () => {
    const { root } = fixture;
    context(root);
    append(root, ...decisionArgs('deposit'));
    expect(
      query<{ decisions: Decision[] }>(
        root,
        'decisions',
        '--history',
        '--open',
      ),
    ).toMatchObject({ decisions: [expectedDecision('deposit')] });
    for (const missing of ['--situation', '--decision', '--consequences']) {
      const args = decisionArgs(`missing-${missing.slice(2)}`);
      args.splice(args.indexOf(missing), 2);
      refuse(root, ...args);
    }
    refuse(root, ...decisionArgs('invalid-status', 'settled'));
  });

  it('appends acceptance then named supersession without changing the original decision record', () => {
    const { root } = fixture;
    context(root);
    append(root, ...decisionArgs('deposit'));
    const original = snapshot(root);
    append(
      root,
      'accept',
      'deposit',
      '--reason',
      'The architect approved the deposit.',
    );
    unchangedFiles(original, snapshot(root));
    expect(
      query<{ decisions: Decision[] }>(root, 'decisions', '--history'),
    ).toMatchObject({
      decisions: [expectedDecision('deposit', 'accepted')],
    });
    expect(
      query<{ decisions: Decision[] }>(root, 'decisions', '--history', '--open')
        .decisions,
    ).toEqual([]);
    append(root, ...decisionArgs('deposit-revised', 'accepted', 'deposit'));
    unchangedFiles(original, snapshot(root));
    // Superseded, the decision is history: listed only when history is asked
    // for, as is what the standing one superseded.
    const standing = query<{ decisions: Decision[] }>(root, 'decisions');
    expect(standing).toMatchObject({
      decisions: [{ id: 'deposit-revised', status: 'accepted' }],
    });
    expect(standing.decisions[0]).not.toHaveProperty('supersedes');
    expect(
      query<{ decisions: Decision[] }>(root, 'decisions', '--history'),
    ).toMatchObject({
      decisions: [
        expectedDecision('deposit', 'superseded', null, ['deposit-revised']),
        expectedDecision('deposit-revised', 'accepted', 'deposit'),
      ],
    });
    refuse(root, ...decisionArgs('orphan', 'accepted', 'absent'));
  });

  it('repeats all four questions byte-identically and reads latest design, history, accepted and open decisions without appending', () => {
    const { root } = fixture;
    twoVersions(root);
    define(
      root,
      'confirmation',
      'A confirmation acknowledges a reservation.',
      'Keep the acknowledgement explicit.',
    );
    append(root, ...decisionArgs('deposit', 'accepted'));
    append(root, ...decisionArgs('deposit-revised', 'accepted', 'deposit'));
    append(root, ...decisionArgs('refund', 'open'));
    const before = snapshot(root);
    const questions = [
      ['design', '--history', '--context', 'workflow'],
      ['history', 'reservation', '--context', 'workflow'],
      ['decisions', '--history', '--context', 'workflow', '--open'],
      ['state', '--context', 'workflow'],
    ];
    const answers = questions.map((args) => {
      const first = runConcepts(root, ...args);
      const second = runConcepts(root, ...args);
      successful(first, `concepts ${args.join(' ')}`);
      successful(second, `repeat concepts ${args.join(' ')}`);
      expect(Buffer.from(second.stdout)).toEqual(Buffer.from(first.stdout));
      expect(Buffer.from(second.stderr)).toEqual(Buffer.from(first.stderr));
      expect(snapshot(root)).toEqual(before);
      return first.json;
    });
    const design = answers[0] as Design;
    expect(design).toMatchObject({
      contexts: [
        {
          name: 'workflow',
          subject: 'The workflow subject.',
          relation: '',
          concepts: [
            {
              name: 'reservation',
              wording: fifteen,
              builtFrom: ['time', 'expiry'],
              reason: laterReason,
            },
            {
              name: 'confirmation',
              wording: 'A confirmation acknowledges a reservation.',
              builtFrom: [],
              reason: 'Keep the acknowledgement explicit.',
            },
          ],
          competing: [],
          retired: [],
        },
      ],
    });
    expect(answers[1]).toMatchObject({
      context: 'workflow',
      name: 'reservation',
      versions: [
        {
          kind: 'define',
          wording: ten,
          builtFrom: [],
          reason: firstReason,
          supersedes: [],
        },
        {
          kind: 'supersede',
          wording: fifteen,
          builtFrom: ['time', 'expiry'],
          reason: laterReason,
        },
      ],
    });
    expect(answers[2]).toMatchObject({
      decisions: [expectedDecision('refund')],
    });
    // The design state: each live concept as one line, no decision.
    expect(answers[3]).toEqual({
      purpose: null,
      contexts: [
        {
          name: 'workflow',
          subject: 'The workflow subject.',
          relation: '',
          concepts: [
            `reservation ≜ ${fifteen}`,
            'confirmation ≜ A confirmation acknowledges a reservation.',
          ],
          competing: [],
        },
      ],
    });
    expect(snapshot(root)).toEqual(before);
  });

  it('ignores legacy records in the working tree, main, and a plan branch held by another worktree', () => {
    const { root, sandbox } = fixture;
    // These are the old store's envelope + design payload, not invented journal entries.
    const plant = (cwd: string, id: string, anchor: string): void => {
      const directory = join(cwd, 'records/design');
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        join(directory, `${id}.json`),
        JSON.stringify({
          envelope: {
            id,
            entity: id,
            operation: 'create',
            supersedes: [],
            author: 'Earlier architect',
            time: '2026-10-01T00:00:00.000Z',
            reason: 'Legacy design.',
            cause: 'legacy-check',
          },
          payload: {
            anchor,
            gloss: `Legacy ${anchor} must not be imported.`,
            factors: [],
          },
        }),
      );
    };
    git(root, 'commit', '--allow-empty', '-m', 'Common ancestor');
    git(root, 'switch', '-c', 'main');
    plant(root, '01K70000000000000000000001', 'main-only');
    git(root, 'add', 'records');
    git(root, 'commit', '-m', 'Legacy main design');
    git(root, 'switch', 'journal');
    const planWorktree = join(sandbox, 'plan-worktree');
    git(
      root,
      'worktree',
      'add',
      '-b',
      'plan/legacy-design',
      planWorktree,
      'journal',
    );
    plant(planWorktree, '01K70000000000000000000002', 'plan-only');
    git(planWorktree, 'add', 'records');
    git(planWorktree, 'commit', '-m', 'Legacy plan design');
    plant(root, '01K70000000000000000000003', 'working-tree-only');
    context(root);
    define(root);
    expect(query(root, 'design', '--history')).toMatchObject({
      contexts: [
        {
          name: 'workflow',
          subject: 'The workflow subject.',
          relation: '',
          concepts: [
            {
              name: 'reservation',
              wording: ten,
              builtFrom: [],
              reason: firstReason,
            },
          ],
          competing: [],
          retired: [],
        },
      ],
    });
  });

  it('git merges both append sets, reports competing versions and resolves them only with a later supersession', () => {
    const { root } = fixture;
    context(root);
    define(root);
    const original = history(root).versions[0]!;
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Common journal');
    const common = snapshot(root);
    git(root, 'switch', '-c', 'left');
    append(
      root,
      'supersede',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      fifteen,
      '--reason',
      'Left branch needs more time.',
      '--built-from',
      'time',
    );
    define(root, 'left-only', 'Left branch concept.', 'Left branch reason.');
    const leftVersion = history(root).versions[1]!;
    const left = snapshot(root);
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Left journal additions');
    git(root, 'switch', '-c', 'right', 'journal');
    append(
      root,
      'supersede',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      'A reservation expires after twenty minutes.',
      '--reason',
      'Right branch needs even more time.',
      '--built-from',
      'time',
      '--built-from',
      'grace period',
    );
    define(root, 'right-only', 'Right branch concept.', 'Right branch reason.');
    const rightVersion = history(root).versions[1]!;
    const right = snapshot(root);
    git(root, 'add', 'design/journal');
    git(root, 'commit', '-m', 'Right journal additions');
    git(root, 'switch', 'left');
    // A real merge, not a synthetic concatenation, is the append-only contract.
    git(root, 'merge', '--no-edit', 'right');
    expect(git(root, 'ls-files', '--unmerged')).toBe('');
    const union = { ...left, ...right };
    expect(Object.keys(union)).toHaveLength(
      Object.keys(left).length +
        Object.keys(right).length -
        Object.keys(common).length,
    );
    expect(snapshot(root)).toEqual(union);
    const versions = [leftVersion, rightVersion].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const current = query(root, 'design', '--history').contexts[0]!;
    expect(current.concepts.map((c) => c.name)).toEqual([
      'left-only',
      'right-only',
    ]);
    expect(current.concepts).toMatchObject([
      {
        name: 'left-only',
        wording: 'Left branch concept.',
        builtFrom: [],
        reason: 'Left branch reason.',
      },
      {
        name: 'right-only',
        wording: 'Right branch concept.',
        builtFrom: [],
        reason: 'Right branch reason.',
      },
    ]);
    expect(current.retired).toEqual([]);
    expect(current.competing).toMatchObject([
      {
        name: 'reservation',
        versions: versions.map((v) => ({
          wording: v.wording,
          builtFrom: v.builtFrom,
          reason: v.reason,
        })),
      },
    ]);
    const mergedHistory = history(root);
    expect(mergedHistory.versions).toEqual([original, ...versions]);
    for (const version of versions)
      expect(version.supersedes).toEqual([original.id]);
    const reason = 'Both branches agree on eighteen minutes.';
    append(
      root,
      'supersede',
      'reservation',
      '--context',
      'workflow',
      '--wording',
      'A reservation expires after eighteen minutes.',
      '--reason',
      reason,
    );
    unchangedFiles(union, snapshot(root));
    const resolved = query(root, 'design', '--history').contexts[0]!;
    expect(resolved.competing).toEqual([]);
    expect(resolved.concepts.map((c) => c.name)).toEqual([
      'reservation',
      'left-only',
      'right-only',
    ]);
    expect(resolved.concepts[0]).toMatchObject({
      name: 'reservation',
      wording: 'A reservation expires after eighteen minutes.',
      builtFrom: [],
      reason,
    });
    const finalHistory = history(root);
    expect(finalHistory.versions.slice(0, 3)).toEqual(mergedHistory.versions);
    expect(finalHistory.versions).toHaveLength(4);
    expect(finalHistory.versions[3]).toMatchObject({
      kind: 'supersede',
      wording: 'A reservation expires after eighteen minutes.',
      builtFrom: [],
      reason,
    });
    expect([...finalHistory.versions[3]!.supersedes].sort()).toEqual(
      versions.map((v) => v.id).sort(),
    );
  });
});
