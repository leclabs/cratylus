import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runInit } from '../../src/cli/commands/init.js';
import { resolveAgentsConfig } from '../../src/config/index.js';
import type { AgentPlugin } from '../../src/resolve/plugin.js';

/** The real canon corpus dimensions dir — the default plugin's fragment source. */
const CANON_DIMENSIONS = fileURLToPath(
  new URL('../../../agent-canon/src/dimensions', import.meta.url),
);

describe('CLI commands (integration)', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-cli-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('init scaffolds a project from the default plugin, resolvable through resolve()', async () => {
    // (1) init on an empty dir scaffolds the config-is-code home whose zero-config
    // default `extends: [canon]` — the default is A PACKAGE, not a baked template.
    const code = await runInit({ scope: 'project', cwd });
    expect(code).toBe(0);
    const configSrc = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(configSrc).toContain("import canon from '@leclabs/agent-canon'");
    expect(configSrc).toMatch(/extends:\s*\[canon\]/);
    expect(configSrc).toMatch(/patches:\s*\[\]/);

    // (2) that default plugin resolves through the NORMAL resolve() with empty
    // patches → the canon default fragment set (defaults-are-a-package, §2). The
    // canon plugin self-locates its dirs at runtime; the test supplies the same
    // dir directly (forge cannot bare-import the peer package).
    const canon: AgentPlugin = {
      name: 'canon',
      fragments: CANON_DIMENSIONS,
    };
    const resolved = await resolveAgentsConfig({
      extends: [canon],
      patches: [],
    });
    expect(resolved.fragments.size).toBeGreaterThan(100);
    const byId = new Map(
      [...resolved.fragments.values()].map((r) => [r.fragment.id, r.value]),
    );
    expect(byId.get('canon:objective/parsimony')).toBe('parsimony');
  });
});
