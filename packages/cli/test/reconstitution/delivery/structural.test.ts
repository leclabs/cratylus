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
} from '../../capability-port/fixture.js';
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
    ],
  });
  expect(
    tree.files,
    'no extension or prose substitutes for the native facility',
  ).toEqual([]);
});

it('delivery/3 — with neither route prose comes from the capability and claims only the command', async () => {
  h = host();
  const adapter = { ...adapterByName('omp'), capabilitySurface: undefined };
  const tree = await projectPluginSet({
    plugins: [{ name: 'fidelity-fixture', manifest: FIXTURE_MANIFEST }],
    adapter,
  });
  expect(tree, 'prose is the last-resort form').toMatchObject({
    capabilities: [{ capability: 'concepts', form: 'prose' }],
  });
  const prose = tree.files.map((file) => file.content).join('\n');
  for (const capability of ['concepts']) {
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
    /registerTool|call (?:the )?concept_journal tool/i,
  );
});

it('delivery/6 — delivered capabilities explain when; no workflow-restating overview procedure or reach-for skill', () => {
  h = host();
  const skills = files(join(h.home, '.cratylus/omp/skills'))
    .filter((path) => path.endsWith('SKILL.md'))
    .map((path) => readFileSync(path, 'utf8'));
  if (process.env.RECONSTITUTION_RED === '1')
    skills.push(
      'To recover the conceptual design, call concept_journal overview.',
    );
  for (const text of skills)
    expect(
      text,
      'no overview, procedure or reach-for-this-tool skill restates these capabilities',
    ).not.toMatch(
      /\b(?:to (?:recover|read|record) (?:the )?(?:conceptual )?design|when (?:recovering|reading|recording) (?:the )?design)[^\n]*(?:concept_journal|cratylus concepts)/i,
    );
  for (const capability of ['concepts']) {
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

it('delivery/6 — concept journal when-text gives occasions for use, not reader behavior', () => {
  h = host();
  const explanation = h.concepts<Explanation>('--explain');
  expect(explanation.when.trim(), 'when to reach for the capability').not.toBe(
    '',
  );
  // 0114(4): these are reader policies, not occasions for choosing the tool.
  // Match clauses, not words: "when investigating an unknown entry" is a valid
  // occasion and must not fail merely for mentioning an unknown entry.
  const readerPolicy =
    /\b(?:read(?:s|ing)? past|(?:is|are) (?:read past|skipped)|(?:every|each) (?:reading|view) (?:is|reports|answers)|(?:reader|runtime|entry|journal)[^.;]*\brefus(?:e[sd]?|al)|recording still appends)\b/i;
  expect(
    explanation.when,
    'reader policies belong to the verbs and their output, not when-text',
  ).not.toMatch(readerPolicy);
});
