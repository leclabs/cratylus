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
  it('a typed story starts the tech-lead with those inputs and its output schema, never prose substitutes', async () => {
    const validate = outputValidator(f, 'tech-lead');
    expect(
      validate(outcome),
      'binds its deliverable as the harness output schema',
    ).toBe(true);
    running = await load(f);
    const event = task('tech-lead', story);
    const before = structuredClone(event);
    const result = await running.fire('tool_call', event);
    expect(result?.block, 'starts the tech-lead with those inputs').not.toBe(
      true,
    );
    expect(event, 'assignment inputs are not substituted').toEqual(before);
    expect(event.input.tasks[0]!.task).toBe(assignment(story));
    if (result?.input !== undefined)
      expect(
        result.input,
        'a revised dispatch keeps the same typed assignment',
      ).toMatchObject(before.input);
  });

  for (const field of [
    'evidence',
    'joined',
    'criteria',
    'meaningQuestions',
    'followUps',
  ]) {
    it(`fluent explanation cannot substitute for an outcome omitting ${field}`, () => {
      const validate = outputValidator(f, 'tech-lead');
      const bad = structuredClone(outcome) as Record<string, unknown>;
      if (field === 'evidence') {
        // biome-ignore lint/performance/noDelete: this negative must omit the field, not set it to undefined.
        delete (bad.criteria as Record<string, unknown>[])[0]!.evidence;
      } else delete bad[field];
      expect(
        validate('Every criterion holds; the code-reviewer approved the work.'),
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
      role: 'software-engineer',
      output: {
        change: 'Records the approval when the creative approves.',
        tests: 'Adds the acceptance test for film-production/approval.',
        verified: 'Every acceptance test passes.',
      },
      missingReturn: 'verified',
    },
    {
      role: 'code-reviewer',
      output: { verdict: 'approve', findings: [], meaningQuestions: [] },
      missingReturn: 'verdict',
    },
    {
      role: 'test-engineer',
      output: {
        story: 'film',
        tests: [
          {
            example: 'film-production/approval',
            test: 'film-production/approval: the creative approves',
            seenFailing: true,
          },
        ],
      },
      missingReturn: 'tests',
    },
  ];
  for (const contract of contracts) {
    it(`${contract.role} return mismatch is caught by its declared output schema`, () => {
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
    it(`${role} keeps default tools including shell and all journal appends`, async () => {
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
  it('code-reviewer gathers evidence in the normal environment without a required worktree', async () => {
    const d = declaration(f, 'code-reviewer');
    expect(
      d.frontmatter.isolation,
      'never requires an isolated copy or a separate worktree merely because it is a code-reviewer',
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
        input: { tasks: [{ agent: 'code-reviewer', isolated: true }] },
      }));
    for (const hook of isolationHooks) {
      const answer = await hook(
        task('code-reviewer', {
          change: '#1',
          story: 'film',
          examples: ['film-production/approval'],
        }),
      );
      expect(
        answer,
        'the delivered binding never requires an isolated code-reviewer task',
      ).not.toEqual(
        expect.objectContaining({
          input: expect.objectContaining({
            tasks: expect.arrayContaining([
              expect.objectContaining({
                agent: 'code-reviewer',
                isolated: true,
              }),
            ]),
          }),
        }),
      );
    }
    running = await load(f, { role: 'code-reviewer', kind: 'sub' });
    expect(running.ctx.cwd, 'normal working environment').toBe(f.cwd);
  });
  it('no retired read-only journal gate survives as an alternate narrowing route', async () => {
    running = await load(f, { role: 'tech-lead', kind: 'sub' });
    // An old host declaration cannot resurrect the retired appending-verb gate.
    omp.agents.find((a) => a.name === 'code-reviewer')!.tools = ['read'];
    running.ctx.agent.name = 'code-reviewer';
    await running.fire('session_start');
    const journal = running.tools
      .filter((t) => t.name === 'concept_journal')
      .at(-1);
    expect(
      journal?.parameters.properties.verb.enum,
      'no journal read-only gate or tech-lead journal-append restriction remains',
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
