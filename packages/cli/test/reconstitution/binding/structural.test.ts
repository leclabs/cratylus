import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import {
  assignment,
  bindingFixture,
  command,
  declaration,
  load,
  outcome,
  outputValidator,
  roles,
  story,
  succeeds,
  task,
} from './fixture.js';
import type { LoadedExtension } from './fixture.js';
import { omp } from './omp-mocks.js';

/** Every warning `running` showed, as one text. */
const warnings = (running: LoadedExtension): string =>
  running.notices
    .filter((n) => n.level === 'warning')
    .map((n) => n.text)
    .join('\n');

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
  it('agents/1 — a typed story starts the lead with those inputs and its output schema, never prose substitutes', async () => {
    const validate = outputValidator(f, 'lead');
    expect(
      validate(outcome),
      'binds its deliverable as the harness output schema',
    ).toBe(true);
    running = await load(f);
    const event = task('lead', story);
    const before = structuredClone(event);
    const result = await running.fire('tool_call', event);
    expect(result?.block, 'starts the lead with those inputs').not.toBe(true);
    expect(event, 'assignment inputs are not substituted').toEqual(before);
    expect(event.input.tasks[0]!.task).toBe(assignment(story));
    if (result?.input !== undefined)
      expect(
        result.input,
        'a revised dispatch keeps the same typed assignment',
      ).toMatchObject(before.input);
  });

  for (const field of [
    'story',
    'slice',
    'why',
    'acceptanceCriteria',
    'outOfScope',
    'path',
    'review',
    'cost',
  ] as const) {
    it(`agents/2 — a story missing ${field} is warned, naming it, and the lead is dispatched`, async () => {
      running = await load(f);
      const bad: Record<string, unknown> = { ...story };
      delete bad[field];
      const event = task('lead', story);
      event.input.tasks.push({
        id: 'two',
        description: 'Malformed handover',
        agent: 'lead',
        task: assignment(bad),
      });
      const result = await running.fire('tool_call', event);
      expect(result?.block, 'the dispatch is never refused').not.toBe(true);
      expect(warnings(running), 'names the agent').toMatch(/lead/i);
      expect(warnings(running), `naming the missing ${field}`).toContain(field);
    });
  }
  it('agents/2 — ill-typed story fields are named in a warning rather than accepted silently', async () => {
    running = await load(f);
    const result = await running.fire(
      'tool_call',
      task('lead', {
        ...story,
        acceptanceCriteria: 'the approval is recorded',
        why: 2,
        outOfScope: null,
      }),
    );
    expect(result?.block, 'the dispatch is never refused').not.toBe(true);
    for (const field of ['acceptanceCriteria', 'why', 'outOfScope'])
      expect(warnings(running)).toContain(field);
  });
  it('agents/2 — a complete story is shown without a warning', async () => {
    running = await load(f);
    await running.fire('tool_call', task('lead', story));
    expect(warnings(running)).toBe('');
  });

  for (const field of [
    'evidence',
    'criteria',
    'meaningQuestions',
    'followUps',
    'cost',
  ]) {
    it(`agents/4 — fluent explanation cannot substitute for an outcome omitting ${field}`, () => {
      const validate = outputValidator(f, 'lead');
      const bad = structuredClone(outcome) as Record<string, unknown>;
      if (field === 'evidence') {
        // biome-ignore lint/performance/noDelete: this negative must omit the field, not set it to undefined.
        delete (bad.criteria as Record<string, unknown>[])[0]!.evidence;
      } else delete bad[field];
      expect(
        validate('Every criterion holds; the reviewer approved the work.'),
        'a fluent explanation never substitutes for the deliverable',
      ).toBe(false);
      expect(validate(bad), `return omitting ${field} does not pass`).toBe(
        false,
      );
      expect(
        validate({ ...outcome, followUps: [] }),
        'explicitly empty follow-ups are not omitted',
      ).toBe(true);
    });
  }
  const contracts = [
    {
      role: 'builder',
      input: {
        task: 'record-approval',
        story: 'film',
        goal: "The creative's approval of a finished film is recorded.",
        changes: 'Records the approval when the creative approves.',
        decisions: [],
        done: 'film-production/1 holds and every check passes.',
      },
      missing: 'goal',
      output: {
        change: 'Records the approval when the creative approves.',
        tests: 'Adds the check binding film-production/1.',
        verified: 'Every check passes.',
      },
      missingReturn: 'verified',
    },
    {
      role: 'reviewer',
      input: {
        pullRequest: '#1',
        story: 'film',
        acceptanceCriteria: [
          "The creative's approval of a finished film is recorded.",
        ],
        examples: ['film-production/1'],
      },
      missing: 'pullRequest',
      output: { verdict: 'approve', findings: [], meaningQuestions: [] },
      missingReturn: 'verdict',
    },
    {
      role: 'check-writer',
      input: { story: 'film', examples: ['film-production/1'] },
      missing: 'examples',
      output: {
        story: 'film',
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
      input: { story: 'film', concepts: ['approval'] },
      missing: 'concepts',
      output: { examples: [], flaggedTerms: [] },
      missingReturn: 'flaggedTerms',
    },
  ];
  for (const contract of contracts) {
    it(`agents/5 — ${contract.role} assignment mismatch is warned at its handover, not only the lead's, and goes ahead`, async () => {
      running = await load(f);
      const bad: Record<string, unknown> = { ...contract.input };
      delete bad[contract.missing];
      const result = await running.fire('tool_call', task(contract.role, bad));
      expect(result?.block, 'the handover is never refused').not.toBe(true);
      const warning = warnings(running);
      expect(warning).toContain(contract.role);
      expect(warning).toContain(contract.missing);
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
  it('agents/5 — a task with no story is a complete handover to a builder', async () => {
    running = await load(f);
    const { story: _none, ...noStory } = contracts[0]!.input;
    const result = await running.fire('tool_call', task('builder', noStory));
    expect(result?.block, 'the handover is never refused').not.toBe(true);
    expect(warnings(running)).toBe('');
  });
  it('agents/5 — a lead given a task with no story is not warned', async () => {
    running = await load(f);
    const { story: _none, ...noStory } = contracts[0]!.input;
    const result = await running.fire('tool_call', task('lead', noStory));
    expect(result?.block, 'the handover is never refused').not.toBe(true);
    expect(warnings(running)).toBe('');
  });
  it("agents/5 — a lead's incomplete task is warned with the task's missing parts and both forms shown", async () => {
    running = await load(f);
    await running.fire(
      'tool_call',
      task('lead', { task: 'tidy-approval', goal: 'Tidy the approval code.' }),
    );
    const warning = warnings(running);
    expect(warning).toContain(
      'lead assignment is missing: changes, decisions, done',
    );
    expect(
      warning.split('\n').find((line) => line.includes('is missing')),
      'never the parts of the story it is not',
    ).not.toContain('slice');
    expect(warning).toMatch(/in any one of these forms:\n {2}1\. A story\./);
    expect(warning).toContain('2. A task with no story');
    expect(warning).toContain('`acceptanceCriteria` (list of strings');
    expect(warning).toContain('`done` (string, required)');
  });

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
  it('agents/8 — reviewer gathers evidence in the normal environment without a required worktree', async () => {
    const d = declaration(f, 'reviewer');
    expect(
      d.frontmatter.isolation,
      'never requires an isolated copy or a separate worktree merely because it is a reviewer',
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
        input: { tasks: [{ agent: 'reviewer', isolated: true }] },
      }));
    for (const hook of isolationHooks) {
      const answer = await hook(
        task('reviewer', {
          pullRequest: '#1',
          story: 'film',
          examples: ['film-production/1'],
        }),
      );
      expect(
        answer,
        'the delivered binding never requires an isolated reviewer task',
      ).not.toEqual(
        expect.objectContaining({
          input: expect.objectContaining({
            tasks: expect.arrayContaining([
              expect.objectContaining({ agent: 'reviewer', isolated: true }),
            ]),
          }),
        }),
      );
    }
    running = await load(f, { role: 'reviewer', kind: 'sub' });
    expect(running.ctx.cwd, 'normal working environment').toBe(f.cwd);
    expect(
      d.text,
      'obligation never to build or repair remains behavioral',
    ).toMatch(/no-implementation|never builds|never.*repair/i);
  });
  it('agents/10 — no retired read-only journal gate survives as an alternate narrowing route', async () => {
    running = await load(f, { role: 'lead', kind: 'sub' });
    // An old host declaration cannot resurrect the retired appending-verb gate.
    omp.agents.find((a) => a.name === 'reviewer')!.tools = ['read'];
    running.ctx.agent.name = 'reviewer';
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
});
