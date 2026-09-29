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
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(here, 'fixtures');

const plugin: ProjectablePlugin = {
  name: 'fixture',
  // The fixture corpus declares its own dimensions — nothing else can.
  manifest: FIXTURE_MANIFEST,
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

/**
 * The write calls a source text performs — the scan the purity guard runs, named so
 * a synthetic WRITING source can be fed to the very same code.
 *
 * Comments are stripped and matches are CALL-SHAPED (`name(`), because a plain
 * substring scan was wrong in both directions: it convicted prose naming
 * `writeFileSync` — it caught a real comment once, and the
 * author reworded the comment rather than weaken the gate — and it would equally
 * have missed nothing, since any mention at all tripped it. `from 'node:fs'` is
 * checked too: the structural fact behind "opens no file descriptor" is that the
 * module never imports fs, and that survives aliasing and `fs.writeFileSync`.
 */
function writeCalls(src: string): string[] {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const found = ['writeFileSync', 'chmodSync', 'mkdirSync'].filter((call) =>
    new RegExp(`\\b${call}\\s*\\(`).test(code),
  );
  if (/\bfrom\s+'node:fs'/.test(code)) found.push("import 'node:fs'");
  return found;
}

describe('projectPluginSet — the artifact tree is the return value', () => {
  it('returns every projected file as bytes, writing nothing', async () => {
    const t = await tree();
    const paths = t.files.map((f) => f.path).sort();
    expect(paths).toEqual([
      'agents/probe.md',
      'enforcing/probe/stance/manifest.json',
      'hooks/ping/ping.sh',
      'settings.json',
      'skills/greet/SKILL.md',
      'skills/greet/scripts/note.mjs',
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
      (f) => f.path === 'skills/greet/scripts/note.mjs',
    );
    expect(shim?.executable).toBe(true);
    expect(shim?.content).toContain(`spawnSync('${CLI_BIN}', ['note'`);
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

  // "Rendering is not writing" is a LOAD-BEARING property, not tidiness: it is what
  // makes "what does this plugin set project?" answerable without a tmpdir. Asserting
  // it by grepping raw source was too weak in both directions — it convicted any
  // COMMENT naming `writeFileSync` (it once caught a prose line),
  // and it would have missed `fs.writeFileSync` or an aliased import entirely.
  //
  // The structural fact is stronger and comment-immune: a module that opens no file
  // descriptor does not IMPORT the fs module. Checked on import statements only.
  const projectorSrc = () =>
    readFileSync(
      join(
        requireRepoRoot(here),
        'packages',
        'forge',
        'src',
        'project',
        'index.ts',
      ),
      'utf8',
    );

  /** Source with line and block comments removed — prose must not be evidence. */
  const codeOnly = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('the projector itself performs no writes', () => {
    const src = readFileSync(
      join(
        requireRepoRoot(here),
        'packages',
        'forge',
        'src',
        'project',
        'index.ts',
      ),
      'utf8',
    );
    expect(src.length).toBeGreaterThan(0); // a read that returned nothing is DARK
    expect(writeCalls(src)).toEqual([]);
  });

  it('is non-vacuous — the scan FLAGS a projector that writes, and spares one that only returns bytes', () => {
    // The BAD input the live source does not contain: the two fs calls whose
    // reappearance would close the seam V7 opened. Without this, the check above
    // is green whether the projector is pure or the substrings were renamed.
    expect(
      writeCalls("writeFileSync(join(out, f.path), f.content, 'utf8');\n"),
    ).toEqual(['writeFileSync']);
    expect(writeCalls('if (f.executable) chmodSync(dest, 0o755);\n')).toEqual([
      'chmodSync',
    ]);
    expect(
      writeCalls('writeFileSync(a, b);\nchmodSync(c, 0o755);\n').sort(),
    ).toEqual(['chmodSync', 'writeFileSync']);
    // EXONERATES: returning the bytes, and merely READING, are both clean.
    expect(
      writeCalls('return { files, agents, skills, shims, hooks };\n'),
    ).toEqual([]);
    expect(writeCalls("const src = readFileSync(path, 'utf8');\n")).toEqual([]);
  });

  it('is non-vacuous — prose naming a write is NOT a write, an fs import IS', () => {
    // The false positive that made the old substring scan unusable: a COMMENT.
    expect(
      writeCalls('// note: writeFileSync lives in write.ts\nreturn f;\n'),
    ).toEqual([]);
    // …and the aliasing case a substring scan of call names alone would miss.
    expect(
      writeCalls("import { writeFileSync as w } from 'node:fs';\n"),
    ).toEqual(["import 'node:fs'"]);
  });
});
