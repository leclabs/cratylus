// Hooks placer + settings-merge tests:
//   - mergeHooksSettings is NON-DESTRUCTIVE (preserves permissions/env/other
//     hooks/unrelated keys) and IDEMPOTENT (a second merge of the same command
//     adds nothing).
//   - placeHooksLocal ships the worker scripts to <claudeDir>/hooks/<id>/ and
//     merges the projected hooks block into the host settings.json, creating it
//     if absent and merging if present.
//   - the `hooks` deploy kind lists its render-tree hook ids (treeNames).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  mergeHooksSettings,
  placeHooksLocal,
  treeNames,
} from '../../src/deploy/index.js';
import { buildHooksTree, tmp } from './helpers.js';

const silent = { dry: false, log: () => {}, warn: () => {} };
const STANCE_CMD =
  'sh "$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh"';

describe('mergeHooksSettings', () => {
  it('preserves unrelated keys and pre-existing hooks (non-destructive)', () => {
    const existing = {
      permissions: { allow: ['Bash(ls:*)'] },
      env: { FOO: 'bar' },
      hooks: {
        Stop: [{ hooks: [{ type: 'command' as const, command: 'echo old' }] }],
      },
    };
    const incoming = {
      Stop: [
        {
          hooks: [
            { type: 'command' as const, command: STANCE_CMD, timeout: 60 },
          ],
        },
      ],
      SubagentStop: [
        {
          hooks: [
            { type: 'command' as const, command: STANCE_CMD, timeout: 60 },
          ],
        },
      ],
    };
    const { settings, added } = mergeHooksSettings(existing, incoming);
    expect(added).toBe(2);
    // unrelated keys untouched
    expect(settings.permissions).toEqual({ allow: ['Bash(ls:*)'] });
    expect(settings.env).toEqual({ FOO: 'bar' });
    // pre-existing Stop hook preserved, ours appended
    const hooks = settings.hooks as Record<
      string,
      Array<{ hooks: Array<{ command: string }> }>
    >;
    expect(hooks.Stop).toHaveLength(2);
    expect(hooks.Stop[0]?.hooks[0]?.command).toBe('echo old');
    expect(hooks.Stop[1]?.hooks[0]?.command).toBe(STANCE_CMD);
    expect(hooks.SubagentStop).toHaveLength(1);
  });

  it('is idempotent — re-merging the same command adds nothing', () => {
    const incoming = {
      Stop: [{ hooks: [{ type: 'command' as const, command: STANCE_CMD }] }],
    };
    const once = mergeHooksSettings({}, incoming);
    expect(once.added).toBe(1);
    const twice = mergeHooksSettings(once.settings, incoming);
    expect(twice.added).toBe(0);
    const hooks = twice.settings.hooks as Record<string, unknown[]>;
    expect(hooks.Stop).toHaveLength(1);
  });
});

describe('placeHooksLocal', () => {
  it('ships worker scripts and merges into an absent settings.json', () => {
    const src = tmp('agent-forge-hooks-render-');
    const { hooksDir } = buildHooksTree(src);
    const claude = join(tmp('agent-forge-hooks-host-'), '.claude');

    const r = placeHooksLocal(
      claude,
      { agentsDir: '', skillsDir: '', hooksDir },
      treeNames('hooks', { agentsDir: '', skillsDir: '', hooksDir }),
      silent,
    );
    expect(r.rc).toBe(0);
    expect(r.report.copied).toBe(1);

    // worker scripts landed
    const worker = join(
      claude,
      'hooks',
      'stance-guardrail',
      'stance-guardrail.sh',
    );
    expect(existsSync(worker)).toBe(true);
    expect(
      existsSync(join(claude, 'hooks', 'stance-guardrail', 'stance-judge.sh')),
    ).toBe(true);

    // settings.json created with our hooks
    const settings = JSON.parse(
      readFileSync(join(claude, 'settings.json'), 'utf-8'),
    ) as { hooks: Record<string, unknown[]> };
    expect(settings.hooks.Stop).toHaveLength(1);
    expect(settings.hooks.SubagentStop).toHaveLength(1);
  });

  it('merges into a pre-existing settings.json without clobbering', () => {
    const src = tmp('agent-forge-hooks-render-');
    const { hooksDir } = buildHooksTree(src);
    const claude = join(tmp('agent-forge-hooks-host-'), '.claude');
    // pre-seed a settings.json with other keys.
    mkdirSync(claude, { recursive: true });
    writeFileSync(
      join(claude, 'settings.json'),
      JSON.stringify({ permissions: { allow: ['Bash(git:*)'] } }, null, 2),
    );

    placeHooksLocal(
      claude,
      { agentsDir: '', skillsDir: '', hooksDir },
      ['stance-guardrail'],
      silent,
    );
    const settings = JSON.parse(
      readFileSync(join(claude, 'settings.json'), 'utf-8'),
    ) as { permissions: unknown; hooks: Record<string, unknown[]> };
    expect(settings.permissions).toEqual({ allow: ['Bash(git:*)'] });
    expect(settings.hooks.Stop).toHaveLength(1);
  });

  it('dry-run changes nothing on disk', () => {
    const src = tmp('agent-forge-hooks-render-');
    const { hooksDir } = buildHooksTree(src);
    const claude = join(tmp('agent-forge-hooks-host-'), '.claude');
    placeHooksLocal(
      claude,
      { agentsDir: '', skillsDir: '', hooksDir },
      ['stance-guardrail'],
      { dry: true, log: () => {}, warn: () => {} },
    );
    expect(existsSync(join(claude, 'settings.json'))).toBe(false);
    expect(existsSync(join(claude, 'hooks'))).toBe(false);
  });
});

describe('treeNames(hooks)', () => {
  it('lists the hook ids in the render tree', () => {
    const src = tmp('agent-forge-hooks-render-');
    const { hooksDir } = buildHooksTree(src);
    expect(
      treeNames('hooks', { agentsDir: '', skillsDir: '', hooksDir }),
    ).toEqual(['stance-guardrail']);
  });
});
