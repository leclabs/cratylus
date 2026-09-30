// A SKILL THE MAIN-SESSION HOOK CANNOT CARRY — pinned through the projector, because the
// weighing happens in `projectPluginSet` and the adapter only receives its verdict.
//
// Claude Code caps what one hook may print, and a body over the cap reaches the model
// as a preview it is not asked to read: no error, no warning, a skill that is simply
// absent. So a skill over the cap must not be printed, must be named as required
// reading, and must be warned about once — by name, size and cap. The notice reaches
// the MAIN session only: a dispatched holder has the skill preloaded and is not told to
// load it again.
//
// The fixture roster (`fixtures-hook-cap`): `small` fits, `huge` does not. `both` is
// given the two, `onlyhuge` the second alone.

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
  return {
    warnings,
    agent: (name: string) => text(`agents/${name}.md`),
    text,
    files: tree.files,
  };
}

/** The hook commands of a definition, one per `command:` line, as the shell text they carry. */
const commandsOf = (md: string) =>
  md
    .split('\n')
    .filter((l) => /^ +command: /.test(l))
    .map((l) => JSON.parse(l.replace(/^ +command: /, '')) as string);

/** Runs a hook command as the host would, on a HOME holding the projected skills. */
function run(
  command: string,
  tree?: readonly { path: string; content: string }[],
) {
  const home = mkdtempSync(join(tmpdir(), 'skill-hook-cap-'));
  try {
    for (const f of tree ?? []) {
      if (!f.path.startsWith('skills/')) continue;
      const dest = join(home, '.claude', f.path);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, f.content);
    }
    return spawnSync('sh', ['-c', command], {
      encoding: 'utf8',
      env: { ...process.env, HOME: home },
    });
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

const claude = claudeHarnessAdapter;
const hook = claude.mainSessionSkillHook as NonNullable<
  HarnessAdapter['mainSessionSkillHook']
>;

describe('claude — a skill over the hook cap degrades to required reading', () => {
  it('declares the documented cap of 10,000 characters', () => {
    expect(hook.cap).toBe(10_000);
  });

  it('prints the fitting skill and only names the oversized one, each in its own handler, in order', async () => {
    const { agent, files } = await project(claude);
    const md = agent('both');
    const commands = commandsOf(md);
    expect(commands).toHaveLength(2);
    const [small, huge] = commands.map((c) => run(c, files));
    expect(small?.stdout).toContain('Base directory for this skill:');
    expect(small?.stdout).toContain('SMALL');
    expect(huge?.stdout).not.toContain('Base directory for this skill:');
    expect(huge?.stdout).not.toContain('does-not-fit');
    expect(huge?.stdout).toMatch(/^## Required reading\n[\s\S]*\n- `huge`\n$/);
    expect(md.match(/^ {2}SessionStart:$/gm)).toHaveLength(1);
  });

  it('gives an agent whose only skill is oversized one handler, naming it', async () => {
    const md = (await project(claude)).agent('onlyhuge');
    const commands = commandsOf(md);
    expect(commands).toHaveLength(1);
    expect(run(commands[0] as string).stdout).toContain('- `huge`');
  });

  it('puts the notice only where a dispatched holder cannot read it: never in the definition body', async () => {
    // A subagent has the skill preloaded through `skills`, and its system prompt is
    // this body; the hook that carries the notice does not fire for it.
    const { agent } = await project(claude);
    for (const name of ['both', 'onlyhuge']) {
      const md = agent(name);
      expect(md.split('\n---\n').slice(1).join('\n---\n')).not.toContain(
        'Required reading',
      );
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

// The hook prints each skill's directory, so a longer home is a longer output. The
// projection alone counts `$HOME` as five characters and is a lower bound; install knows
// the real home and hands it down.
describe('claude — the size is weighed against the host’s real home where it is known', () => {
  const smallMd = async () =>
    (await project(claude)).text('skills/small/SKILL.md');

  it('grows a skill’s size by exactly the difference between the home and `$HOME`', async () => {
    const md = await smallMd();
    const home = '/srv/a-rather-long-home-directory';
    expect(hook.size('small', md, home)).toBe(
      hook.size('small', md) + home.length - '$HOME'.length,
    );
  });

  it('degrades a skill that fits under `$HOME` and not under the real home, naming the home', async () => {
    const md = await smallMd();
    const home = '/srv/a-rather-long-home-directory';
    const cap = hook.size('small', md);
    const adapter: HarnessAdapter = {
      ...claude,
      mainSessionSkillHook: { ...hook, cap },
    };
    const warnings: string[] = [];
    const tree = await projectPluginSet({
      plugins: [plugin],
      adapter,
      hostHome: home,
      warn: (line) => warnings.push(line),
    });
    const small = warnings.filter((w) => w.includes("'small'"));
    expect(small).toHaveLength(1);
    expect(small[0]).toContain(home);
    expect(small[0]).toContain(String(hook.size('small', md, home)));
    const def = tree.files.find((f) => f.path === 'agents/both.md')
      ?.content as string;
    const [first] = commandsOf(def);
    const printed = run(first as string, tree.files).stdout;
    expect(printed).not.toContain('SMALL');
    expect(printed).toContain('- `small`');
  });

  it('warns about nothing when the real home is short enough', async () => {
    const md = await smallMd();
    const cap = hook.size('small', md, '/h');
    const adapter: HarnessAdapter = {
      ...claude,
      mainSessionSkillHook: { ...hook, cap },
    };
    const warnings: string[] = [];
    await projectPluginSet({
      plugins: [plugin],
      adapter,
      hostHome: '/h',
      warn: (line) => warnings.push(line),
    });
    expect(warnings.filter((w) => w.includes("'small'"))).toEqual([]);
  });
});

describe('omp — no main-session hook, so no cap to weigh', () => {
  it('warns about nothing and names no required reading', async () => {
    const { warnings, agent } = await project(adapterByName('omp'));
    expect(warnings).toEqual([]);
    expect(agent('both')).not.toContain('## Required reading');
  });
});
