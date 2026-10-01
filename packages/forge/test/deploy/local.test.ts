// Local placer contract — the agent def is regenerated substance, overwritten
// freely on every deploy. What deploy owes that contract:
//   - defs overwritten freely (regenerated substance)
//   - bare-home guard (self-correct + loud NOTE) / `.claude`-suffix used verbatim
//   - the PLACER never prunes (a removed name leaves the live tree's other files
//     standing). Convergence is the ORCHESTRATOR's job, bounded by the deploy
//     manifest — see `prune.test.ts`.
//
// An agent's self-authored memory home (`~/.agents/<name>/`) is NOT deploy's
// territory — deploy never writes there, so there is nothing here to pin.

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runDeploy } from '../../src/cli/commands/deploy.js';
import {
  MANIFEST_REL,
  deploySingle,
  placeAgentsLocal,
  placeSkillsLocal,
  projectScope,
  readManifest,
  userScope,
} from '../../src/deploy/index.js';
import { buildRenderTree, tmp } from './helpers.js';

const silent = { dry: false, log: () => {}, warn: () => {} };

describe('placeAgentsLocal', () => {
  it('never prunes: a name removed from a later deploy leaves the others standing', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav', 'nico'], silent);
    // redeploy only mav — nico's landed def is not swept
    placeAgentsLocal(claude, agentsDir, ['mav'], silent);
    expect(existsSync(join(claude, 'agents', 'nico.md'))).toBe(true);
  });

  it('warns (not throws) on a missing def', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    const warns: string[] = [];
    const r = placeAgentsLocal(claude, agentsDir, ['ghost'], {
      dry: false,
      log: () => {},
      warn: (l) => warns.push(l),
    });
    expect(r.report.copied).toBe(0);
    expect(warns.join('\n')).toMatch(/no def for ghost/);
  });

  it('dry-run changes nothing on disk', () => {
    const src = tmp('forge-render-');
    const { agentsDir } = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    placeAgentsLocal(claude, agentsDir, ['mav'], { ...silent, dry: true });
    expect(existsSync(join(claude, 'agents', 'mav.md'))).toBe(false);
  });
});

describe('a host’s model line in a deployed claude def', () => {
  const def = (model: string | undefined, body: string) =>
    `---\nname: planner\ndescription: "d"\n${model === undefined ? '' : `model: ${model}\n`}color: blue\n---\n${body}\n`;

  /** A render tree of one agent, `planner`, that later deploys re-render. */
  function fixture(harnessHome?: string) {
    const agentsDir = join(tmp('forge-render-'), 'agents');
    mkdirSync(agentsDir, { recursive: true });
    const home = tmp('forge-host-');
    const logs: string[] = [];
    const render = (model: string | undefined, body: string) =>
      writeFileSync(join(agentsDir, 'planner.md'), def(model, body), 'utf-8');
    const deploy = () =>
      deploySingle({
        kind: 'agent',
        scope: 'user',
        tree: { agentsDir, skillsDir: join(agentsDir, '..', 'skills') },
        home,
        ...(harnessHome === undefined ? {} : { harnessHome }),
        log: (l) => logs.push(l),
        warn: () => {},
      });
    const placed = join(home, harnessHome ?? '.claude', 'agents', 'planner.md');
    const edit = (from: string, to: string) =>
      writeFileSync(
        placed,
        readFileSync(placed, 'utf-8').replace(from, to),
        'utf-8',
      );
    return { render, deploy, placed, edit, logs };
  }

  it('keeps the host’s model and replaces everything else, and names it', () => {
    const f = fixture();
    f.render('opus', 'first');
    f.deploy();
    f.edit('model: opus', 'model: haiku');
    f.render('opus', 'second');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku', 'second'));
    expect(f.logs.join('\n')).toMatch(
      /kept the host's model for planner: model: haiku/,
    );
    // and again: the choice outlives every later install, not just the next one
    f.render('opus', 'third');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku', 'third'));
  });

  it('keeps a model the host removed removed', () => {
    const f = fixture();
    f.render('opus', 'first');
    f.deploy();
    f.edit('model: opus\n', '');
    f.render('opus', 'second');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def(undefined, 'second'));
  });

  it('keeps a model the host added where the render names none', () => {
    const f = fixture();
    f.render(undefined, 'first');
    f.deploy();
    f.edit('color: blue', 'model: haiku\ncolor: blue');
    f.render(undefined, 'second');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku', 'second'));
  });

  it('follows the render where the host never touched the line', () => {
    const f = fixture();
    f.render('sonnet', 'first');
    f.deploy();
    f.render('opus', 'second');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('opus', 'second'));
    f.render('sonnet', 'third');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('sonnet', 'third'));
  });

  it('keeps a model the host set on a root installed before any record existed', () => {
    const f = fixture();
    mkdirSync(join(f.placed, '..'), { recursive: true });
    writeFileSync(f.placed, def('haiku', 'old'), 'utf-8');
    f.render('opus', 'new');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku', 'new'));
  });

  it('gives a def written before any record, with no model line, the rendered one', () => {
    const f = fixture();
    mkdirSync(join(f.placed, '..'), { recursive: true });
    writeFileSync(f.placed, def(undefined, 'old'), 'utf-8');
    f.render('opus', 'new');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('opus', 'new'));
  });

  it('is claude’s alone: another harness’s def is overwritten whole', () => {
    const f = fixture('.omp');
    f.render('opus', 'first');
    f.deploy();
    f.edit('model: opus', 'model: haiku');
    f.render('opus', 'second');
    f.deploy();
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('opus', 'second'));
  });
});

describe('runDeploy with the models an operator chose', () => {
  const def = (model: string | undefined) =>
    `---\nname: planner\ndescription: "d"\n${model === undefined ? '' : `model: ${model}\n`}color: blue\n---\nbody\n`;

  function fixture(harness?: string) {
    const root = tmp('forge-render-');
    const agentsDir = join(root, 'agents');
    mkdirSync(agentsDir, { recursive: true });
    const skillsDir = join(root, 'skills');
    const home = tmp('forge-host-');
    const warnings: string[] = [];
    const failures: string[] = [];
    const render = (model: string | undefined) =>
      writeFileSync(join(agentsDir, 'planner.md'), def(model), 'utf-8');
    const deploy = (models?: Record<string, string>) =>
      runDeploy({
        agentsDir,
        skillsDir,
        kind: 'agent',
        scope: 'user',
        home,
        ...(harness === undefined ? {} : { harness }),
        ...(models === undefined ? {} : { models }),
        log: () => {},
        warn: (l) => warnings.push(l),
        fail: (l) => failures.push(l),
      });
    const harnessDir = join(home, harness === 'omp' ? '.omp' : '.claude');
    const placed = join(harnessDir, 'agents', 'planner.md');
    return { render, deploy, placed, harnessDir, warnings, failures };
  }

  it('places the chosen model, records the rendered one, and the choice outlives a deploy without models', async () => {
    const f = fixture();
    f.render('opus');
    expect(await f.deploy({ planner: 'haiku' })).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku'));
    expect(readManifest(f.harnessDir).agentModels).toEqual({ planner: 'opus' });
    expect(await f.deploy()).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku'));
  });

  it('places a chosen model where the render names none', async () => {
    const f = fixture();
    f.render(undefined);
    expect(await f.deploy({ planner: 'haiku' })).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku'));
    expect(readManifest(f.harnessDir).agentModels).toEqual({ planner: null });
  });

  it('leaves an agent it names no model for on the rendered one', async () => {
    const f = fixture();
    f.render('opus');
    expect(await f.deploy({ other: 'haiku' })).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('opus'));
  });

  it('keeps a chosen model that equals the rendered one when the rendering later moves', async () => {
    const f = fixture();
    f.render('opus');
    expect(await f.deploy({ planner: 'opus' })).toBe(0);
    expect(await f.deploy()).toBe(0);
    f.render('haiku');
    expect(await f.deploy()).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('opus'));
    expect(readManifest(f.harnessDir).agentModels).toEqual({
      planner: 'haiku',
    });
  });

  it('leaves no model line after the host deletes a chosen one that equals the rendered one', async () => {
    const f = fixture();
    f.render('opus');
    expect(await f.deploy({ planner: 'opus' })).toBe(0);
    writeFileSync(
      f.placed,
      readFileSync(f.placed, 'utf-8').replace('model: opus\n', ''),
      'utf-8',
    );
    expect(await f.deploy()).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def(undefined));
    // and it stays removed while the rendering moves, run after run
    f.render('haiku');
    expect(await f.deploy()).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def(undefined));
  });

  it('keeps a host’s edit to a chosen line, and lets a line nobody chose follow the rendering', async () => {
    const f = fixture();
    f.render('opus');
    expect(await f.deploy({ planner: 'haiku' })).toBe(0);
    writeFileSync(
      f.placed,
      readFileSync(f.placed, 'utf-8').replace('model: haiku', 'model: sonnet'),
      'utf-8',
    );
    f.render('haiku');
    expect(await f.deploy()).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('sonnet'));

    const g = fixture();
    g.render('opus');
    expect(await g.deploy()).toBe(0);
    g.render('haiku');
    expect(await g.deploy()).toBe(0);
    expect(readFileSync(g.placed, 'utf-8')).toBe(def('haiku'));
    expect(readManifest(g.harnessDir).hostModels).toEqual([]);
  });

  it('reads a manifest without the host list as it read before it', async () => {
    const f = fixture();
    f.render('opus');
    expect(await f.deploy({ planner: 'haiku' })).toBe(0);
    const { hostModels: _dropped, ...before } = readManifest(f.harnessDir);
    writeFileSync(
      join(f.harnessDir, MANIFEST_REL),
      JSON.stringify({ ...before, agentModels: { planner: null } }),
      'utf-8',
    );
    f.render('sonnet');
    expect(await f.deploy()).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('haiku'));
  });

  it('keeps a def whose host line was set before under a models entry', async () => {
    const f = fixture();
    f.render('opus');
    await f.deploy();
    writeFileSync(
      f.placed,
      readFileSync(f.placed, 'utf-8').replace('model: opus', 'model: sonnet'),
      'utf-8',
    );
    expect(await f.deploy({ planner: 'haiku' })).toBe(0);
    expect(readFileSync(f.placed, 'utf-8')).toBe(def('sonnet'));
  });

  it('refuses a non-empty models on omp, naming the harness, and places nothing', async () => {
    const f = fixture('omp');
    f.render('opus');
    expect(await f.deploy({ planner: 'haiku' })).not.toBe(0);
    expect(f.failures).toHaveLength(1);
    expect(f.failures[0]).toContain('omp');
    expect(f.warnings).toEqual([]);
    expect(existsSync(f.harnessDir)).toBe(false);
  });

  it('an empty models is no request on omp', async () => {
    const f = fixture('omp');
    f.render('opus');
    expect(await f.deploy({})).toBe(0);
    expect(existsSync(f.harnessDir)).toBe(true);
  });

  it('reports warnings to the warn sink, and not to console.error', async () => {
    const f = fixture();
    f.render('opus');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // No config and no plugins: the host runtime config cannot be emitted, and says so.
      expect(await f.deploy()).toBe(0);
      expect(f.warnings.length).toBeGreaterThan(0);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});

describe('runDeploy’s host runtime config stanza', () => {
  /** Deploy one agent for `harness` with a plugin set declaring `events`, the host
   *  config pointed at a temp file; return the stanza deploy wrote for it. */
  async function stanzaOf(harness: 'claude' | 'omp', events: string[]) {
    const root = tmp('forge-render-');
    const agentsDir = join(root, 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(agentsDir, 'planner.md'),
      '---\nname: planner\ndescription: "d"\ncolor: blue\n---\nbody\n',
      'utf-8',
    );
    const config = join(tmp('forge-host-'), 'runtime.json');
    vi.stubEnv('AGENT_RUNTIME_CONFIG', config);
    try {
      const rc = await runDeploy({
        agentsDir,
        skillsDir: join(root, 'skills'),
        kind: 'agent',
        scope: 'user',
        home: tmp('forge-host-'),
        harness,
        plugins: [{ name: 'corpus', events }],
        log: () => {},
        warn: () => {},
        fail: () => {},
      });
      expect(rc).toBe(0);
    } finally {
      vi.unstubAllEnvs();
    }
    return JSON.parse(readFileSync(config, 'utf-8')).harnesses[harness];
  }

  it('carries claude’s act bindings with their matchers, beside its names', async () => {
    const stanza = await stanzaOf('claude', [
      'tool.use.pre',
      'operator.consult.pre',
      'subagent.dispatch.pre',
    ]);
    expect(stanza.native).toEqual({ 'tool.use.pre': 'PreToolUse' });
    expect(stanza.acts).toEqual({
      'operator.consult.pre': {
        event: 'PreToolUse',
        matcher: 'AskUserQuestion',
      },
      'subagent.dispatch.pre': {
        event: 'PreToolUse',
        matcher: 'Agent|SendMessage',
      },
    });
  });

  it('carries only the acts the corpus declares, and none for a harness that exposes none', async () => {
    const claude = await stanzaOf('claude', ['tool.use.pre']);
    expect(claude.acts).toBeUndefined();
    const omp = await stanzaOf('omp', ['tool.use.pre', 'operator.consult.pre']);
    expect(omp.acts).toBeUndefined();
  });
});

describe('placeSkillsLocal', () => {
  it('copies each skill dir SKILL.md to the host skills root', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');

    const r = placeSkillsLocal(claude, tree, ['wake', 'memory'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(2);
    expect(existsSync(join(claude, 'skills', 'memory', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(claude, 'skills', 'wake', 'SKILL.md'))).toBe(true);
  });

  it('recurses nested subdirs (scripts/references) preserving structure + exec bit', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    // a skill dir carrying co-located companions in nested subdirs
    const recur = join(tree.skillsDir, 'recur');
    mkdirSync(join(recur, 'scripts'), { recursive: true });
    mkdirSync(join(recur, 'references'), { recursive: true });
    writeFileSync(join(recur, 'SKILL.md'), '# recur\n', 'utf-8');
    const script = join(recur, 'scripts', 'x.mjs');
    writeFileSync(script, '#!/usr/bin/env node\n', 'utf-8');
    chmodSync(script, 0o755); // exec bit set at source
    writeFileSync(join(recur, 'references', 'y.md'), '# y\n', 'utf-8');

    const claude = join(tmp('forge-host-'), '.claude');
    const r = placeSkillsLocal(claude, tree, ['recur'], silent);
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(1);

    // (1) the subtree lands INTACT at the mirrored dest paths
    const destScript = join(claude, 'skills', 'recur', 'scripts', 'x.mjs');
    expect(readFileSync(destScript, 'utf-8')).toBe('#!/usr/bin/env node\n');
    expect(
      readFileSync(
        join(claude, 'skills', 'recur', 'references', 'y.md'),
        'utf-8',
      ),
    ).toBe('# y\n');
    // (2) exec bit preserved on scripts/*
    expect(statSync(destScript).mode & 0o111).not.toBe(0);
  });

  it('a flat SKILL.md-only skill deploys exactly one file (no regression)', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    const claude = join(tmp('forge-host-'), '.claude');
    placeSkillsLocal(claude, tree, ['wake'], silent);
    // wake is SKILL.md-only — dest holds exactly that, no phantom subdirs
    expect(readdirSync(join(claude, 'skills', 'wake'))).toEqual(['SKILL.md']);
  });

  it('stages a committed `assets:` companion beside SKILL.md', () => {
    const src = tmp('forge-render-');
    const tree = buildRenderTree(src);
    // seed a committed asset in the memory skill source dir
    writeFileSync(
      join(tree.skillsDir, 'memory', 'logo.txt'),
      'LOGO\n',
      'utf-8',
    );
    const claude = join(tmp('forge-host-'), '.claude');

    const r = placeSkillsLocal(
      claude,
      { ...tree, companions: { memory: { assets: ['logo.txt'] } } },
      ['memory'],
      silent,
    );
    expect(r.rc).toBe(0);
    expect(existsSync(join(claude, 'skills', 'memory', 'logo.txt'))).toBe(true);
  });
});

describe('scope resolution', () => {
  it('userScope: bare home self-corrects (.claude appended) with a loud NOTE', () => {
    const r = userScope('/Users/lex');
    expect(r.harnessDir.endsWith('/.claude')).toBe(true);
    expect(r.note?.message).toMatch(/is a home dir; deploying to/);
  });

  it('userScope: a path already ending in .claude is used verbatim (no NOTE)', () => {
    const r = userScope('/Users/lex/.claude');
    expect(r.harnessDir).toBe('/Users/lex/.claude');
    expect(r.note).toBeNull();
  });

  it('userScope: with no home, the directory the harness’s variable names when it is set and non-empty; a named home overrules it', () => {
    const set = tmp('forge-config-');
    const homeDir = tmp('forge-host-');
    vi.stubEnv('HOME', homeDir);
    vi.stubEnv('FIXTURE_HARNESS_DIR', set);
    expect(userScope(null, '.fix', 'FIXTURE_HARNESS_DIR').harnessDir).toBe(set);
    expect(
      userScope('/Users/lex', '.fix', 'FIXTURE_HARNESS_DIR').harnessDir,
    ).toBe('/Users/lex/.fix');
    vi.stubEnv('FIXTURE_HARNESS_DIR', '');
    expect(userScope(null, '.fix', 'FIXTURE_HARNESS_DIR').harnessDir).toBe(
      join(homeDir, '.fix'),
    );
    expect(userScope(null, '.fix').harnessDir).toBe(join(homeDir, '.fix'));
    vi.unstubAllEnvs();
  });

  it('deploy, given no home, places under the directory the claude adapter’s variable names, and nothing under $HOME/.claude', async () => {
    const set = tmp('forge-config-');
    const homeDir = tmp('forge-host-');
    vi.stubEnv('HOME', homeDir);
    vi.stubEnv('CLAUDE_CONFIG_DIR', set);
    const root = tmp('forge-render-');
    const agentsDir = join(root, 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(agentsDir, 'planner.md'),
      '---\nname: planner\ndescription: "d"\n---\nbody\n',
      'utf-8',
    );
    const rc = await runDeploy({
      agentsDir,
      skillsDir: join(root, 'skills'),
      kind: 'agent',
      scope: 'user',
      harness: 'claude',
      log: () => {},
      warn: () => {},
      fail: () => {},
    });
    vi.unstubAllEnvs();
    expect(rc).toBe(0);
    expect(existsSync(join(set, 'agents', 'planner.md'))).toBe(true);
    expect(existsSync(join(homeDir, '.claude'))).toBe(false);
  });

  it('projectScope: <project>/.claude', () => {
    const r = projectScope('/repo');
    expect(r.harnessDir).toBe('/repo/.claude');
  });
});
