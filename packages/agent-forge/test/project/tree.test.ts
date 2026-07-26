// PROJECTION WITHOUT I/O — the seam V7 opened.
//
// `projectPluginSet` used to render and WRITE in adjacent statements: no
// intermediate value survived the loop body, so projection could not be exercised
// at all without handing it a real directory to scrub. This suite is the proof
// that it now can: every assertion below reads the RETURNED artifact tree, and the
// file does not import `node:fs`, does not make a tmpdir, and does not mock one.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNTIME_BIN } from '@leclabs/agent-runtime/bin-name';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(here, 'fixtures');

const plugin: ProjectablePlugin = {
  name: 'fixture',
  agents: join(fixtures, 'agents'),
  skills: join(fixtures, 'skills'),
  hooks: join(fixtures, 'hooks'),
};

async function tree() {
  return projectPluginSet({
    plugins: [plugin],
    adapter: adapterByName('claude'),
  });
}

describe('projectPluginSet — the artifact tree is the return value', () => {
  it('returns every projected file as bytes, writing nothing', async () => {
    const t = await tree();
    const paths = t.files.map((f) => f.path).sort();
    expect(paths).toEqual([
      'agents/probe.md',
      'hooks/ping/ping.sh',
      'settings.json',
      'skills/greet/SKILL.md',
      'skills/greet/scripts/memory.mjs',
    ]);
    // Bytes, not paths-on-disk: every entry carries its own content.
    for (const f of t.files) expect(typeof f.content).toBe('string');
    expect(t).toMatchObject({ agents: 1, skills: 1, shims: 1, hooks: 1 });
  });

  it('carries the adapter-rendered agent bytes', async () => {
    const t = await tree();
    const agent = t.files.find((f) => f.path === 'agents/probe.md');
    expect(agent?.content).toContain('name: probe');
    expect(agent?.content).toContain(
      'A fixture agent used to exercise the projection seam.',
    );
  });

  it('carries the skill body and its runtime shim, shim marked executable', async () => {
    const t = await tree();
    const skill = t.files.find((f) => f.path === 'skills/greet/SKILL.md');
    expect(skill?.content).toContain('G ≜ ⟨greeting⟩');
    const shim = t.files.find(
      (f) => f.path === 'skills/greet/scripts/memory.mjs',
    );
    expect(shim?.executable).toBe(true);
    expect(shim?.content).toContain(`spawnSync('${RUNTIME_BIN}', ['memory'`);
  });

  it('carries the hooks settings fragment and the worker byte-anchor', async () => {
    const t = await tree();
    const settings = t.files.find((f) => f.path === 'settings.json');
    expect(JSON.parse(settings?.content ?? '{}')).toMatchObject({
      hooks: { SessionStart: expect.any(Array) },
    });
    const worker = t.files.find((f) => f.path === 'hooks/ping/ping.sh');
    expect(worker?.content).toBe('#!/bin/sh\nexit 0\n');
    expect(worker?.executable).toBe(true);
  });

  it('the projector itself performs no writes', () => {
    const src = readFileSync(
      join(here, '..', '..', 'src', 'project', 'index.ts'),
      'utf8',
    );
    expect(src).not.toContain('writeFileSync');
    expect(src).not.toContain('chmodSync');
  });
});
