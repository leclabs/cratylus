// A SKILL THE MAIN-SESSION HOOK CANNOT CARRY — pinned through the projector, because the
// weighing happens in `projectPluginSet` and the adapter only receives its verdict.
//
// Claude Code caps what one hook may print, and a body over the cap reaches the model
// as a preview it is not asked to read: no error, no warning, a skill that is simply
// absent. So a skill over the cap must not be hooked, must be named as required
// reading, and must be warned about once — by name, size and cap.
//
// The fixture roster (`fixtures-hook-cap`): `small` fits, `huge` does not. `both` is
// given the two, `onlyhuge` the second alone.

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { claudeHarnessAdapter } from '../../src/adapters/claude/render.js';
import { adapterByName } from '../../src/adapters/registry/index.js';
import type { HarnessAdapter } from '../../src/core/harness-adapter.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(here, 'fixtures-hook-cap');

const plugin: ProjectablePlugin = {
  name: 'fixture-hook-cap',
  manifest: FIXTURE_MANIFEST,
  agents: join(fixtures, 'agents'),
  skills: join(fixtures, 'skills'),
};

async function project(adapter: HarnessAdapter) {
  const warnings: string[] = [];
  const tree = await projectPluginSet({
    plugins: [plugin],
    adapter,
    warn: (line) => warnings.push(line),
  });
  const text = (path: string) => {
    const file = tree.files.find((f) => f.path === path);
    if (!file) throw new Error(`no file ${path}`);
    return file.content;
  };
  return { warnings, agent: (name: string) => text(`agents/${name}.md`), text };
}

/** The hook commands of a definition, one per `command:` line. */
const commandsOf = (md: string) =>
  md.split('\n').filter((l) => /^ +command: /.test(l));

const claude = claudeHarnessAdapter;
const hook = claude.mainSessionSkillHook as NonNullable<
  HarnessAdapter['mainSessionSkillHook']
>;

describe('claude — a skill over the hook cap degrades to required reading', () => {
  it('declares the documented cap of 10,000 characters', () => {
    expect(hook.cap).toBe(10_000);
  });

  it('gives the oversized skill no hook command, and every other skill one', async () => {
    const md = (await project(claude)).agent('both');
    const commands = commandsOf(md);
    expect(commands).toHaveLength(1);
    expect(commands[0]).toContain('skills/small');
    expect(md.match(/^ {2}SessionStart:$/gm)).toHaveLength(1);
  });

  it('gives an agent whose only skill is oversized no hooks block at all', async () => {
    const md = (await project(claude)).agent('onlyhuge');
    expect(md).not.toContain('hooks:');
    expect(md).not.toContain('SessionStart');
  });

  it('names the oversized skill, and only it, under the definition’s closing Required reading', async () => {
    const { agent } = await project(claude);
    for (const name of ['both', 'onlyhuge']) {
      const md = agent(name);
      const section = md.slice(md.lastIndexOf('\n## '));
      expect(section.startsWith('\n## Required reading\n')).toBe(true);
      expect([...section.matchAll(/^- `([^`]+)`/gm)].map((m) => m[1])).toEqual([
        'huge',
      ]);
    }
  });

  it('keeps the oversized skill in `skills`: a dispatched subagent preloads a skill of any size', async () => {
    const md = (await project(claude)).agent('both');
    expect(md).toContain('\nskills:\n  - "small"\n  - "huge"\n');
  });

  it('warns once for the skill, naming it, its size and the cap, though two agents are given it', async () => {
    const { warnings, text } = await project(claude);
    const size = hook.size('huge', text('skills/huge/SKILL.md'));
    expect(size).toBeGreaterThan(hook.cap);
    expect(warnings).toHaveLength(1);
    const [warning] = warnings as [string];
    expect(warning).toContain("'huge'");
    expect(warning).toContain(String(size));
    expect(warning).toContain(String(hook.cap));
    expect(warning).not.toContain("'small'");
  });

  it('trims no body: the skill file is projected whole', async () => {
    const { text } = await project(claude);
    expect(text('skills/huge/SKILL.md').match(/does-not-fit /g)).toHaveLength(
      1000,
    );
  });

  it('holds a skill whose output is exactly the cap, and refuses one character over', async () => {
    const { text } = await project(claude);
    const fits = hook.size('small', text('skills/small/SKILL.md'));
    const at = (cap: number): HarnessAdapter => ({
      ...claude,
      mainSessionSkillHook: { ...hook, cap },
    });
    const bare = (await project(at(fits))).warnings;
    expect(bare.filter((w) => w.includes("'small'"))).toEqual([]);
    const over = (await project(at(fits - 1))).warnings;
    expect(over.filter((w) => w.includes("'small'"))).toHaveLength(1);
  });
});

describe('omp — no main-session hook, so no cap to weigh', () => {
  it('warns about nothing and names no required reading', async () => {
    const { warnings, agent } = await project(adapterByName('omp'));
    expect(warnings).toEqual([]);
    expect(agent('both')).not.toContain('## Required reading');
  });
});
