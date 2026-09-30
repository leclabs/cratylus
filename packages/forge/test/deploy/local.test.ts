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
import { describe, expect, it } from 'vitest';
import {
  deploySingle,
  placeAgentsLocal,
  placeSkillsLocal,
  projectScope,
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
    expect(r.note?.message).toMatch(/is a home dir -> deploying to/);
  });

  it('userScope: a path already ending in .claude is used verbatim (no NOTE)', () => {
    const r = userScope('/Users/lex/.claude');
    expect(r.harnessDir).toBe('/Users/lex/.claude');
    expect(r.note).toBeNull();
  });

  it('projectScope: <project>/.claude', () => {
    const r = projectScope('/repo');
    expect(r.harnessDir).toBe('/repo/.claude');
  });
});
