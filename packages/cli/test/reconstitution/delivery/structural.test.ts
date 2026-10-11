import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { adapterByName } from '../../../../forge/src/adapters/registry/index.js';
import type { HarnessAdapter } from '../../../../forge/src/core/harness-adapter.js';
import { projectPluginSet } from '../../../../forge/src/project/index.js';
import { FIXTURE_MANIFEST } from '../../../../forge/test/fixture-manifest.js';
import type { Explanation } from '../../capability-port/explanation.js';
import {
  type Host,
  files,
  host,
  success,
  toolJSON,
  toolText,
} from '../../capability-port/fixture.js';
import { assertExplanation, seedProduct } from './fixture.js';
let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

it('delivery/1 — native facility wins over an available extension and prose', async () => {
  let extensionCalls = 0;
  const adapter: HarnessAdapter & {
    nativeCapabilities: Record<string, string>;
  } = {
    ...adapterByName('omp'),
    nativeCapabilities: {
      concepts: 'native-journal',
      workPackage: 'native-work',
    },
    capabilitySurface: () => {
      extensionCalls++;
      return [{ filename: 'lower-fidelity.ts', content: 'UNWANTED_EXTENSION' }];
    },
  };
  const tree = await projectPluginSet({
    plugins: [{ name: 'fidelity-fixture', manifest: FIXTURE_MANIFEST }],
    adapter,
  });
  expect(
    extensionCalls,
    'never chooses lower-fidelity extension when native facility can hold it',
  ).toBe(0);
  expect(
    tree,
    'projection reports the native facilities actually used',
  ).toMatchObject({
    capabilities: [
      { capability: 'concepts', form: 'native', facility: 'native-journal' },
      { capability: 'workPackage', form: 'native', facility: 'native-work' },
    ],
  });
  expect(
    tree.files,
    'no extension or prose substitutes for the native facilities',
  ).toEqual([]);
});

it('delivery/2 — without native facilities omp supplies callable extension tools, never just prose', () => {
  h = host();
  seedProduct(h);
  const wiring = h.inspect([], ['concept_journal', 'work_package']);
  for (const name of ['concept_journal', 'work_package']) {
    const tools =
      process.env.RECONSTITUTION_RED === '1'
        ? wiring.tools.filter((t) => t.name !== name)
        : wiring.tools;
    expect(
      tools.find((t) => t.name === name),
      'agents receive a callable tool through the extension',
    ).toBeDefined();
  }
  const journal = h.call({ verb: 'design', context: 'film-production' });
  expect(
    toolJSON(journal.result),
    'callable journal returns the product design',
  ).toMatchObject({ contexts: [{ name: 'film-production' }] });
  const work = h.inspect(
    [{ verb: 'inventory', cut: 'film' }],
    ['work_package'],
  );
  expect(
    work.results,
    'work package tool executes rather than restating a procedure',
  ).toHaveLength(1);
  const direct = h.command(['workPackage', 'inventory', '--cut', 'film']);
  expect(
    Boolean(work.results[0]!.result.isError),
    'tool and command are the same capability operation',
  ).toBe(direct.code !== 0);
  const text = toolText(work.results[0]!.result);
  if (direct.code === 0)
    expect(JSON.parse(text), 'extension returns the command answer').toEqual(
      JSON.parse(direct.stdout),
    );
  else
    expect(
      text,
      'extension returns the command refusal, not a prose procedure',
    ).toContain(direct.stderr.trim());
});

it('delivery/3 — with neither route prose comes from the capability and claims only the command', async () => {
  h = host();
  const adapter = { ...adapterByName('omp'), capabilitySurface: undefined };
  const tree = await projectPluginSet({
    plugins: [{ name: 'fidelity-fixture', manifest: FIXTURE_MANIFEST }],
    adapter,
  });
  expect(tree, 'prose is the last-resort form').toMatchObject({
    capabilities: [
      { capability: 'concepts', form: 'prose' },
      { capability: 'workPackage', form: 'prose' },
    ],
  });
  const prose = tree.files.map((file) => file.content).join('\n');
  for (const capability of ['concepts', 'workPackage']) {
    const explanation: Explanation = JSON.parse(
      success(h.command([capability, '--explain'])),
    );
    for (const text of [
      explanation.purpose,
      explanation.when,
      ...explanation.verbs.flatMap((v) => [v.purpose, v.when]),
    ])
      expect(
        prose,
        'no second independently maintained account of meaning',
      ).toContain(text);
    expect(
      prose,
      'prose says it is reached through cratylus command',
    ).toContain(`cratylus ${capability}`);
  }
  expect(prose, 'never falsely claims a callable tool').not.toMatch(
    /registerTool|call (?:the )?(?:concept_journal|work_package) tool/i,
  );
});

it('delivery/4 — a product-only journal receives both capabilities own purposes and when at session start', () => {
  h = host();
  seedProduct(h);
  expect(
    h
      .concepts<{ contexts: { name: string }[] }>('design')
      .contexts.map((c) => c.name),
    'only its film-production concepts',
  ).toEqual(['film-production']);
  const wiring = h.inspect([], ['concept_journal', 'work_package']);
  for (const [capability, name] of [
    ['concepts', 'concept_journal'],
    ['workPackage', 'work_package'],
  ]) {
    const explanation: Explanation = JSON.parse(
      success(h.command([capability!, '--explain'])),
    );
    const tool = wiring.tools.find((t) => t.name === name)!;
    assertExplanation(
      process.env.RECONSTITUTION_RED === '1'
        ? { ...tool, description: '' }
        : tool,
      explanation,
    );
  }
});

it('delivery/5 — CLI explanation and published tool preserve the same purposes meanings and guidance', () => {
  h = host();
  const wiring = h.inspect([], ['concept_journal', 'work_package']);
  for (const [capability, name] of [
    ['concepts', 'concept_journal'],
    ['workPackage', 'work_package'],
  ]) {
    const explanation: Explanation = JSON.parse(
      success(h.command([capability!, '--explain'])),
    );
    const tool = wiring.tools.find((t) => t.name === name)!;
    assertExplanation(
      process.env.RECONSTITUTION_RED === '1'
        ? { ...tool, description: 'Adapter-authored replacement.' }
        : tool,
      explanation,
    );
  }
});

it('delivery/6 — delivered capabilities explain when; no workflow-restating overview procedure or reach-for skill', () => {
  h = host();
  const skills = files(join(h.home, '.cratylus/omp/skills'))
    .filter((path) => path.endsWith('SKILL.md'))
    .map((path) => readFileSync(path, 'utf8'));
  if (process.env.RECONSTITUTION_RED === '1')
    skills.push(
      'To recover the conceptual design, call concept_journal overview. Then query work_package for ready work packages.',
    );
  for (const text of skills)
    expect(
      text,
      'no overview, procedure or reach-for-this-tool skill restates these capabilities',
    ).not.toMatch(
      /\b(?:to (?:recover|read|record) (?:the )?(?:conceptual )?design|when (?:recovering|reading|recording) (?:the )?design)[^\n]*(?:concept_journal|cratylus concepts)/i,
    );
  for (const capability of ['concepts', 'workPackage']) {
    const explanation: Explanation = JSON.parse(
      success(h.command([capability, '--explain'])),
    );
    // Exact copied definitions are a structural duplicate. Paraphrased
    // restatements are covered by delivery/6's semantic retirement rubric.
    for (const skill of skills)
      for (const definition of [explanation.purpose, explanation.when])
        expect(
          skill,
          'no separately maintained copy of capability meaning',
        ).not.toContain(definition);
    expect(
      explanation.when.trim(),
      'capabilities explain when to reach for them',
    ).not.toBe('');
    for (const verb of explanation.verbs)
      expect(verb.when.trim(), `${verb.name} explains when`).not.toBe('');
  }
});

it('delivery/7 — offered overview returns the consuming context computed account and state, never cratylus contexts', () => {
  h = host();
  seedProduct(h);
  const response = h.call({ verb: 'overview', context: 'film-production' });
  expect(
    response.result.isError,
    'the offered overview operation is callable',
  ).not.toBe(true);
  const answer = toolJSON(response.result);
  expect(answer.contexts, 'never substitutes cratylus contexts').toHaveLength(
    1,
  );
  expect(
    answer.contexts[0],
    'product account and recorded state',
  ).toMatchObject({
    context: 'film-production',
    subject: 'Making a film.',
    concepts: [
      {
        name: 'production',
        meaning: 'Making a film through shoots.',
        builtFrom: ['shoot'],
      },
      {
        name: 'shoot',
        meaning: 'An occasion for recording takes.',
        builtFrom: [],
      },
    ],
    openDecisions: [],
    cutsInFlight: [],
    account: expect.any(String),
  });
  expect(
    answer.contexts[0].account.trim(),
    'computed account requires no separately authored overview',
  ).not.toBe('');
});
