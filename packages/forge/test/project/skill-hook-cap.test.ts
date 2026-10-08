// Omp does not add a main-session skill hook or a size-based required-reading
// fallback; its normal projection keeps the skill available to the agent.

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { projectPluginSet } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(here, 'fixtures-hook-cap');
const plugin: ProjectablePlugin = {
  name: 'fixture-hook-cap',
  manifest: FIXTURE_MANIFEST,
  agents: join(fixtures, 'agents'),
  skills: join(fixtures, 'skills'),
};

describe('omp — skills remain available without a main-session hook', () => {
  it('does not warn or add required-reading fallback for large skills', async () => {
    const warnings: string[] = [];
    const tree = await projectPluginSet({
      plugins: [plugin],
      adapter: adapterByName('omp'),
      warn: (line) => warnings.push(line),
    });
    const both = tree.files.find((f) => f.path === 'agents/both.md')?.content;
    expect(warnings).toEqual([]);
    expect(both).toContain('\nskills:\n  - "small"\n  - "huge"\n');
    expect(both).not.toContain('## Required reading');
  });
});
