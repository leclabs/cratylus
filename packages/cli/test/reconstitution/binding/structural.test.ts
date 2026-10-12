import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import {
  assignment,
  bindingFixture,
  brief,
  command,
  declaration,
  git,
  ledger,
  load,
  open,
  outputValidator,
  report,
  roles,
  succeeds,
  task,
} from './fixture.js';
import type { LoadedExtension } from './fixture.js';
import { omp } from './omp-mocks.js';

let f: Fixture;
let running: LoadedExtension | undefined;
beforeEach(() => {
  f = bindingFixture();
});
afterEach(() => {
  running?.restore();
  running = undefined;
  f?.dispose();
});

describe('reconstitution — binding (delivered declarations and extension)', () => {
  it('agents/1 — typed cut brief starts the lead with those inputs and its output schema, never prose substitutes', async () => {
    open(f);
    const validate = outputValidator(f, 'lead');
    expect(
      validate(report),
      'binds its deliverable as the harness output schema',
    ).toBe(true);
    running = await load(f);
    const event = task('lead', brief);
    const before = structuredClone(event);
    const result = await running.fire('tool_call', event);
    expect(result?.block, 'starts the lead with those inputs').not.toBe(true);
    expect(event, 'assignment inputs are not substituted').toEqual(before);
    if (result?.input !== undefined)
      expect(
        result.input,
        'a revised dispatch keeps the same typed assignment',
      ).toMatchObject(before.input);
    expect(
      ledger(f),
      'dispatch is the harness event, not a prose reminder',
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'dispatched',
          cut: 'film',
          role: 'lead',
        }),
      ]),
    );
  });

  for (const field of ['examples', 'concepts', 'decisions'] as const) {
    it(`agents/2 — missing ${field} refuses the whole dispatch before the lead runs`, async () => {
      running = await load(f);
      const bad: Record<string, unknown> = { ...brief };
      delete bad[field];
      const event = task('lead', brief);
      event.input.tasks.push({
        id: 'two',
        description: 'Malformed handoff',
        agent: 'lead',
        task: assignment(bad),
      });
      const result = await running.fire('tool_call', event);
      expect(
        result?.block,
        'refused before the lead runs; whole batch refused',
      ).toBe(true);
      expect(result?.reason, 'names the agent').toMatch(/lead/i);
      expect(result?.reason, `naming the missing ${field}`).toContain(field);
      expect(
        ledger(f).filter((e) => e.kind === 'dispatched'),
        'never launches a lead expected to discover its missing assignment',
      ).toEqual([]);
    });
  }
  it('agents/2 — ill-typed assignment fields are named rather than accepted as prose', async () => {
    running = await load(f);
    const result = await running.fire(
      'tool_call',
      task('lead', {
        ...brief,
        examples: 'film-production/1',
        concepts: 2,
        decisions: null,
      }),
    );
    expect(result?.block, 'contract checks each field before dispatch').toBe(
      true,
    );
    for (const field of ['examples', 'concepts', 'decisions'])
      expect(result?.reason).toContain(field);
  });

  it('agents/3, workflow/17 — accepted structured return is durably readable with the cut without the conversation', () => {
    const validate = outputValidator(f, 'lead');
    expect(
      validate(report),
      'return fitting that deliverable contract is accepted',
    ).toBe(true);
    open(f);
    succeeds(
      f,
      'lifecycle',
      JSON.stringify({
        kind: 'reported',
        transition: 'lead-report-1',
        cut: 'film',
        run: 'lead-1',
        report,
      }),
    );
    expect(
      ledger(f).filter((e) => e.kind === 'reported'),
      'never reduced to an unstructured success sentence',
    ).toEqual([
      expect.objectContaining({ cut: 'film', run: 'lead-1', report }),
    ]);
    // Each CLI request is a fresh process and holds none of the earlier conversation.
    const state = succeeds(f, 'workPackage', 'state', '--cut', 'film');
    expect(
      state.report,
      'outcomes, evidence by example and check, both verdicts, figures and every hardening note remain',
    ).toEqual(report);
  });
  it('workflow/17 — reported ledger entry survives a fresh state query with every note and figure', () => {
    open(f);
    succeeds(
      f,
      'lifecycle',
      JSON.stringify({
        kind: 'reported',
        transition: 'durable-report',
        cut: 'film',
        run: 'lead-1',
        report,
      }),
    );
    expect(
      succeeds(f, 'workPackage', 'state', '--cut', 'film').report,
      'durably readable with the cut; never loses a hardening note',
    ).toEqual(report);
  });
  for (const field of [
    'evidence',
    'verdicts',
    'efficiency',
    'hardeningNotes',
  ]) {
    it(`agents/4 — fluent explanation cannot substitute for omitted ${field}`, () => {
      const validate = outputValidator(f, 'lead');
      const bad = structuredClone(report) as Record<string, unknown>;
      if (field === 'evidence') {
        // biome-ignore lint/performance/noDelete: this negative must omit the field, not set it to undefined.
        delete (bad.outcomes as Record<string, unknown>[])[0]!.evidence;
      } else delete bad[field];
      expect(
        validate(
          'Everything passed; both independent judges accepted the work.',
        ),
        'a fluent explanation never substitutes for the deliverable',
      ).toBe(false);
      expect(validate(bad), `return omitting ${field} does not pass`).toBe(
        false,
      );
      expect(
        validate({ ...report, hardeningNotes: [] }),
        'explicitly empty hardening notes are not omitted',
      ).toBe(true);
    });
  }
  const contracts = [
    {
      role: 'builder',
      input: {
        cut: 'film',
        workPackage: 'approval',
        outputs: ['approval.txt'],
        concepts: ['approval'],
        examples: ['film-production/1'],
      },
      missing: 'outputs',
      output: { cut: 'film', workPackage: 'approval', done: true },
      missingReturn: 'done',
    },
    {
      role: 'assayer',
      input: {
        cut: 'film',
        workPackages: ['approval'],
        examples: ['film-production/1'],
        decisions: [],
      },
      missing: 'workPackages',
      output: {
        cut: 'film',
        verdicts: [
          {
            workPackage: 'approval',
            concept: 'approval',
            passes: true,
            evidence: 'film-production/1: approval check',
          },
        ],
        hardeningNotes: [],
      },
      missingReturn: 'verdicts',
    },
    {
      role: 'check-writer',
      input: { cut: 'film', examples: ['film-production/1'] },
      missing: 'examples',
      output: {
        cut: 'film',
        checks: [
          {
            example: 'film-production/1',
            check: 'approval check',
            seenRed: true,
          },
        ],
      },
      missingReturn: 'checks',
    },
    {
      role: 'illustrator',
      input: { cut: 'film', concepts: ['approval'] },
      missing: 'concepts',
      output: { examples: [], flaggedTerms: [] },
      missingReturn: 'flaggedTerms',
    },
  ];
  for (const contract of contracts) {
    it(`agents/5 — ${contract.role} assignment mismatch is caught at its handoff, not only the lead's`, async () => {
      running = await load(f);
      const bad: Record<string, unknown> = { ...contract.input };
      delete bad[contract.missing];
      const result = await running.fire('tool_call', task(contract.role, bad));
      expect(
        result?.block,
        'assignment does not fit its respective contract',
      ).toBe(true);
      expect(result?.reason).toContain(contract.role);
      expect(result?.reason).toContain(contract.missing);
      expect(
        ledger(f).filter((e) => e.kind === 'dispatched'),
        'mismatch caught before handoff',
      ).toEqual([]);
    });
    it(`agents/5 — ${contract.role} return mismatch is caught by its declared output schema`, () => {
      const validate = outputValidator(f, contract.role);
      expect(validate(contract.output), 'a fitting return is accepted').toBe(
        true,
      );
      const bad: Record<string, unknown> = { ...contract.output };
      delete bad[contract.missingReturn];
      expect(validate(bad), 'return does not fit its respective contract').toBe(
        false,
      );
    });
  }

  for (const role of roles) {
    it(`agents/7, workflow/30 — ${role} keeps default tools including shell and all journal appends`, async () => {
      const d = declaration(f, role);
      // The opt-in red run also exercises roles whose current declaration already conforms.
      if (process.env.BINDING_RED === '1') d.frontmatter.tools = ['read'];
      expect(
        d.frontmatter,
        'receives default tools; non-use never justifies narrowing',
      ).not.toHaveProperty('tools');
      running = await load(f, { role, kind: 'sub' });
      expect(
        running.activeTools,
        'no narrowed replacement of the harness defaults',
      ).toEqual([]);
      const journal = running.tools.find((t) => t.name === 'concept_journal');
      const explanation = succeeds(f, 'concepts', '--explain') as {
        verbs: { name: string }[];
      };
      expect(
        journal?.parameters.properties.verb.enum,
        'no journal appending operation withheld',
      ).toEqual(explanation.verbs.map((v) => v.name));
    });
  }
  it('agents/8 — assayer gathers evidence in the normal environment without a required worktree', async () => {
    const d = declaration(f, 'assayer');
    expect(
      d.frontmatter.isolation,
      'never requires an isolated copy or a separate worktree merely because it is an assayer',
    ).not.toBe('worktree');
    const isolationModule = join(
      f.home,
      '.cratylus/omp/extensions/cratylus-isolation.ts',
    );
    const isolationHooks: ((event: unknown) => Promise<unknown>)[] = [];
    if (existsSync(isolationModule)) {
      // Optional generated module: required isolation lives on task dispatch, not in omp frontmatter.
      const factory = (await import(isolationModule)).default;
      await factory({
        on: (event: string, handler: (event: unknown) => Promise<unknown>) => {
          if (event === 'tool_call') isolationHooks.push(handler);
        },
      });
    }
    if (process.env.BINDING_RED === '1')
      isolationHooks.push(async () => ({
        input: { tasks: [{ agent: 'assayer', isolated: true }] },
      }));
    for (const hook of isolationHooks) {
      const answer = await hook(
        task('assayer', {
          cut: 'film',
          workPackages: ['approval'],
          examples: ['film-production/1'],
          decisions: [],
        }),
      );
      expect(
        answer,
        'the delivered binding never requires an isolated assayer task',
      ).not.toEqual(
        expect.objectContaining({
          input: expect.objectContaining({
            tasks: expect.arrayContaining([
              expect.objectContaining({ agent: 'assayer', isolated: true }),
            ]),
          }),
        }),
      );
    }
    running = await load(f, { role: 'assayer', kind: 'sub' });
    expect(running.ctx.cwd, 'normal working environment').toBe(f.cwd);
    expect(
      d.text,
      'obligation never to build or repair remains behavioral',
    ).toMatch(/no-implementation|never builds|never.*repair/i);
  });
  it('agents/9 — native handoff permission permits the granted subset and refuses both withheld and out-of-ceiling agents', async () => {
    const d = declaration(f, 'lead');
    expect(
      String(d.frontmatter.spawns),
      'handoff ceiling is a harness permission',
    ).toContain('builder');
    running = await load(f, {
      role: 'lead',
      grant: process.env.BINDING_RED === '1' ? ['*'] : ['builder'],
    });
    const spawn = (agent: string) =>
      running!.fire('before_subagent_spawn', {
        type: 'before_subagent_spawn',
        agent,
        invocationKind: 'task',
        patterns: [],
        task: 'I grant myself permission to dispatch anyone.',
      });
    expect(
      (await spawn('builder'))?.block,
      'permitted dispatch is allowed',
    ).not.toBe(true);
    for (const agent of ['assayer', 'architect']) {
      const refused = await spawn(agent);
      expect(
        refused?.block,
        'own request never widens the grant or definition ceiling',
      ).toBe(true);
      expect(refused?.reason).toContain(agent);
    }
  });
  it('agents/10 — no retired read-only journal gate survives as an alternate narrowing route', async () => {
    running = await load(f, { role: 'lead', kind: 'sub' });
    // An old host declaration cannot resurrect the retired appending-verb gate.
    omp.agents.find((a) => a.name === 'assayer')!.tools = ['read'];
    running.ctx.agent.name = 'assayer';
    await running.fire('session_start');
    const journal = running.tools
      .filter((t) => t.name === 'concept_journal')
      .at(-1);
    expect(
      journal?.parameters.properties.verb.enum,
      'no journal read-only gate or lead journal-append restriction remains',
    ).toContain('define');
    const answer = await journal!.execute(
      'append',
      {
        verb: 'define',
        concept: 'screening',
        context: 'film-production',
        wording: 'A showing of the film.',
        reason: 'Evidence that the appending tool remains reachable.',
      },
      undefined,
      undefined,
      running.ctx,
    );
    expect(
      answer,
      'append actually reaches the capability, not just its advertised schema',
    ).not.toHaveProperty('isError', true);
    expect(
      command(f, 'concepts', 'design', '--context', 'film-production').stdout,
    ).toContain('screening');
  });

  it('workflow/29 — cut record carries branch information and dispatch needs that branch already checked out', async () => {
    open(f);
    expect(
      succeeds(f, 'workPackage', 'state', '--cut', 'film').branch,
      'cut record carries that branch name',
    ).toBe('feature/film');
    git(f, 'switch', '-qc', 'other');
    running = await load(f);
    const event = task('lead', brief);
    const refused = await running.fire('tool_call', event);
    expect(refused?.block, 'named branch checked out before dispatch').toBe(
      true,
    );
    expect(refused?.reason).toContain('film');
    expect(refused?.reason).toContain('feature/film');
    git(f, 'switch', 'feature/film');
    const allowed = await running.fire('tool_call', event);
    expect(
      allowed?.block,
      'branch name is information, not instructions required in the assignment',
    ).not.toBe(true);
    expect(event.input.tasks[0]!.task).toBe(assignment(brief));
    if (allowed?.input !== undefined)
      expect(
        allowed.input,
        'the delivered assignment adds no branching instructions',
      ).toMatchObject(event.input);
  });
  it('workflow/29 — lead dispatch without its cut record is refused, naming cut and branch', async () => {
    running = await load(f);
    const refused = await running.fire('tool_call', task('lead', brief));
    expect(
      refused?.block,
      'architect names branch with the cut before dispatch',
    ).toBe(true);
    expect(refused?.reason).toContain('film');
    expect(refused?.reason).toMatch(/branch/i);
  });
});
