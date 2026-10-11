import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import type { LoadedExtension } from '../../reconstitution/binding/fixture.js';
import {
  allowedChange,
  architect,
  assertGate,
  checkFolder,
  checkPath,
  context,
  define,
  editPath,
  examplePath,
  freezeChecks,
  integrate,
  ok,
  open,
  outsiders,
  paths,
  phase,
  query,
  refusedChange,
  session,
  setup,
  snapshot,
} from './fixture.js';

let f: Fixture;
let extension: LoadedExtension | undefined;
afterEach(() => {
  extension?.restore();
  extension = undefined;
  f?.dispose();
});

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

it('workflow/31 — open immediately freezes named concepts, examples and registered checks before dispatch', async () => {
  f = setup();
  freezeChecks(f);
  const state = query(f, 'workPackage', 'state', '--cut', 'renewal');
  expect(state.workPackages).toEqual([]);
  const frozen = query(f, 'workPackage', 'frozen');
  expect(frozen).toMatchObject({
    cuts: [
      {
        cut: 'renewal',
        architects: { library: architect },
        examples: expect.arrayContaining([examplePath]),
        checks: expect.arrayContaining([checkPath, checkFolder]),
        concepts: [{ context: 'library', name: 'renewal' }],
      },
    ],
  });
  extension = await session(f, 'lead');
  for (const path of paths) await editPath(f, extension, path, true);
  for (const verb of ['supersede', 'retire'] as const)
    await refusedChange(f, 'lead', verb);
});

for (const kind of ['main', 'sub'] as const) {
  for (const stage of ['returned', 'judging'] as const) {
    for (const agent of outsiders) {
      it(`workflow/32 — ${kind} ${agent}, ${stage}: every target stays frozen`, async () => {
        f = setup();
        freezeChecks(f);
        extension = await session(f, 'lead');
        await phase(f, extension, stage);
        extension.restore();
        extension = await session(f, agent, kind);
        await editPath(f, extension, examplePath, true);
        await editPath(f, extension, checkPath, true);
        for (const verb of ['supersede', 'retire'] as const)
          await refusedChange(f, agent, verb);
      });
    }
  }
}
for (const stage of ['finding', 'rebuild'] as const) {
  it(`workflow/33 — ${stage} does not permit bending target to staff-only work`, async () => {
    f = setup();
    freezeChecks(f);
    extension = await session(f, 'lead');
    await phase(f, extension, stage);
    await refusedChange(f, 'lead', 'supersede');
    await editPath(f, extension, examplePath, true);
    await editPath(f, extension, checkPath, true);
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
for (const kind of ['main', 'sub'] as const) {
  it(`workflow/35 — ${kind}: only architect may correct each example and each check`, async () => {
    f = setup();
    freezeChecks(f);
    extension = await session(f, 'lead');
    await phase(f, extension, 'judging');
    extension.restore();
    extension = await session(f, architect, kind);
    for (const path of paths) await editPath(f, extension, path, false);
    extension.restore();
    for (const agent of ['assayer', 'check-writer']) {
      extension = await session(f, agent, kind);
      for (const path of paths) await editPath(f, extension, path, true);
      extension.restore();
    }
  });
}
it('workflow/36 — both assayers passing and complete phase never substitutes for integration', async () => {
  f = setup();
  freezeChecks(f);
  extension = await session(f, 'lead');
  await phase(f, extension, 'complete');
  await editPath(f, extension, examplePath, true);
  await editPath(f, extension, checkPath, true);
  await refusedChange(f, 'lead', 'supersede');
  await refusedChange(f, 'lead', 'retire');
});
for (const verb of ['supersede', 'retire'] as const) {
  it(`workflow/37 — integration releases examples and checks; ${verb} still appends`, async () => {
    f = setup();
    freezeChecks(f);
    const history = snapshot(f.cwd);
    ok(integrate(f));
    expect(snapshot(f.cwd)).toEqual(history);
    expect(query(f, 'workPackage', 'frozen').cuts).toEqual([]);
    extension = await session(f, 'lead');
    for (const path of paths) await editPath(f, extension, path, false);
    allowedChange(f, 'lead', verb);
    expect(query(f, 'workPackage', 'state', '--cut', 'renewal').cut).toBe(
      'renewal',
    );
  });
  it(`workflow/38 — integrating one cut cannot release a shared concept: ${verb}`, async () => {
    f = setup();
    open(f, 'renewal-eligibility');
    ok(integrate(f));
    expect(
      query(f, 'workPackage', 'frozen').cuts.map((c: { cut: string }) => c.cut),
    ).toEqual(['renewal-eligibility']);
    await refusedChange(f, 'lead', verb, 'library', 'renewal', [
      'renewal-eligibility',
    ]);
  });
}

// Interface obligations: do not let a passing journal check hide missing delivery wiring.
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
it('F7 — a shell route cannot change an approved example', async () => {
  f = setup();
  extension = await session(f, 'lead');
  await editPath(f, extension, examplePath, true, 'bash');
});
for (const kind of ['main', 'sub'] as const) {
  it(`workflow/31 — ${kind}: approval alone freezes the example before a builder starts`, async () => {
    f = setup();
    extension = await session(f, 'lead', kind);
    await editPath(f, extension, examplePath, true);
  });
}
it('F7 — a shell call cannot impersonate the architect', async () => {
  f = setup();
  extension = await session(f, 'lead');
  const before = snapshot(f.cwd);
  const answer = await extension.fire('tool_call', {
    type: 'tool_call',
    toolName: 'bash',
    toolCallId: 'spoof',
    input: {
      command:
        'CRATYLUS_AGENT=architect cratylus concepts retire renewal --context library --reason spoof',
    },
  });
  assertGate(answer, true);
  expect(snapshot(f.cwd)).toEqual(before);
});
