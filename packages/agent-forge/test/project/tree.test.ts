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

  // The always-loaded instruction surface (codex `AGENTS.md`). It was the ONE
  // artifact the projector could not render, which is why the codex CLI kept a
  // whole forked pipeline just to reach its own disk write — and why that fork
  // shipped sessionless shims. The surface is a tree entry now, like everything else.
  //
  // Codex declares no `hooks` op and the projector refuses a hook-carrying plugin
  // set it cannot render, so this case takes the fixture WITHOUT its hooks dir.
  const { hooks: _codexHasNoHooks, ...surfacePlugin } = plugin;

  it('emits the harness surface into the tree, indexing the projected agents', async () => {
    const t = await projectPluginSet({
      plugins: [surfacePlugin],
      adapter: adapterByName('codex'),
    });
    const surface = t.files.find((f) => f.path === 'AGENTS.md');
    // Rendered by the adapter, addressed at the render-tree ROOT (not under agents/).
    expect(surface?.content).toContain('`probe` — `agents/probe.toml`');
    // An ordinary artifact: bytes in the tree, no exec bit, no side-channel write.
    expect(surface?.executable).toBeUndefined();
  });

  it('emits NO surface for a harness that declares none — claude is unchanged', async () => {
    // The guard on the guard: teaching the projector about `surface` must not add a
    // byte to a harness without one. `HarnessAdapter.surface` is optional on purpose.
    const t = await tree();
    expect(t.files.some((f) => f.path === 'AGENTS.md')).toBe(false);
  });

  // "Rendering is not writing" is a LOAD-BEARING property, not tidiness: it is what
  // makes "what does this plugin set project?" answerable without a tmpdir. Asserting
  // it by grepping raw source was too weak in both directions — it convicted any
  // COMMENT naming `writeFileSync` (it caught a prose line during the codex collapse),
  // and it would have missed `fs.writeFileSync` or an aliased import entirely.
  //
  // The structural fact is stronger and comment-immune: a module that opens no file
  // descriptor does not IMPORT the fs module. Checked on import statements only.
  const projectorSrc = () =>
    readFileSync(join(here, '..', '..', 'src', 'project', 'index.ts'), 'utf8');

  /** Source with line and block comments removed — prose must not be evidence. */
  const codeOnly = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('the projector itself performs no writes', () => {
    const code = codeOnly(projectorSrc());
    expect(code).not.toMatch(/\bfrom\s+'node:fs'/);
    expect(code).not.toMatch(/\bwriteFileSync\s*\(/);
    expect(code).not.toMatch(/\bchmodSync\s*\(/);
    expect(code).not.toMatch(/\bmkdirSync\s*\(/);
  });

  it('is non-vacuous — the check REFUSES a projector that imports fs', () => {
    // Comment mentions must NOT convict; a real import must.
    const prose =
      "// a note about writeFileSync\nimport { join } from 'node:path';";
    expect(codeOnly(prose)).not.toMatch(/\bfrom\s+'node:fs'/);
    expect(codeOnly(prose)).not.toMatch(/\bwriteFileSync\s*\(/);
    const real =
      "import { writeFileSync } from 'node:fs';\nwriteFileSync(p, c);";
    expect(codeOnly(real)).toMatch(/\bfrom\s+'node:fs'/);
    expect(codeOnly(real)).toMatch(/\bwriteFileSync\s*\(/);
  });
});
