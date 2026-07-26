// V4 · deploy-prune — the deploy target must CONVERGE to the render tree.
//
// Before this suite the deploy layer only ever UNIONED: a retired artifact lived
// in `~/.claude` forever, and at least one such orphan actively instructed agents
// to invoke a binary that no longer existed. Convergence needs subtraction.
//
// Subtraction on the operator's machine is a data-loss hazard, so the prune is
// bounded by a MANIFEST of what a prior deploy of this render tree actually
// wrote. Attribution is by record, never by naming convention — anything absent
// from the manifest is somebody else's artifact and is untouchable. The
// exoneration test below is therefore not optional: a prune with no exonerating
// fixture is a data-loss gate.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deploySingle } from '../../src/deploy/index.js';
import { tmp } from './helpers.js';

const silent = { log: () => {}, warn: () => {} };

/** Build a render tree holding exactly the named agents + skills. */
function renderTree(
  agents: string[],
  skills: string[],
): { agentsDir: string; skillsDir: string } {
  const root = tmp('v4-render-');
  const agentsDir = join(root, 'agents');
  const skillsDir = join(root, 'skills');
  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });
  for (const a of agents) {
    writeFileSync(join(agentsDir, `${a}.md`), `# ${a} def\n`, 'utf-8');
  }
  for (const s of skills) {
    mkdirSync(join(skillsDir, s), { recursive: true });
    writeFileSync(join(skillsDir, s, 'SKILL.md'), `# ${s}\n`, 'utf-8');
  }
  return { agentsDir, skillsDir };
}

/** A hooks render tree carrying exactly the named hook ids, each registered on
 *  Stop with a command that points at its own deployed worker. */
function hooksTree(ids: string[]): { hooksDir: string } {
  const root = tmp('v4-hooks-');
  const settings = {
    hooks: {
      Stop: ids.map((id) => ({
        hooks: [
          {
            type: 'command',
            command: `sh "$HOME/.claude/hooks/${id}/${id}.sh"`,
          },
        ],
      })),
    },
  };
  writeFileSync(
    join(root, 'settings.json'),
    `${JSON.stringify(settings, null, 2)}\n`,
    'utf-8',
  );
  for (const id of ids) {
    mkdirSync(join(root, 'hooks', id), { recursive: true });
    writeFileSync(join(root, 'hooks', id, `${id}.sh`), `# ${id}\n`, 'utf-8');
  }
  return { hooksDir: root };
}

/** Every file under `dir`, as sorted `/`-joined relative paths. */
function fileSet(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    if (!existsSync(d)) {
      return;
    }
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) {
        walk(p);
      } else {
        out.push(relative(dir, p).split(sep).join('/'));
      }
    }
  };
  walk(dir);
  return out.sort();
}

describe('deploy prune — convergence to the render tree', () => {
  it('FALSIFIER: a skill dropped from render tree B is ABSENT from the target', () => {
    const claude = join(tmp('v4-host-'), '.claude');
    const a = renderTree([], ['wake', 'memory']);
    const b = renderTree([], ['wake']);

    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    expect(existsSync(join(claude, 'skills', 'memory', 'SKILL.md'))).toBe(true);

    // B drops `memory`. Convergence means the target drops it too.
    const r = deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: b,
      home: claude,
      ...silent,
    });
    expect(r.rc).toBe(0);
    expect(existsSync(join(claude, 'skills', 'memory'))).toBe(false);
    // the retained skill is untouched
    expect(existsSync(join(claude, 'skills', 'wake', 'SKILL.md'))).toBe(true);
  });

  it('EXONERATION: artifacts this tool never wrote SURVIVE the prune', () => {
    const claude = join(tmp('v4-host-'), '.claude');
    const a = renderTree(['mav'], ['wake', 'memory']);
    const b = renderTree(['mav'], ['wake']);

    // Foreign artifacts, planted the way a real `~/.claude` accumulates them:
    // a user-installed skill (`graphify install` does exactly this), a
    // hand-authored agent def, a harness file, and a stray file INSIDE a dir we
    // do own — none of them ever passed through this deploy.
    mkdirSync(join(claude, 'skills', 'graphify'), { recursive: true });
    writeFileSync(join(claude, 'skills', 'graphify', 'SKILL.md'), 'FOREIGN\n');
    mkdirSync(join(claude, 'agents'), { recursive: true });
    writeFileSync(join(claude, 'agents', 'handwritten.md'), 'FOREIGN\n');
    writeFileSync(join(claude, 'CLAUDE.md'), 'FOREIGN\n');

    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    writeFileSync(join(claude, 'skills', 'wake', 'NOTES.md'), 'FOREIGN\n');

    deploySingle({
      kind: 'agent',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: b,
      home: claude,
      ...silent,
    });
    deploySingle({
      kind: 'agent',
      scope: 'user',
      tree: b,
      home: claude,
      ...silent,
    });

    // the retired skill is gone …
    expect(existsSync(join(claude, 'skills', 'memory'))).toBe(false);
    // … and every foreign artifact stands
    expect(
      readFileSync(join(claude, 'skills', 'graphify', 'SKILL.md'), 'utf-8'),
    ).toBe('FOREIGN\n');
    expect(
      readFileSync(join(claude, 'agents', 'handwritten.md'), 'utf-8'),
    ).toBe('FOREIGN\n');
    expect(readFileSync(join(claude, 'CLAUDE.md'), 'utf-8')).toBe('FOREIGN\n');
    expect(
      readFileSync(join(claude, 'skills', 'wake', 'NOTES.md'), 'utf-8'),
    ).toBe('FOREIGN\n');
  });

  it('idempotence: deploying the same tree twice is a no-op the second time', () => {
    const claude = join(tmp('v4-host-'), '.claude');
    const a = renderTree(['mav', 'nico'], ['wake', 'memory']);

    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    deploySingle({
      kind: 'agent',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    const before = fileSet(claude);
    const beforeBytes = new Map(
      before.map((f) => [f, readFileSync(join(claude, f), 'utf-8')] as const),
    );

    const pruned: string[] = [];
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      log: (l) => {
        if (/prune/i.test(l)) {
          pruned.push(l);
        }
      },
      warn: () => {},
    });
    deploySingle({
      kind: 'agent',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });

    expect(fileSet(claude)).toEqual(before);
    for (const [f, bytes] of beforeBytes) {
      expect(readFileSync(join(claude, f), 'utf-8')).toBe(bytes);
    }
    // nothing was reported removed on the repeat
    expect(pruned.join('\n')).not.toMatch(/removed/i);
  });

  it('dry-run REPORTS the deletion set and deletes nothing', () => {
    const claude = join(tmp('v4-host-'), '.claude');
    const a = renderTree([], ['wake', 'memory']);
    const b = renderTree([], ['wake']);

    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    const lines: string[] = [];
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: b,
      home: claude,
      dry: true,
      log: (l) => lines.push(l),
      warn: () => {},
    });
    // the operator can SEE what would go …
    expect(lines.join('\n')).toMatch(/skills\/memory\/SKILL\.md/);
    // … and nothing went
    expect(existsSync(join(claude, 'skills', 'memory', 'SKILL.md'))).toBe(true);
  });

  it('an unattributable orphan is REPORTED by the dry-run and never deleted', () => {
    // The live case this shard came from: a skill left in `~/.claude` by a
    // deploy that predates the manifest. It has no source cell and it can
    // instruct an agent to run a binary that no longer exists — but it is
    // byte-for-byte indistinguishable from an operator's own skill, so the
    // prune must NOT take it. Surfacing it is the whole remedy.
    const claude = join(tmp('v4-host-'), '.claude');
    mkdirSync(join(claude, 'skills', 'legacy-orphan'), { recursive: true });
    writeFileSync(
      join(claude, 'skills', 'legacy-orphan', 'SKILL.md'),
      '# run the binary that no longer exists\n',
    );
    const a = renderTree([], ['wake']);

    const lines: string[] = [];
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      dry: true,
      log: (l) => lines.push(l),
      warn: () => {},
    });
    const out = lines.join('\n');
    expect(out).toMatch(/UNATTRIBUTABLE/);
    expect(out).toMatch(/\? legacy-orphan/);
    // reported, NOT taken
    expect(
      existsSync(join(claude, 'skills', 'legacy-orphan', 'SKILL.md')),
    ).toBe(true);
    // and a real deploy leaves it standing too
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    expect(
      existsSync(join(claude, 'skills', 'legacy-orphan', 'SKILL.md')),
    ).toBe(true);
  });

  it('--only NARROWS the prune scope: a name outside the subset is never swept', () => {
    const claude = join(tmp('v4-host-'), '.claude');
    const a = renderTree([], ['wake', 'memory']);
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });

    // A narrowed deploy is a SUBSET intent, not a convergence statement.
    const b = renderTree([], ['wake']);
    deploySingle({
      kind: 'skill',
      scope: 'user',
      tree: b,
      home: claude,
      only: ['wake'],
      ...silent,
    });
    expect(existsSync(join(claude, 'skills', 'memory', 'SKILL.md'))).toBe(true);
  });

  it('agents: a retired def is removed, its memory sidecar is NEVER touched', () => {
    const claude = join(tmp('v4-host-'), '.claude');
    const a = renderTree(['mav', 'nico'], []);
    const b = renderTree(['mav'], []);

    deploySingle({
      kind: 'agent',
      scope: 'user',
      tree: a,
      home: claude,
      ...silent,
    });
    const sidecar = join(dirname(claude), '.agents', 'nico', 'SEMANTIC.md');
    writeFileSync(sidecar, 'NICO LIVED HISTORY\n', 'utf-8');

    deploySingle({
      kind: 'agent',
      scope: 'user',
      tree: b,
      home: claude,
      ...silent,
    });
    // the regenerated substance goes …
    expect(existsSync(join(claude, 'agents', 'nico.md'))).toBe(false);
    // … the self-authored individual is inviolable
    expect(readFileSync(sidecar, 'utf-8')).toBe('NICO LIVED HISTORY\n');
  });

  it('hooks: a retired hook loses its workers AND its settings registration; foreign entries spared', () => {
    const claude = join(tmp('v4-host-'), '.claude');
    mkdirSync(claude, { recursive: true });
    writeFileSync(
      join(claude, 'settings.json'),
      `${JSON.stringify(
        {
          env: { FOO: 'bar' },
          hooks: {
            Stop: [{ hooks: [{ type: 'command', command: 'echo foreign' }] }],
          },
        },
        null,
        2,
      )}\n`,
      'utf-8',
    );
    const a = hooksTree(['stance-guardrail', 'retired-hook']);
    const b = hooksTree(['stance-guardrail']);
    const noTree = { agentsDir: '', skillsDir: '' };

    deploySingle({
      kind: 'hooks',
      scope: 'user',
      tree: { ...noTree, ...a },
      home: claude,
      ...silent,
    });
    expect(
      existsSync(join(claude, 'hooks', 'retired-hook', 'retired-hook.sh')),
    ).toBe(true);
    expect(readFileSync(join(claude, 'settings.json'), 'utf-8')).toContain(
      'retired-hook',
    );

    deploySingle({
      kind: 'hooks',
      scope: 'user',
      tree: { ...noTree, ...b },
      home: claude,
      ...silent,
    });
    // workers gone
    expect(existsSync(join(claude, 'hooks', 'retired-hook'))).toBe(false);
    const after = readFileSync(join(claude, 'settings.json'), 'utf-8');
    // registration gone — a dangling command would fire on every Stop
    expect(after).not.toContain('retired-hook');
    // the live hook + the foreign entry + the foreign key all stand
    expect(after).toContain('stance-guardrail');
    expect(after).toContain('echo foreign');
    expect(after).toContain('"FOO": "bar"');
  });
});
