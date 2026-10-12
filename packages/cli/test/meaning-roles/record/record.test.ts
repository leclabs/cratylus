import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import {
  type LoadedExtension,
  task,
} from '../../reconstitution/binding/fixture.js';
import {
  admittedCommit,
  allowedChange,
  architect,
  attempt,
  bent,
  checkPath,
  clause,
  examplePath,
  fileRoutes,
  freezeChecks,
  integrate,
  notesPath,
  ok,
  open,
  outsiders,
  phase,
  query,
  refs,
  refusedChange,
  refusedCommit,
  session,
  settleRefused,
  supportPath,
  typesPath,
  usedPath,
  workPath,
  working,
  write,
} from '../freeze/fixture.js';
import {
  admittedDefine,
  admittedPush,
  admittedWidening,
  arm,
  assertRefusedUpdate,
  cloneOf,
  defineAs,
  deleteEntry,
  deletions,
  dropImport,
  frozenView,
  given,
  linkedTree,
  record,
  recordSetup,
  recordedEntries,
  refusedDefine,
  refusedPush,
  refusedWidening,
  retag,
  tip,
  unreadableLedger,
  workPackage,
} from './fixture.js';

let f: Fixture;
let extension: LoadedExtension | undefined;
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
});

// The stages 31, 32, 33 and 36 name, each reached by the harness's own
// dispatch, return and verdict events (the frozen fixture's `phase`).
const stages = [
  ['workflow/31', 'before any builder'],
  ['workflow/32', 'returned'],
  ['workflow/33', 'finding'],
  ['workflow/36', 'complete'],
] as const;
async function reach(stage: (typeof stages)[number][1]) {
  if (stage === 'before any builder') freezeChecks(f);
  else {
    extension = await session(f, 'lead');
    await phase(f, extension, stage);
  }
  record(f);
}

// ── Fix 1: what is frozen is read from the branch's recorded tip ────────────

for (const [example, stage] of stages) {
  it(`workflow/24, workflow/25, ${example} — fix 1, ${stage}: an uncommitted retag of the example does not release renewal to the journal`, async () => {
    f = recordSetup();
    await reach(stage);
    retag(f);
    arm(f);
    for (const agent of outsiders) {
      await refusedChange(f, agent, 'supersede');
      await refusedChange(f, agent, 'retire');
    }
    allowedChange(f, architect, 'supersede');
  });
  it(`${example} — fix 1, ${stage}: an uncommitted removal of a check's import does not let a commit of the file it used into the history`, async () => {
    f = recordSetup();
    await reach(stage);
    arm(f);
    for (const agent of outsiders)
      for (const path of [supportPath, usedPath]) {
        // Settling a refused attempt restores tracked files; drop it afresh.
        dropImport(f);
        refusedCommit(f, agent, 'commit', path);
      }
    dropImport(f);
    admittedCommit(f, architect, 'commit', supportPath);
  });
}

it("workflow/38 — fix 1: an uncommitted retag of the remaining cut's example does not release the shared concept", async () => {
  f = recordSetup();
  open(f, 'renewal-eligibility');
  ok(integrate(f));
  record(f, 'design/examples/library/renewal-eligibility.md');
  retag(f, 'design/examples/library/renewal-eligibility.md');
  arm(f);
  for (const verb of ['supersede', 'retire'] as const)
    await refusedChange(f, 'lead', verb, 'library', 'renewal', [
      'renewal-eligibility',
    ]);
  allowedChange(f, architect, 'supersede');
});

// The dispatch rule: a builder is not dispatched while a visible example its
// package owns is among the cut's unchecked, read from the recorded tip.
const second =
  "2. (renewal) **Given** a patron's loan another patron has reserved, **when** they renew, **then** the kiosk says why it cannot, with no staff involved.\n";
const mention = () => `${working(f, checkPath)}// Binds library/2.\n`;
const builder = {
  cut: 'renewal',
  workPackage: 'renewal-work',
  outputs: [workPath],
  concepts: ['renewal'],
  examples: ['library/1', 'library/2'],
};
function twoExamples() {
  f = recordSetup();
  write(f, examplePath, `${working(f, examplePath)}${second}`);
  freezeChecks(f);
  ok(workPackage(f, 'lead', 'submit', 'renewal-work', [workPath]));
  record(f, examplePath);
}
it("workflow/31 — fix 1: a frozen check's working-copy mention of an example leaves it unchecked, and its builder undispatched", async () => {
  twoExamples();
  write(f, checkPath, mention());
  arm(f);
  extension = await session(f, 'lead');
  clause(
    'refusal',
    'library/2 unchecked despite the working-copy mention',
    () => expect(frozenView(f).unchecked).toContain('library/2'),
  );
  await clause(
    'refusal',
    'builder owning library/2 not dispatched',
    async () => {
      const answer = await extension!.fire(
        'tool_call',
        task('builder', builder, 'build'),
      );
      expect(answer?.block, 'the builder was dispatched').toBe(true);
      expect(answer?.reason).toContain('library/2');
    },
  );
});
it('workflow/31 — fix 1: once the architect records the mention, the example is checked and its builder dispatched', async () => {
  twoExamples();
  arm(f);
  admittedCommit(f, architect, 'commit', checkPath, mention());
  extension = await session(f, 'lead');
  clause('admission', 'library/2 checked once recorded', () =>
    expect(frozenView(f).unchecked).not.toContain('library/2'),
  );
  await clause('admission', 'builder owning library/2 dispatched', async () => {
    const answer = await extension!.fire(
      'tool_call',
      task('builder', builder, 'build'),
    );
    expect(answer?.block, answer?.reason).not.toBe(true);
  });
});

// ── Fix 2: the ledger's outputs, and the journal's define ───────────────────

function frozenWork() {
  f = recordSetup();
  freezeChecks(f);
  ok(workPackage(f, 'lead', 'submit', 'renewal-work', [workPath]));
  record(f);
}
it("workflow/31, workflow/32 — fix 2: widening a package's outputs onto a file a frozen check uses is refused while the cut is frozen", () => {
  frozenWork();
  arm(f);
  refusedWidening(f, 'lead', 'submit', 'patron-work', [usedPath], usedPath, [
    usedPath,
  ]);
  refusedWidening(f, 'lead', 'submit', 'lib-work', ['lib/'], usedPath, [
    'lib/',
    usedPath,
  ]);
  refusedWidening(
    f,
    'lead',
    'update',
    'renewal-work',
    [workPath, supportPath],
    supportPath,
    [supportPath],
  );
  refusedWidening(
    f,
    'lead',
    'update',
    'renewal-work',
    [workPath, typesPath],
    typesPath,
    [typesPath],
  );
});
it('workflow/31, workflow/32 — fix 2: outputs clear of the frozen files are admitted, and any once the cut is integrated', () => {
  frozenWork();
  arm(f);
  admittedWidening(f, 'lead', 'submit', 'other-work', ['src/other.ts']);
  admittedWidening(f, 'lead', 'update', 'renewal-work', [
    workPath,
    'src/extra.ts',
  ]);
  ok(integrate(f));
  record(f);
  admittedWidening(f, 'lead', 'update', 'renewal-work', [workPath, usedPath]);
});

/** Concepts the cut's example names that the journal lacks, one per agent
 *  tried, so one admitted definition never stands in for another's refusal. */
const absent = ['fines', 'holds', 'waivers', 'notices', 'limits'];
/** The cut's example names `absent` beside renewal; recorded. */
function absentNamed() {
  f = recordSetup();
  write(
    f,
    examplePath,
    working(f, examplePath)!.replace(
      '(renewal)',
      `(renewal, ${absent.join(', ')})`,
    ),
  );
  freezeChecks(f);
  record(f, examplePath);
}
it("workflow/24, workflow/31 — fix 2: defining a concept the frozen cut's examples name consults the freeze", async () => {
  absentNamed();
  arm(f);
  for (const [i, agent] of outsiders.entries())
    await refusedDefine(f, agent, absent[i]!, [
      absent[i]!,
      architect,
      'renewal',
    ]);
  admittedDefine(f, 'lead', 'loans');
  admittedDefine(f, architect, 'fines');
});
it('workflow/24, workflow/31 — fix 2: where the freeze cannot be read, defining a concept the cut names is refused', async () => {
  absentNamed();
  arm(f);
  admittedDefine(f, 'lead', 'loans');
  unreadableLedger(f);
  await refusedDefine(f, 'lead', 'fines', ['fines'], ', freeze unread');
  await refusedDefine(f, architect, 'holds', ['holds'], ', freeze unread');
});

// ── Fix 3: the history refuses a change or deletion of a journal entry ──────

it('workflow/24, workflow/25 — fix 3: a branch update changing or deleting a recorded journal entry is refused, architect included; appending stays admitted', () => {
  f = recordSetup();
  // Renewal's history: its definition and a supersession for each deletion
  // tried, all recorded.
  for (const n of [1, 2, 3, 4, 5, 6])
    query(
      f,
      'concepts',
      'supersede',
      'renewal',
      '--context',
      'library',
      '--wording',
      `A patron renews unaided (version ${n + 1}).`,
      '--reason',
      'Given.',
    );
  record(f, 'design/journal');
  const renewal = recordedEntries(f).filter(([, e]) => e.name === 'renewal');
  expect(renewal.map(([, e]) => e.kind)).toEqual([
    'define',
    ...Array(6).fill('supersede'),
  ]);
  const [defined, definition] = renewal[0]!;
  const superseded = renewal.slice(1).map(([path]) => path);
  // New entries, appended by the journal and not yet recorded.
  ok(defineAs(f, 'lead', 'loans'));
  ok(defineAs(f, architect, 'fees'));
  const appended = (name: string) =>
    `design/journal/${query(f, 'concepts', 'history', name, '--context', 'library').versions[0].id}.json`;
  const loans = appended('loans');
  const fees = appended('fees');
  arm(f);
  const id = (path: string) =>
    path.slice('design/journal/'.length, -'.json'.length);
  for (const agent of ['lead', architect])
    for (const route of fileRoutes) {
      // A rebase replays the branch's last commit; keep it clear of the entry.
      if (route === 'rebase') {
        write(f, notesPath, `Notes before ${agent}'s rebase.\n`);
        given(f, ['add', '--', notesPath]);
        given(f, ['commit', '-q', '-m', 'test: notes']);
      }
      const before = refs(f);
      try {
        clause('refusal', `${agent} ${route} rewrites ${defined}`, () => {
          const text = `${JSON.stringify({ ...definition, reason: `Rewritten in place (${agent} ${route}).` }, null, 2)}\n`;
          const result = attempt(f, agent, route, defined, text);
          assertRefusedUpdate(result, before, refs(f), route, [id(defined)]);
        });
      } finally {
        settleRefused(f);
      }
    }
  for (const agent of ['builder', undefined]) {
    const before = refs(f);
    try {
      clause('refusal', `${agent} commit rewrites ${defined}`, () => {
        const result = attempt(
          f,
          agent,
          'commit',
          defined,
          `{"rewritten": "${agent}"}\n`,
        );
        assertRefusedUpdate(result, before, refs(f), 'commit', [id(defined)]);
      });
    } finally {
      settleRefused(f);
    }
  }
  const tries = ['lead', architect].flatMap((agent) =>
    deletions.map((route) => [agent, route] as const),
  );
  tries.forEach(([agent, route], i) => {
    const path = superseded[i]!;
    const before = refs(f);
    try {
      clause('refusal', `${agent} ${route} deletes ${path}`, () => {
        const result = deleteEntry(f, agent, route, path);
        assertRefusedUpdate(result, before, refs(f), route, [id(path)]);
      });
    } finally {
      settleRefused(f);
    }
  });
  admittedCommit(f, 'lead', 'commit', loans, working(f, loans)!);
  admittedCommit(f, architect, 'commit --amend', fees, working(f, fees)!);
  clause('admission', 'the appended entries are both recorded', () => {
    for (const path of [loans, fees, defined, ...superseded])
      expect(given(f, ['cat-file', '-t', `${tip(f)}:${path}`])).toBe('blob');
  });
});

// ── Fix 4: every work tree of the repository, and pushes into it ────────────

function frozenRecorded() {
  f = recordSetup();
  freezeChecks(f);
  record(f);
}
it('workflow/31 — fix 4: in a linked work tree, a commit changing the frozen example is refused', () => {
  frozenRecorded();
  const linked = linkedTree(f);
  arm(f);
  for (const route of [
    'commit',
    'commit --no-verify',
    'commit --amend',
  ] as const)
    refusedCommit(linked, 'lead', route, examplePath);
  for (const agent of outsiders)
    refusedCommit(linked, agent, 'commit', examplePath);
  admittedCommit(linked, 'lead', 'commit', notesPath);
  admittedCommit(linked, architect, 'commit', examplePath);
});
it('workflow/31, workflow/32 — fix 1, fix 4: in a linked work tree, the freeze is read from the record', () => {
  frozenRecorded();
  const linked = linkedTree(f);
  arm(f);
  for (const agent of ['lead', 'builder'])
    for (const path of [supportPath, usedPath]) {
      dropImport(linked);
      refusedCommit(linked, agent, 'commit', path);
    }
});
it('workflow/31 — fix 4: in a linked work tree, where the freeze cannot be read, every branch update is refused', () => {
  frozenRecorded();
  unreadableLedger(f);
  const linked = linkedTree(f);
  arm(f);
  for (const agent of ['lead', architect]) {
    const before = refs(linked);
    try {
      clause(
        'refusal',
        `${agent} commit ${notesPath} in a linked work tree, freeze unread`,
        () => {
          const result = attempt(
            linked,
            agent,
            'commit',
            notesPath,
            `Notes by ${agent}.\n`,
          );
          assertRefusedUpdate(result, before, refs(linked), 'commit', []);
        },
      );
    } finally {
      settleRefused(linked);
    }
  }
});
it('workflow/31 — fix 4: a push into the repository changing the frozen example is refused', () => {
  frozenRecorded();
  const clone = cloneOf(f);
  arm(f);
  for (const agent of outsiders)
    refusedPush(
      f,
      clone,
      agent,
      examplePath,
      bent(examplePath, `${agent} push`),
      ['renewal', architect, examplePath],
    );
  admittedPush(f, clone, 'lead', notesPath, 'Notes pushed by the lead.\n');
  admittedPush(
    f,
    clone,
    architect,
    examplePath,
    bent(examplePath, 'architect push'),
  );
});
it('workflow/31 — fix 4: where the freeze cannot be read, a push into the repository is refused', () => {
  frozenRecorded();
  unreadableLedger(f);
  const clone = cloneOf(f);
  arm(f);
  for (const agent of ['lead', architect])
    refusedPush(f, clone, agent, notesPath, `Notes pushed by ${agent}.\n`, []);
});
