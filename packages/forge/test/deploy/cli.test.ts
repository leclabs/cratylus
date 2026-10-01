// CLI-level wiring proof for `cratylus deploy` (local single-host) + the
// greenfield `scaffoldProject` engine. The engine itself is covered exhaustively
// elsewhere; these assert the command layer threads opts → engine and reports the rc.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseCompanions, runDeploy } from '../../src/cli/commands/deploy.js';
import {
  DEFAULT_PROJECT_TEMPLATE,
  scaffoldProject,
} from '../../src/deploy/index.js';
import { buildHooksTree, buildRenderTree, tmp } from './helpers.js';

describe('parseCompanions', () => {
  it('parses <skill>=<spec> asset declarations into a companions map', () => {
    const c = parseCompanions('memory=logo.png');
    expect(c).toEqual({ memory: { assets: ['logo.png'] } });
  });

  it('accumulates repeated keys', () => {
    const c = parseCompanions('memory=logo.png,memory=banner.png');
    expect(c).toEqual({ memory: { assets: ['logo.png', 'banner.png'] } });
  });

  it('hard-errors on a malformed (no `=`) declaration', () => {
    expect(() => parseCompanions('memory')).toThrow(/must be <skill>=<spec>/);
  });

  it('returns undefined when nothing is declared', () => {
    expect(parseCompanions(null)).toBeUndefined();
  });
});

describe('runDeploy (local)', () => {
  it('deploys agents in-place to <home>/.claude (scope user, --home sandbox)', async () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const home = tmp('forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      kind: 'agent',
      scope: 'user',
      home,
      dryRun: false,
    });
    expect(rc).toBe(0);
    // bare-home guard appended .claude
    expect(existsSync(join(home, '.claude', 'agents', 'mav.md'))).toBe(true);
  });

  it('--kind all deploys agent + skill + hooks in ONE invocation', async () => {
    // agents/ + skills/ under root; hooks fragment at the render root (hooksDir).
    const root = tmp('forge-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const { hooksDir } = buildHooksTree(root); // hooksDir === root
    const home = tmp('forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      hooksDir,
      kind: 'all',
      scope: 'user',
      home,
      dryRun: false,
    });
    expect(rc).toBe(0);
    const cd = join(home, '.claude');
    // agent kind landed
    expect(existsSync(join(cd, 'agents', 'mav.md'))).toBe(true);
    // skill kind landed
    expect(existsSync(join(cd, 'skills', 'wake', 'SKILL.md'))).toBe(true);
    // hooks kind landed (worker scripts + merged settings.json)
    expect(
      existsSync(join(cd, 'hooks', 'stance-guardrail', 'stance-guardrail.sh')),
    ).toBe(true);
    expect(existsSync(join(cd, 'settings.json'))).toBe(true);
  });

  it('--kind agent deploys ONLY agent (single-kind half unchanged)', async () => {
    const root = tmp('forge-render-');
    const { agentsDir, skillsDir } = buildRenderTree(root);
    const { hooksDir } = buildHooksTree(root);
    const home = tmp('forge-home-');
    const rc = await runDeploy({
      agentsDir,
      skillsDir,
      hooksDir,
      kind: 'agent',
      scope: 'user',
      home,
      dryRun: false,
    });
    expect(rc).toBe(0);
    const cd = join(home, '.claude');
    expect(existsSync(join(cd, 'agents', 'mav.md'))).toBe(true);
    // skill + hooks kinds were NOT touched
    expect(existsSync(join(cd, 'skills'))).toBe(false);
    expect(existsSync(join(cd, 'settings.json'))).toBe(false);
  });

  describe('the report', () => {
    const run = async (extra: { verbose?: boolean; dryRun?: boolean } = {}) => {
      const root = tmp('forge-render-');
      const { agentsDir, skillsDir } = buildRenderTree(root);
      const { hooksDir } = buildHooksTree(root);
      const home = tmp('forge-home-');
      const lines: string[] = [];
      const warnings: string[] = [];
      const rc = await runDeploy({
        agentsDir,
        skillsDir,
        hooksDir,
        kind: 'all',
        scope: 'user',
        home,
        ...extra,
        log: (l) => lines.push(l),
        warn: (m) => warnings.push(m),
      });
      return { rc, lines, warnings, home };
    };

    it('is a short summary by default: counts, the target and the next step, no per-file line', async () => {
      const { rc, lines, home } = await run();
      expect(rc).toBe(0);
      expect(lines.length).toBeLessThanOrEqual(6);
      expect(lines[0]).toMatch(
        /^deployed \d+ agents?, \d+ skills?, 1 hook to claude/,
      );
      expect(lines[0]).toContain(join(home, '.claude'));
      expect(lines.join('\n')).not.toMatch(/===| -> /);
      expect(lines.at(-1)).toBe('next: start or restart claude');
    });

    it('says a bare --home once, whatever the number of kinds', async () => {
      const { warnings } = await run();
      expect(warnings.filter((m) => m.includes('is a home dir'))).toHaveLength(
        1,
      );
    });

    it('lists each file placed only under --verbose', async () => {
      const { lines } = await run({ verbose: true });
      const said = lines.join('\n');
      expect(said).toMatch(/skill wake -> /);
      expect(said).toMatch(/hook stance-guardrail -> /);
      expect(said).not.toContain('===');
    });

    it('a dry run says what it would do, and the next step is to run it', async () => {
      const { lines, home } = await run({ dryRun: true });
      expect(lines[0]).toMatch(/^would deploy /);
      expect(lines.at(-1)).toMatch(/without --dry-run/);
      expect(existsSync(join(home, '.claude'))).toBe(false);
    });
  });

  describe('the runtime config follows the home the run is given', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    /** A user-scope deploy to `home`, with the process's HOME another directory and
     *  `$AGENT_RUNTIME_CONFIG` as given; returns where the process's own config would be. */
    const deployTo = async (
      home: string | null,
      scope: 'user' | 'project',
      override: string | undefined,
    ) => {
      const root = tmp('forge-render-');
      const { agentsDir, skillsDir } = buildRenderTree(root);
      const processHome = tmp('forge-process-home-');
      const project = tmp('forge-project-');
      vi.stubEnv('HOME', processHome);
      vi.stubEnv('CLAUDE_CONFIG_DIR', undefined);
      vi.stubEnv('AGENT_RUNTIME_CONFIG', override);
      const rc = await runDeploy({
        agentsDir,
        skillsDir,
        kind: 'agent',
        scope,
        home,
        project,
        plugins: [{ name: 'corpus', events: ['session.start'] }],
        log: () => {},
        warn: () => {},
        fail: () => {},
      });
      expect(rc).toBe(0);
      return join(processHome, '.cratylus.json');
    };

    it('writes <home>/.cratylus.json and creates none under the process’s HOME', async () => {
      const home = tmp('forge-home-');
      const processConfig = await deployTo(home, 'user', undefined);
      expect(existsSync(join(home, '.cratylus.json'))).toBe(true);
      expect(existsSync(processConfig)).toBe(false);
    });

    it('takes the home dir of a --home that already names the harness directory', async () => {
      const home = tmp('forge-home-');
      const processConfig = await deployTo(
        join(home, '.claude'),
        'user',
        undefined,
      );
      expect(existsSync(join(home, '.cratylus.json'))).toBe(true);
      expect(existsSync(processConfig)).toBe(false);
    });

    it('writes at $AGENT_RUNTIME_CONFIG wherever that is set, whatever the home', async () => {
      const home = tmp('forge-home-');
      const set = join(tmp('forge-set-'), 'elsewhere.json');
      const processConfig = await deployTo(home, 'user', set);
      expect(existsSync(set)).toBe(true);
      expect(existsSync(join(home, '.cratylus.json'))).toBe(false);
      expect(existsSync(processConfig)).toBe(false);
    });

    it('keeps the process’s home for a project-scope deploy and for a run given no home', async () => {
      const project = await deployTo(null, 'project', undefined);
      expect(existsSync(project)).toBe(true);
      const none = await deployTo(null, 'user', undefined);
      expect(existsSync(none)).toBe(true);
    });
  });

  describe('refuses what it cannot read, and changes nothing', () => {
    /** Every file under `dir`, by its bytes. */
    const bytes = (dir: string, at = ''): Record<string, string> =>
      Object.fromEntries(
        readdirSync(join(dir, at), { withFileTypes: true }).flatMap((e) => {
          const rel = at === '' ? e.name : `${at}/${e.name}`;
          return e.isDirectory()
            ? Object.entries(bytes(dir, rel))
            : [[rel, readFileSync(join(dir, rel), 'utf-8')]];
        }),
      );

    async function deployed() {
      const root = tmp('forge-render-');
      const tree = buildRenderTree(root);
      const hooks = buildHooksTree(root);
      const home = tmp('forge-home-');
      const base = {
        ...tree,
        hooksDir: hooks.hooksDir,
        scope: 'user' as const,
        home,
      };
      expect(await runDeploy({ ...base, kind: 'all' })).toBe(0);
      const failures: string[] = [];
      const lines: string[] = [];
      const again = (extra: Partial<Parameters<typeof runDeploy>[0]>) =>
        runDeploy({
          ...base,
          kind: 'all',
          ...extra,
          log: (l) => lines.push(l),
          warn: () => {},
          fail: (m) => failures.push(m),
        });
      return {
        again,
        failures,
        lines,
        harnessDir: join(home, '.claude'),
        root,
        home,
      };
    }

    it.each([
      [
        'an --agents-dir that does not exist',
        'all',
        { agentsDir: '<nope>/agents' },
      ],
      ['the same, for --kind agent', 'agent', { agentsDir: '<nope>/agents' }],
      [
        'a --skills-dir that does not exist, for --kind skill',
        'skill',
        { skillsDir: '<nope>/skills' },
      ],
      [
        'a --from that does not exist',
        'all',
        {
          agentsDir: '<nope>/agents',
          skillsDir: '<nope>/skills',
          hooksDir: '<nope>',
        },
      ],
    ] as const)('%s', async (_name, kind, dirs) => {
      const h = await deployed();
      const nope = join(h.root, 'nope');
      const before = bytes(h.harnessDir);
      const rc = await h.again({
        kind,
        ...Object.fromEntries(
          Object.entries(dirs).map(([k, v]) => [k, v.replace('<nope>', nope)]),
        ),
      });
      expect(rc).not.toBe(0);
      expect(h.lines).toEqual([]);
      expect(h.failures).toHaveLength(1);
      expect(h.failures[0]).toContain(nope);
      expect(bytes(h.harnessDir)).toEqual(before);
    });

    it('does not ask after a dir the --kind does not read', async () => {
      const h = await deployed();
      const rc = await h.again({
        kind: 'skill',
        agentsDir: join(h.root, 'nope', 'agents'),
      });
      expect(rc).toBe(0);
      expect(h.failures).toEqual([]);
      expect(existsSync(join(h.harnessDir, 'agents', 'mav.md'))).toBe(true);
    });

    it('refuses a kind it does not know instead of deploying a kind of nothing', async () => {
      const h = await deployed();
      const before = bytes(h.harnessDir);
      expect(await h.again({ kind: 'bogus' as never })).not.toBe(0);
      expect(h.lines).toEqual([]);
      expect(h.failures).toEqual([
        "unknown kind 'bogus'; pass --kind <agent|skill|hooks|all>",
      ]);
      expect(bytes(h.harnessDir)).toEqual(before);
    });
  });
});

describe('scaffoldProject (greenfield scaffold)', () => {
  it('projects the culture + lays AGENTS.md, and lays no plans tree', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-');
    const r = scaffoldProject({
      target,
      tree: { agentsDir, skillsDir },
      template: DEFAULT_PROJECT_TEMPLATE,
      subject: 'a test project',
    });
    expect(r.rc).toBe(0);
    // culture projected (no sidecars — scaffold lays the SOUL, not the individual)
    expect(existsSync(join(target, '.claude', 'agents', 'mav.md'))).toBe(true);
    expect(
      existsSync(join(target, '.claude', 'skills', 'memory', 'SKILL.md')),
    ).toBe(true);
    expect(existsSync(join(target, '.agents', 'mav', 'SEMANTIC.md'))).toBe(
      false,
    );
    // project marker + subject woven in
    const agentsMd = readFileSync(join(target, 'AGENTS.md'), 'utf-8');
    expect(agentsMd).toMatch(/a test project/);
    // a plan's lifecycle is recorded in the `plan` domain, not laid out as folders
    // — the scaffold lays no plans tree
    expect(existsSync(join(target, 'plans'))).toBe(false);
  });

  it('refuses to clobber an existing AGENTS.md without --force', () => {
    const { agentsDir, skillsDir } = buildRenderTree(tmp('forge-render-'));
    const target = tmp('forge-scaffold-');
    const tree = { agentsDir, skillsDir };
    expect(
      scaffoldProject({
        target,
        tree,
        template: DEFAULT_PROJECT_TEMPLATE,
        subject: 's',
      }).rc,
    ).toBe(0);
    // second run refuses
    expect(
      scaffoldProject({
        target,
        tree,
        template: DEFAULT_PROJECT_TEMPLATE,
        subject: 's',
      }).rc,
    ).toBe(1);
    // --force re-scaffolds
    expect(
      scaffoldProject({
        target,
        tree,
        template: DEFAULT_PROJECT_TEMPLATE,
        subject: 's',
        force: true,
      }).rc,
    ).toBe(0);
  });
});
