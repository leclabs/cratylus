import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import type { LoadedExtension } from '../../reconstitution/binding/fixture.js';
import {
  admittedCommit,
  allowedChange,
  architect,
  bent,
  checkFolder,
  checkPath,
  clause,
  context,
  covers,
  define,
  examplePath,
  freezeChecks,
  frozenCut,
  heldOutText,
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
  refusedEverywhere,
  routes,
  session,
  settleRefused,
  setup,
  shell,
  snapshot,
  targets,
  workPath,
  working,
  writeThrough,
} from './fixture.js';

let f: Fixture;
let extension: LoadedExtension | undefined;
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
});

// ── The journal refuses before appending ────────────────────────────────────

it('workflow/24 — lead cannot supersede the target while building', async () => {
  f = setup();
  extension = await session(f, 'lead');
  // Actual harness dispatch puts the cut in flight, not a fabricated ledger row.
  await phase(f, extension, 'building');
  await refusedChange(f, 'lead', 'supersede');
});
for (const agent of [...outsiders, undefined, '']) {
  it(`workflow/25 — ${agent === undefined ? 'absent identity' : agent || 'empty identity'} cannot retire renewal`, async () => {
    f = setup();
    extension = await session(f, 'lead');
    await phase(f, extension, 'building');
    await refusedChange(f, agent, 'retire');
  });
}
it('workflow/26 — architect supersedes with reason and retains exact earlier history', async () => {
  f = setup();
  extension = await session(f, 'lead');
  await phase(f, extension, 'building');
  allowedChange(f, architect, 'supersede');
});
it('workflow/27 — architect retires, retaining exact earlier entries', async () => {
  f = setup();
  extension = await session(f, 'lead');
  await phase(f, extension, 'building');
  allowedChange(f, architect, 'retire');
});
for (const verb of ['supersede', 'retire'] as const) {
  it(`workflow/28 — unrelated opening-hours remains admissible: ${verb}`, async () => {
    f = setup();
    extension = await session(f, 'lead');
    await phase(f, extension, 'building');
    define(f, 'library', 'opening-hours', 'The times patrons may enter.');
    allowedChange(f, 'lead', verb, 'library', 'opening-hours');
  });
  it(`workflow/29 — approval is protected only in its own context: ${verb}`, async () => {
    f = setup();
    for (const name of ['film-production', 'museum-loans']) {
      context(f, name);
      define(f, name, 'approval');
    }
    open(f, 'film', 'film-production', 'approval');
    await refusedChange(f, 'lead', verb, 'film-production', 'approval', [
      'film',
    ]);
    allowedChange(f, 'lead', verb, 'museum-loans', 'approval');
    allowedChange(f, architect, verb, 'film-production', 'approval');
  });
  it(`workflow/30 — integration releases the concept, not its append-only history: ${verb}`, () => {
    f = setup();
    ok(integrate(f));
    allowedChange(f, 'lead', verb);
  });
}
it('workflow/34 — architect correction during judgment does not release another agent', async () => {
  f = setup();
  extension = await session(f, 'lead');
  await phase(f, extension, 'judging');
  allowedChange(f, architect, 'supersede');
  await refusedChange(f, 'lead', 'supersede');
  await refusedChange(f, 'assayer', 'retire');
});
for (const verb of ['supersede', 'retire'] as const) {
  it(`workflow/38 — integrating one cut cannot release a shared concept: ${verb}`, () => {
    f = setup();
    open(f, 'renewal-eligibility');
    ok(integrate(f));
    expect(
      query(f, 'workPackage', 'frozen').cuts.map((c: { cut: string }) => c.cut),
    ).toEqual(['renewal-eligibility']);
    return refusedChange(f, 'lead', verb, 'library', 'renewal', [
      'renewal-eligibility',
    ]);
  });
}

// ── The project's history refuses before a commit takes the change in ───────

it('workflow/31 — before any builder starts, every route to the record is refused to the lead', async () => {
  f = setup();
  freezeChecks(f);
  expect(
    query(f, 'workPackage', 'state', '--cut', 'renewal').workPackages,
  ).toEqual([]);
  const frozen = frozenCut(f)!;
  for (const path of [examplePath, heldOutText])
    expect(covers(frozen.examples, path), path).toBe(true);
  for (const path of [checkPath, checkFolder])
    expect(covers(frozen.checks, path), path).toBe(true);
  for (const verb of ['supersede', 'retire'] as const)
    await refusedChange(f, 'lead', verb);
  refusedEverywhere(f, 'lead');
  // An agent the record cannot name is never the architect.
  for (const agent of [undefined, ''])
    for (const path of targets) refusedCommit(f, agent, 'commit', path);
  // Nothing else is frozen: an unrelated file enters the record.
  admittedCommit(f, 'lead', 'commit', notesPath);
});

for (const stage of ['returned', 'judging'] as const) {
  for (const agent of outsiders) {
    it(`workflow/32 — ${agent}, ${stage}: every route to the record is refused`, async () => {
      f = setup();
      extension = await session(f, 'lead');
      await phase(f, extension, stage);
      for (const verb of ['supersede', 'retire'] as const)
        await refusedChange(f, agent, verb);
      refusedEverywhere(f, agent);
      // The work a frozen check imports is the builder's output, never frozen by it.
      if (agent === 'builder') admittedCommit(f, agent, 'commit', workPath);
    });
  }
}

for (const stage of ['finding', 'rebuild'] as const) {
  it(`workflow/33 — ${stage} does not permit bending the target to staff-only work`, async () => {
    f = setup();
    extension = await session(f, 'lead');
    await phase(f, extension, stage);
    await refusedChange(f, 'lead', 'supersede');
    refusedEverywhere(f, 'lead');
  });
}

it('workflow/35 — only the architect corrects the example, and separately its check', async () => {
  f = setup();
  extension = await session(f, 'lead');
  await phase(f, extension, 'judging');
  admittedCommit(
    f,
    architect,
    'commit',
    examplePath,
    '1. (renewal) **Given** an eligible loan, **when** the patron renews, **then** no staff is needed.\n',
  );
  admittedCommit(
    f,
    architect,
    'commit',
    checkPath,
    `${working(f, checkPath)}// corrected by the architect\n`,
  );
  // Leave a last commit that touches neither, so a rebase replays cleanly.
  admittedCommit(f, architect, 'commit', notesPath);
  for (const agent of ['assayer', 'check-writer'])
    for (const path of [examplePath, checkPath])
      for (const route of routes) refusedCommit(f, agent, route, path);
});

for (const kind of ['main', 'sub'] as const) {
  it(`workflow/35 — ${kind}: the architect's session shell commits the correction; a lead's is refused at the commit (workflow/31: its working copy is not)`, async () => {
    const ambient = process.env.CRATYLUS_AGENT;
    Reflect.deleteProperty(process.env, 'CRATYLUS_AGENT');
    try {
      f = setup();
      extension = await session(f, 'lead');
      await phase(f, extension, 'judging');
      extension.restore();
      const commit = `git add -- ${examplePath} && git commit -q -m 'correct the renewal example'`;

      // A lead's session: its write lands in the working copy; its commit is refused.
      const lead = async (round: string) => {
        extension = await session(f, 'lead', kind);
        const bending = bent(examplePath, `lead ${kind} session, ${round}`);
        await writeThrough(f, extension, examplePath, bending);
        expect(working(f, examplePath), 'the working copy holds it').toBe(
          bending,
        );
        const before = refs(f);
        const refused = await shell(f, extension, commit);
        clause('refusal', `lead ${kind} session shell commit, ${round}`, () => {
          const said = refused.stderr + refused.stdout;
          expect(refused.code, `refused at the commit: ${said}`).not.toBe(0);
          expect(refs(f)).toEqual(before);
          for (const name of ['renewal', architect, examplePath])
            expect(said).toContain(name);
          expect(
            working(f, examplePath),
            'a working copy is never refused',
          ).toBe(bending);
        });
        settleRefused(f);
        extension.restore();
      };
      await lead('first');

      extension = await session(f, architect, kind);
      const correction = `1. (renewal) **Given** an eligible loan, **when** the patron renews, **then** no staff is needed (${kind}).\n`;
      await writeThrough(f, extension, examplePath, correction);
      const before = refs(f);
      const admitted = await shell(f, extension, commit);
      clause('admission', `architect ${kind} session shell commit`, () => {
        expect(
          admitted.code,
          `the architect's commit is admitted: ${admitted.stderr}${admitted.stdout}`,
        ).toBe(0);
        expect(refs(f).branch).not.toBe(before.branch);
      });
      if (refs(f).branch === before.branch) settleRefused(f);
      extension.restore();
      // The architect's name never outlives its session in the host.
      await lead('after the architect');
    } finally {
      if (ambient === undefined)
        Reflect.deleteProperty(process.env, 'CRATYLUS_AGENT');
      else process.env.CRATYLUS_AGENT = ambient;
    }
  });
}

it('workflow/36 — both assayers passing and complete phase never substitutes for integration', async () => {
  f = setup();
  extension = await session(f, 'lead');
  await phase(f, extension, 'complete');
  for (const verb of ['supersede', 'retire'] as const)
    await refusedChange(f, 'lead', verb);
  refusedEverywhere(f, 'lead');
});

for (const verb of ['supersede', 'retire'] as const) {
  it(`workflow/37 — integration releases examples and checks to every route; ${verb} still appends`, async () => {
    f = setup();
    extension = await session(f, 'lead');
    await phase(f, extension, 'complete');
    const history = snapshot(f.cwd);
    ok(integrate(f));
    expect(snapshot(f.cwd)).toEqual(history);
    expect(query(f, 'workPackage', 'frozen').cuts).toEqual([]);
    allowedChange(f, 'lead', verb);
    for (const path of targets) admittedCommit(f, 'lead', 'commit', path);
    for (const route of routes) {
      // A rebase replays the last commit; keep it clear of the path.
      if (route === 'rebase') admittedCommit(f, 'lead', 'commit', notesPath);
      // The folder deleted by the route before, brought back to be moved.
      if (route === 'move folder')
        admittedCommit(
          f,
          'lead',
          'commit',
          examplePath,
          bent(examplePath, 'back'),
        );
      admittedCommit(f, 'lead', route, examplePath, bent(examplePath, route));
    }
    expect(query(f, 'workPackage', 'state', '--cut', 'renewal').cut).toBe(
      'renewal',
    );
  });
}

// ── Interface obligations kept from the first build ─────────────────────────

for (const kind of ['main', 'sub'] as const) {
  for (const agent of ['lead', architect]) {
    it(`F1/F6 — ${kind} ${agent} identity reaches the delivered concept capability`, async () => {
      f = setup();
      extension = await session(f, agent, kind);
      const tool = extension.tools.find((t) => t.name === 'concept_journal');
      expect(tool).toBeDefined();
      const before = snapshot(f.cwd);
      const result = await tool!.execute(
        'supersede',
        {
          verb: 'supersede',
          concept: 'renewal',
          context: 'library',
          wording: 'Patrons renew eligible loans unaided.',
          reason: 'Eligibility clarified.',
        },
        undefined,
        undefined,
        extension.ctx,
      );
      if (agent === architect) {
        expect(result).not.toHaveProperty('isError', true);
        expect(Object.keys(snapshot(f.cwd))).toHaveLength(
          Object.keys(before).length + 1,
        );
      } else {
        expect(result).toHaveProperty('isError', true);
        expect(snapshot(f.cwd)).toEqual(before);
        expect(JSON.stringify(result)).toContain('renewal');
        expect(JSON.stringify(result)).toContain(architect);
      }
    });
  }
}
it('F4 — lead cannot integrate or grant itself the architect exception', () => {
  f = setup();
  const before = query(f, 'workPackage', 'state', '--cut', 'renewal');
  const result = integrate(f, 'renewal', 'lead');
  expect(result.code).toBe(1);
  expect(result.stderr + result.stdout).toContain(architect);
  expect(query(f, 'workPackage', 'state', '--cut', 'renewal')).toEqual(before);
});
