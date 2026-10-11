import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect } from 'vitest';
import {
  type Host,
  files,
  host,
  success,
} from '../../capability-port/fixture.js';
import { launch } from '../../capability-port/omp.js';
import { judgeSubject } from '../../rubric-judge.js';
import type { Scenario as ArchitectScenario } from '../architect/check.js';
import { liveRun as architectRun } from '../architect/runner.js';
import { type Overview, meanings, relation, subject } from './fixture.js';
import {
  type Recording,
  type Scenario,
  parseAnswers,
  rubricPrompt,
} from './rubric.js';

export function capture(scenario: Scenario, h: Host): Recording {
  h.concepts(
    'context',
    'film-production',
    '--subject',
    subject,
    '--relation',
    relation,
  );
  for (const [name, parts] of [
    ['take', []],
    ['shoot', ['take']],
    ['production', ['shoot']],
  ] as const)
    h.concepts(
      'define',
      name,
      '--context',
      'film-production',
      '--wording',
      meanings[name],
      '--reason',
      'The film context.',
      ...parts.flatMap((part) => ['--built-from', part]),
    );
  const wiring = h.inspect([], ['concept_journal', 'work_package']);
  const interfaces = wiring.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
  if (scenario.ref === 'delivery/9' || scenario.ref === 'delivery/6')
    return {
      provenance:
        'Installed runtime explanations published by real omp, no model.',
      input: { context: 'film-production', subject, relation },
      output: JSON.stringify(
        scenario.ref === 'delivery/6'
          ? {
              interfaces,
              skills: files(join(h.home, '.agents/skills'))
                .filter((path) => path.endsWith('SKILL.md'))
                .map((path) => readFileSync(path, 'utf8')),
            }
          : interfaces,
      ),
      answers: {},
    };
  h.concepts(
    'decide',
    'colour',
    '--context',
    'film-production',
    '--title',
    'Choose the colour treatment',
    '--situation',
    'Colour is undecided.',
    '--decision',
    'Consider monochrome.',
    '--consequences',
    'Treatment remains to be agreed.',
    '--status',
    'open',
  );
  mkdirSync(join(h.cwd, 'design/examples/film-production'), {
    recursive: true,
  });
  writeFileSync(
    join(h.cwd, 'design/examples/film-production/film.md'),
    '1. (production) Given a film, when made, then its shoots are recorded.\n',
  );
  success(
    h.command([
      'workPackage',
      'open',
      '--cut',
      'film',
      '--branch',
      'feature/film',
      '--architect',
      'film-production=creative',
    ]),
  );
  success(
    h.command([
      'workPackage',
      'submit',
      'shoot',
      '--cut',
      'film',
      '--output',
      'film.txt',
      '--concept',
      'production',
    ]),
  );
  success(
    h.command([
      'lifecycle',
      JSON.stringify({
        kind: 'dispatched',
        transition: 'film-dispatch',
        cut: 'film',
        workPackage: 'shoot',
        role: 'builder',
        run: 'film-builder',
      }),
    ]),
  );
  const answer = h.concepts<{ contexts: Overview[] }>(
    'overview',
    '--context',
    'film-production',
  ).contexts[0]!;
  expect(
    answer.account,
    'rubric judges the computed account, not a test-authored overview',
  ).toEqual(expect.any(String));
  return {
    provenance: 'Computed account from the installed capability.',
    input: {
      context: 'film-production',
      subject,
      relation,
      concepts: Object.entries(meanings).map(([name, meaning]) => ({
        name,
        meaning,
      })),
      openDecisions: [{ id: 'colour', title: 'Choose the colour treatment' }],
      cutsInFlight: [
        { cut: 'film', phase: 'in flight', branch: 'feature/film' },
      ],
      interfaces,
    },
    output: answer.account,
    answers: {},
  };
}

export function live(scenario: Scenario, output: string): Recording {
  if (process.env.EXECUTION_LIVE !== '1')
    throw new Error('Requires EXECUTION_LIVE=1');
  const h = host();
  try {
    const record = capture(scenario, h);
    mkdirSync(output, { recursive: true });
    if (scenario.ref === 'delivery/10') {
      // Architect is the product agent: contract section 5 deliberately gives it
      // free-text intent, not a made-up typed cut-brief assignment.
      const intent: ArchitectScenario = {
        number: 10,
        ref: scenario.ref,
        title: 'Understanding the consuming context',
        role: 'architect',
        example: scenario.example,
        clauses: scenario.clauses,
        // Only the account and published interfaces reach the reader; structured
        // fixture truth is reserved for the judge, not a second account.
        prompt: `${scenario.prompt}\nThe concept journal returned this overview:\n${record.output}\nPublished capability interfaces:\n${JSON.stringify(h.inspect([], ['concept_journal', 'work_package']).tools)}`,
        files: Object.fromEntries(
          files(join(h.cwd, 'design')).map((path) => [
            relative(h.cwd, path),
            readFileSync(path, 'utf8'),
          ]),
        ),
        commands: [],
      };
      const result = architectRun(intent, output);
      return {
        provenance:
          'Installed architect given free-text product intent; separate live rubric judge.',
        input: { account: record.output, state: record.input },
        output: result.report,
        answers: result.answers,
        judgment: result.judgment,
      };
    }
    // Each call creates a separate plain evaluator session. It is not a workflow
    // assayer and claims no typed workflow role. No subject-model run is needed
    // for the two rubrics over mechanically delivered output.
    return judgeSubject(record, output, [], (model, attemptOutput) => {
      const j = host();
      const old = process.env.CAPABILITY_PORT_RUBRIC;
      try {
        process.env.CAPABILITY_PORT_RUBRIC = '1';
        const prompt = rubricPrompt(scenario, record);
        writeFileSync(join(output, 'rubric-prompt.txt'), prompt);
        const judged = launch(
          {
            ...j,
            launchArgs(explicit) {
              const args = j.launchArgs(explicit);
              args[args.indexOf('--model') + 1] = model;
              return args;
            },
          },
          prompt,
          [],
          attemptOutput,
        );
        const text = judged.events
          .filter((event) => event.kind === 'text')
          .map((event) => event.text)
          .join('\n');
        return parseAnswers(text, scenario);
      } finally {
        if (old === undefined)
          Reflect.deleteProperty(process.env, 'CAPABILITY_PORT_RUBRIC');
        else process.env.CAPABILITY_PORT_RUBRIC = old;
        j.dispose();
      }
    });
  } finally {
    h.dispose();
  }
}
