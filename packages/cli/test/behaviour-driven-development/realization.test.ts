import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv, type AnySchema } from 'ajv';
import { afterEach, expect, it } from 'vitest';
import { type Host, host, success } from '../capability-port/fixture.js';
import { parseYaml } from '../yaml.js';

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

function agent(role: string) {
  const text = readFileSync(
    join(h!.home, '.cratylus/omp/agents', `${role}.md`),
    'utf8',
  );
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  expect(match, 'the installed agent has front-matter').not.toBeNull();
  return {
    front: parseYaml(match![1]!) as { assignment: AnySchema },
    body: match![2]!,
  };
}

it('behaviour-driven-development/realization: the tech lead remembers what is built', () => {
  h = host();
  success(h.install);
  const memory = /### memory\n([\s\S]*?)(?=\n#{1,3} |$)/.exec(
    agent('tech-lead').body,
  );
  expect(memory, 'the tech lead has a memory').not.toBeNull();
  expect(memory![1]).toMatch(/\*\*domain-model\*\*[^\n]*design\/model\//);
  expect(memory![1]).toMatch(
    /\*\*realization\*\*[^\n]*develop['’]s first-parent merge commits/,
  );
});

it('behaviour-driven-development/realization: a task names the realization it touches', () => {
  h = host();
  success(h.install);
  // These installed declarations also supply dispatchers' Assignment forms.
  const schema = agent('software-engineer').front.assignment;
  const validate = new Ajv({ strict: false }).compile(schema);
  const task = {
    task: 'record-approval',
    story: 'approve-film',
    goal: 'Record the creative approval.',
    changes: 'Change the approval realization.',
    done: 'The approval is recorded.',
  };
  const commits = [
    {
      commit: 'a1b2c3d',
      header: 'feat: record film approval',
      realization: 'change',
    },
    {
      commit: 'e4f5a6b',
      header: 'feat: release an approved film',
      realization: 'replace',
    },
  ];
  expect
    .soft(
      validate({ ...task, realizedBy: commits }),
      JSON.stringify(validate.errors),
    )
    .toBe(true);
  expect
    .soft(
      validate({ ...task, realizedBy: [] }),
      JSON.stringify(validate.errors),
    )
    .toBe(true);
  expect
    .soft(
      validate(task),
      'every task explicitly names its realized concepts, including none',
    )
    .toBe(false);
  for (const field of ['commit', 'header', 'realization']) {
    const incomplete: Record<string, string> = { ...commits[0]! };
    delete incomplete[field];
    expect
      .soft(
        validate({ ...task, realizedBy: [incomplete] }),
        `each realization carries ${field}`,
      )
      .toBe(false);
  }
  expect
    .soft(
      validate({
        ...task,
        realizedBy: [{ ...commits[0], realization: 'keep' }],
      }),
    )
    .toBe(false);
  const lead = agent('tech-lead').front.assignment as {
    anyOf: { properties: Record<string, unknown> }[];
  };
  for (const form of lead.anyOf) {
    expect(form.properties).not.toHaveProperty('realizedBy');
  }
});
