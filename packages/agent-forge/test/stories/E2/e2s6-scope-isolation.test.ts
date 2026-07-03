/**
 * E2.S6 · scope isolation — no cross-scope bleed.
 * Contract: plans/interop-hardening/stories/E2-ir-emission.md.
 * Same-named rule `r` in user-scope IR (body U) and project-scope IR (body P);
 * each compiles only into the scope its manifest declares.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import type { IR } from '../../../src/core/index.js';
import { compile, writeIR } from '../../../src/core/index.js';
import { adapterById, fakeHome, makeTmpDir, story } from '../helpers.js';

const BODY_U = 'USER-SCOPE-BODY unique to the user tier.';
const BODY_P = 'PROJECT-SCOPE-BODY unique to the project tier.';

const ruleIR = (
  scope: 'user' | 'project',
  body: string,
  target: string,
): IR => ({
  manifest: { agentForge: 1, scope, targets: [target] },
  rules: [{ id: 'r', body }],
});

describe('E2.S6 · scope isolation — no cross-scope bleed', () => {
  let proj: string;
  let home: string;
  let restoreHome: () => void;

  beforeEach(() => {
    proj = makeTmpDir();
    const fh = fakeHome();
    home = fh.home;
    restoreHome = fh.restore;
  });
  afterEach(() => {
    restoreHome();
    rmSync(proj, { recursive: true, force: true });
  });

  async function compileBothScopes(target: string): Promise<void> {
    const adapter = adapterById.get(target);
    if (!adapter) throw new Error(`no adapter ${target}`);
    await writeIR(ruleIR('user', BODY_U, target), 'user', proj);
    await writeIR(ruleIR('project', BODY_P, target), 'project', proj);
    await compile(ruleIR('user', BODY_U, target), [adapter], 'user', proj, {});
    await compile(
      ruleIR('project', BODY_P, target),
      [adapter],
      'project',
      proj,
      {},
    );
  }

  story(
    'E2.S6',
    'claude: user output carries body U only, project output body P only',
    async () => {
      await compileBothScopes('claude');
      const userOut = readFileSync(join(home, '.claude', 'CLAUDE.md'), 'utf8');
      const projOut = readFileSync(join(proj, 'CLAUDE.md'), 'utf8');
      expect(userOut).toContain(BODY_U);
      expect(userOut).not.toContain(BODY_P);
      expect(projOut).toContain(BODY_P);
      expect(projOut).not.toContain(BODY_U);
      expect(userOut).not.toBe(projOut); // no merge, no clobber across scopes
    },
  );

  story(
    'E2.S6',
    'codex: user output carries body U only, project output body P only',
    async () => {
      await compileBothScopes('codex');
      const userOut = readFileSync(join(home, '.codex', 'AGENTS.md'), 'utf8');
      const projOut = readFileSync(join(proj, 'AGENTS.md'), 'utf8');
      expect(userOut).toContain(BODY_U);
      expect(userOut).not.toContain(BODY_P);
      expect(projOut).toContain(BODY_P);
      expect(projOut).not.toContain(BODY_U);
      expect(userOut).not.toBe(projOut);
    },
  );
});
