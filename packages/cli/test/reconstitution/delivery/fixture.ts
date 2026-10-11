import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import type { Explanation } from '../../capability-port/explanation.js';
import type { Host, ToolInfo } from '../../capability-port/fixture.js';

export function seedProduct(h: Host) {
  h.concepts('context', 'film-production', '--subject', 'Making a film.');
  h.concepts(
    'define',
    'shoot',
    '--context',
    'film-production',
    '--wording',
    'An occasion for recording takes.',
    '--reason',
    'The film needs performances.',
  );
  h.concepts(
    'define',
    'production',
    '--context',
    'film-production',
    '--wording',
    'Making a film through shoots.',
    '--reason',
    'Name the whole.',
    '--built-from',
    'shoot',
  );
  mkdirSync(join(h.cwd, 'design/examples/film-production'), {
    recursive: true,
  });
  writeFileSync(
    join(h.cwd, 'design/examples/film-production/film.md'),
    '1. (production) Given a film, when made, then its shoots are recorded.\n',
  );
}

export function assertExplanation(tool: ToolInfo, explanation: Explanation) {
  expect(
    tool,
    'harness publishes the capability own explanation',
  ).toBeDefined();
  expect(tool.name, 'concept own name').toBe(
    explanation.name.replace(/ /g, '_'),
  );
  const text = [
    tool.label ?? '',
    tool.description,
    ...Object.values(tool.parameters.properties).map(
      (p) => p.description ?? '',
    ),
  ].join('\n');
  for (const content of [
    explanation.name,
    explanation.purpose,
    explanation.when,
    ...explanation.verbs.flatMap((v) => [
      v.name,
      v.concept,
      v.purpose,
      v.when,
      ...v.parameters.map((p) => p.description),
    ]),
  ])
    expect(
      text,
      `same purposes meanings and when guidance: ${content}`,
    ).toContain(content);
  expect(
    tool.parameters.required,
    'callable interface declares required verb',
  ).toContain('verb');
  expect(
    [...(tool.parameters.properties.verb?.enum as string[])].sort(),
    'offered operations come from the explanation',
  ).toEqual(explanation.verbs.map((v) => v.name).sort());
}
