/**
 * E1.S6 · scope-faithful lift — user-scope config lands in user-scope IR
 * (~/.agent-forge, fake $HOME), project-scope in the project .agent-forge;
 * neither leaks into the other; both manifests carry the correct scope.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { runImport } from '../../../src/cli/commands/import.js';
import { ALL_ADAPTERS, story } from '../helpers.js';
import { captured, put, scratch } from './util.js';

const fx = scratch();

story(
  'E1.S6',
  'user-scope agent lands in ~/.agent-forge, project-scope in ./.agent-forge, manifests carry scope',
  async () => {
    const home = fx.home();
    const cwd = fx.tmp();
    put(
      home,
      '.claude/agents/u.md',
      '---\ndescription: User-scope agent\n---\nYou are u.',
    );
    put(
      cwd,
      '.claude/agents/p.md',
      '---\ndescription: Project-scope agent\n---\nYou are p.',
    );

    const user = await captured(() =>
      runImport({ client: 'claude', scope: 'user', cwd }, ALL_ADAPTERS),
    );
    expect(user.code).toBe(0);
    const project = await captured(() =>
      runImport({ client: 'claude', scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(project.code).toBe(0);

    const userRoot = join(home, '.agent-forge');
    const projRoot = join(cwd, '.agent-forge');

    expect(existsSync(join(userRoot, 'agents', 'u.md'))).toBe(true);
    expect(existsSync(join(projRoot, 'agents', 'p.md'))).toBe(true);
    // no cross-scope leakage
    expect(existsSync(join(userRoot, 'agents', 'p.md'))).toBe(false);
    expect(existsSync(join(projRoot, 'agents', 'u.md'))).toBe(false);

    expect(readFileSync(join(userRoot, 'manifest.yaml'), 'utf8')).toContain(
      'scope: user',
    );
    expect(readFileSync(join(projRoot, 'manifest.yaml'), 'utf8')).toContain(
      'scope: project',
    );
  },
);
