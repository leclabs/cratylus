import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv, type AnySchema } from 'ajv';
import { afterEach, expect, it } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';
import {
  type LoadedExtension,
  load,
} from '../typed-handoff/binding/fixture.js';
import { parseYaml } from '../yaml.js';

let h: Host | undefined;
let running: LoadedExtension | undefined;
afterEach(() => {
  running?.restore();
  running = undefined;
  h?.dispose();
  h = undefined;
});

/** The assignment schema of the installed agent `role`. */
function assignment(role: string): AnySchema {
  const text = readFileSync(
    join(h!.home, '.cratylus/omp/agents', `${role}.md`),
    'utf8',
  );
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  expect(match, 'the installed agent has front-matter').not.toBeNull();
  // The installed front-matter's shape is what the installation writes; Ajv checks the schema.
  const front = parseYaml(match![1]!) as { assignment: AnySchema };
  return front.assignment;
}

it('behaviour-driven-development/realization: the replaced concepts reach the task', async () => {
  h = host();
  success(h.install);
  // These installed declarations also supply dispatchers' Assignment forms.
  const ajv = new Ajv({ strict: false });
  const replaces = [
    'delivery/install',
    'behaviour-driven-development/realization',
  ];

  const lead = ajv.compile(assignment('tech-lead'));
  const story = {
    story: 'approve-film',
    slice: 'A producer approves a cut.',
    why: 'Approval is the release gate.',
    acceptanceCriteria: ['an approved cut is released'],
    outOfScope: [],
  };
  for (const given of [
    story,
    { ...story, replaces },
    { ...story, replaces: [] },
  ])
    expect
      .soft(
        lead(given),
        `the story ${JSON.stringify(given)}: ${JSON.stringify(lead.errors)}`,
      )
      .toBe(true);
  expect
    .soft(
      lead({ ...story, replaces: 'delivery/install' }),
      'replaces is a list of concepts',
    )
    .toBe(false);

  const engineer = ajv.compile(assignment('software-engineer'));
  const task = {
    task: 'record-approval',
    story: 'approve-film',
    goal: 'Record the creative approval.',
    changes: 'Record approval beside the cut.',
    done: 'The approval is recorded.',
  };
  for (const given of [task, { ...task, replaces }])
    expect
      .soft(
        engineer(given),
        `the task ${JSON.stringify(given)}: ${JSON.stringify(engineer.errors)}`,
      )
      .toBe(true);
  expect
    .soft(
      engineer({ ...task, replaces: [{ concept: 'delivery/install' }] }),
      'replaces is a list of concepts',
    )
    .toBe(false);

  // The Assignment forms the installed extension shows every session carry `replaces` on the
  // tech lead's user story and on the software engineer's task, each concept as
  // `<context>/<concept>`.
  running = await load({
    ...h,
    extension: join(h.home, '.cratylus/omp/extensions/cratylus.ts'),
  });
  const answer = await running.fire('before_agent_start', { systemPrompt: [] });
  const forms =
    (answer?.systemPrompt as string[] | undefined)?.join('\n') ?? '';
  const formOf = (role: string) =>
    new RegExp(`(?:^|\\n)(- ${role}:[\\s\\S]*?)(?=\\n- |$)`).exec(forms)?.[1];
  const leadForm = formOf('tech-lead');
  expect(leadForm, 'the tech lead has an assignment form').toBeDefined();
  const userStory = /\n {2}1\. A user story\.([\s\S]*?)(?=\n {2}2\. |$)/.exec(
    leadForm!,
  )?.[1];
  expect(userStory, "the tech lead's form offers a user story").toBeDefined();
  expect(userStory).toMatch(
    /^ {4}- `replaces` \(list of strings, may be empty, optional\): [^\n]*`<context>\/<concept>`/m,
  );
  const engineerForm = formOf('software-engineer');
  expect(
    engineerForm,
    'the software engineer has an assignment form',
  ).toBeDefined();
  expect(engineerForm).toMatch(
    /^ {2}- `replaces` \(list of strings, may be empty, optional\): [^\n]*`<context>\/<concept>`/m,
  );
});
