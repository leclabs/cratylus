// workflow/checks examples 1–5 (decisions 0149, 0155, 0156).
// Deterministic readings only: fixtures record events without starting agents.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dispatchConcepts } from '../../src/capabilities/concepts/index.js';
import type { ContextOverview } from '../../src/capabilities/concepts/overview.js';
import {
  cutView,
  cutsInLedger,
  dispatchWorkPackage,
} from '../../src/capabilities/work-package/index.js';
import {
  LEDGER_DIR,
  type LedgerDraft,
  ledgerAt,
} from '../../src/capabilities/work-package/ledger.js';
import { repository } from '../verb-surface.js';

/** Drafts stamped only by the scratch ledger, never by a harness. */
type Event = LedgerDraft extends infer D
  ? D extends LedgerDraft
    ? Omit<D, 'cut' | 'transition'>
    : never
  : never;

function fixture(repo: string, cut = 'film') {
  const examples = join(repo, 'design/examples/workflow');
  mkdirSync(examples, { recursive: true });
  writeFileSync(
    join(examples, `${cut}.md`),
    '1. (ledger) Given a cut, when its state is read, then its record governs.\n',
  );
  const ledger = ledgerAt(repo, (message) => new Error(message));
  let transition = 0;
  const append = (...events: Event[]) => {
    for (const event of events)
      ledger.append({ ...event, cut, transition: `${cut}:${transition++}` });
  };
  append({
    kind: 'cut',
    branch: `feature/${cut}`,
    contexts: ['workflow'],
    architects: { workflow: 'architect' },
  });
  return {
    append,
    read: () => dispatchWorkPackage(['state', '--cut', cut], { from: repo }),
  };
}

const submit = (workPackage: string): Event => ({
  kind: 'submit',
  workPackage,
  outputs: [`${workPackage}/`],
  concepts: ['ledger'],
  dependsOn: [],
  needs: [],
});
const builder = (
  kind: 'dispatched' | 'returned',
  workPackage: string,
): Event => ({ kind, workPackage, role: 'builder', run: workPackage });
const verdict = (assayer: string, results: Record<string, boolean>): Event => ({
  kind: 'verdict',
  assayer,
  run: assayer,
  verdicts: Object.entries(results).map(([workPackage, passes]) => ({
    workPackage,
    concept: 'ledger',
    passes,
    evidence: 'deterministic fixture',
    ...(passes ? {} : { finding: 'not satisfied' }),
  })),
  hardeningNotes: [],
});

/** Compare both filenames and raw bytes, including records the reader ignores. */
function ledgerBytes(repo: string): Record<string, Buffer> {
  const dir = join(repo, LEDGER_DIR);
  return Object.fromEntries(
    readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .sort()
      .map((path) => [path.slice(dir.length + 1), readFileSync(path)]),
  );
}

// Resolve from this source file, not the runner's working directory. This is
// intentionally the real repository ledger; no fixture replaces or repairs it.
const project = fileURLToPath(new URL('../../../../', import.meta.url));

describe('workflow/checks — integration governs the ledger reading', () => {
  it('workflow/1: integration without work-package history is integrated, not open', () => {
    const repo = repository();
    const cut = fixture(repo);
    cut.append({ kind: 'integrate', agent: 'architect' });
    expect(cut.read()).toMatchObject({
      integrated: true,
      phase: 'integrated',
      workPackages: [],
    });
    expect(cutView(repo, 'film').state.phase).toBe('integrated');
  });

  it('workflow/2: integration preserves dispatched, returned and unapproved statuses', () => {
    const repo = repository();
    const cut = fixture(repo);
    cut.append(
      submit('shoot'),
      submit('edit'),
      submit('release'),
      builder('dispatched', 'shoot'),
      builder('dispatched', 'edit'),
      builder('returned', 'edit'),
      builder('dispatched', 'release'),
      builder('returned', 'release'),
      verdict('a', { release: true }),
      verdict('b', { release: false }),
    );
    // Disputed is a concrete unapproved status, not a new status called
    // "unapproved". Integration must preserve it just like the builder events.
    const workPackages = [
      { name: 'shoot', status: 'dispatched', dependsOn: [] },
      { name: 'edit', status: 'returned', dependsOn: [] },
      { name: 'release', status: 'disputed', dependsOn: [] },
    ];
    expect(cut.read()).toMatchObject({ phase: 'in flight', workPackages });
    cut.append({ kind: 'integrate', agent: 'architect' });
    expect(cut.read()).toMatchObject({
      phase: 'integrated',
      integrated: true,
      workPackages,
    });
    expect(
      [...cutView(repo, 'film').state.packages.values()].map((p) => p.status),
    ).toEqual(['dispatched', 'returned', 'disputed']);
  });

  it('workflow/3: without integration, approved is complete, undispatched is open, and unfinished is in flight', () => {
    const repo = repository();
    const open = fixture(repo, 'unstarted');
    const active = fixture(repo, 'building');
    const complete = fixture(repo, 'approved');
    open.append(submit('shoot'));
    active.append(submit('shoot'), builder('dispatched', 'shoot'));
    complete.append(
      submit('shoot'),
      submit('edit'),
      builder('dispatched', 'shoot'),
      builder('returned', 'shoot'),
      builder('dispatched', 'edit'),
      builder('returned', 'edit'),
      verdict('a', { shoot: true, edit: true }),
      verdict('b', { shoot: true, edit: true }),
    );
    expect.soft(complete.read()).toMatchObject({
      phase: 'complete',
      integrated: false,
      workPackages: [
        { name: 'shoot', status: 'approved' },
        { name: 'edit', status: 'approved' },
      ],
    });
    expect
      .soft(open.read())
      .toMatchObject({ phase: 'open', integrated: false });
    expect.soft(active.read()).toMatchObject({
      phase: 'in flight',
      integrated: false,
      workPackages: [{ name: 'shoot', status: 'dispatched' }],
    });

    // The same approved work is integrated only after that act is recorded.
    complete.append({ kind: 'integrate', agent: 'architect' });
    expect(complete.read()).toMatchObject({
      phase: 'integrated',
      integrated: true,
      workPackages: [
        { name: 'shoot', status: 'approved' },
        { name: 'edit', status: 'approved' },
      ],
    });
  });

  it('workflow/4: the overview and cuts in flight omit integrated unfinished work', () => {
    const repo = repository();
    dispatchConcepts(
      ['context', 'workflow', '--subject', 'Cuts and their work.'],
      { from: repo },
    );
    const integrated = fixture(repo, 'delivered');
    const active = fixture(repo, 'building');
    for (const cut of [integrated, active])
      cut.append(submit('shoot'), builder('dispatched', 'shoot'));
    integrated.append({ kind: 'integrate', agent: 'architect' });

    const { contexts } = dispatchConcepts(
      ['overview', '--context', 'workflow'],
      { from: repo },
    ) as { contexts: ContextOverview[] };
    expect(contexts).toHaveLength(1);
    const overview = contexts[0] as ContextOverview;
    expect
      .soft(overview.cutsInFlight)
      .toEqual([
        { cut: 'building', phase: 'in flight', branch: 'feature/building' },
      ]);
    expect.soft(overview.account).toContain('the cut building');
    expect.soft(overview.account).not.toContain('delivered');
    expect
      .soft(cutsInLedger(repo).cuts.filter((cut) => cut.phase === 'in flight'))
      .toEqual([
        {
          cut: 'building',
          branch: 'feature/building',
          contexts: ['workflow'],
          phase: 'in flight',
        },
      ]);
  });

  it('workflow/5: every recorded integration reads integrated twice without changing the repository ledger', () => {
    const before = ledgerBytes(project);
    const integrations = [
      ...new Set(
        Object.values(before)
          .map((bytes) => JSON.parse(bytes.toString('utf8')))
          .filter((entry) => entry.kind === 'integrate')
          .map((entry) => entry.cut as string),
      ),
    ];
    expect(
      integrations.length,
      'the real ledger must contain integrations',
    ).toBeGreaterThan(0);
    for (const reading of [1, 2]) {
      try {
        for (const cut of integrations) {
          expect
            .soft(
              dispatchWorkPackage(['state', '--cut', cut], { from: project }),
              `${cut}, reading ${reading}`,
            )
            .toMatchObject({ cut, integrated: true, phase: 'integrated' });
          expect
            .soft(
              cutView(project, cut).state.phase,
              `${cut}, library reading ${reading}`,
            )
            .toBe('integrated');
        }
      } finally {
        expect(
          ledgerBytes(project),
          `ledger bytes after reading ${reading}`,
        ).toEqual(before);
      }
    }
  });
});
