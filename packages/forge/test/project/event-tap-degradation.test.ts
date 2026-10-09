// OMP has no runtime tap strategy. A corpus that declares the `eventTap`
// capability still ships its skill and thin shim as a declaration, but the
// projection says, once, that nothing is captured there.

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const here = fileURLToPath(new URL('.', import.meta.url));

const plugin: ProjectablePlugin = {
  name: 'fixture-event-tap',
  manifest: FIXTURE_MANIFEST,
  skills: join(here, 'fixtures-event-tap', 'skills'),
};

async function project() {
  const warnings: string[] = [];
  const tree = await projectPluginSet({
    plugins: [plugin],
    adapter: adapterByName('omp'),
    warn: (line) => warnings.push(line),
  });
  return { tree, warnings };
}

describe('projecting an eventTap skill', () => {
  it('warns exactly once on omp, naming the capability, the harness and the loss', async () => {
    const { tree, warnings } = await project();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/eventTap/);
    expect(warnings[0]).toMatch(/'omp'/);
    expect(warnings[0]).toMatch(/no events are captured/);
    // Degraded, not dropped: the skill and its shim still ship.
    const paths = tree.files.map((f) => f.path);
    expect(paths).toContain('skills/tapper/scripts/eventTap.mjs');
    expect(paths.some((p) => p.startsWith('skills/tapper/'))).toBe(true);
  });
});
