// P4 — the two scaffold verbs' write side: `scaffoldAgentsConfig` (init) and
// `addPlugin` (add). Proves init scaffolds `extends: [anatomy]`, and add appends a
// real import + extends member (idempotent, loud on an unrecognized shape).

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ConfigEditError,
  addPlugin,
  identForPackage,
  scaffoldAgentsConfig,
} from '../../src/config/index.js';

describe('scaffoldAgentsConfig — the init zero-config default', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-scaffold-'));
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('writes agents.config.ts extending [anatomy] with empty patches', async () => {
    const res = await scaffoldAgentsConfig(cwd);
    expect(res.created).toBe(true);
    const src = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(src).toContain("import anatomy from '@leclabs/agent-anatomy'");
    expect(src).toMatch(/extends:\s*\[anatomy\]/);
    expect(src).toMatch(/patches:\s*\[\]/);
  });

  it('is idempotent — an existing config is left untouched', async () => {
    await scaffoldAgentsConfig(cwd);
    const first = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    const res = await scaffoldAgentsConfig(cwd);
    expect(res.created).toBe(false);
    expect(readFileSync(join(cwd, 'agents.config.ts'), 'utf8')).toBe(first);
  });
});

describe('addPlugin — wire a plugin into extends', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-add-'));
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('appends a real import + extends member', async () => {
    await scaffoldAgentsConfig(cwd);
    const res = await addPlugin(cwd, '@acme/agent-x');
    expect(res.changed).toBe(true);
    expect(res.ident).toBe('agentX');
    const src = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(src).toContain("import agentX from '@acme/agent-x'");
    expect(src).toMatch(/extends:\s*\[anatomy,\s*agentX\]/);
  });

  it('is idempotent — re-adding the same package does not rewrite', async () => {
    await scaffoldAgentsConfig(cwd);
    await addPlugin(cwd, '@acme/agent-x');
    const once = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    const res = await addPlugin(cwd, '@acme/agent-x');
    expect(res.changed).toBe(false);
    expect(readFileSync(join(cwd, 'agents.config.ts'), 'utf8')).toBe(once);
  });

  it('refuses loudly when no agents.config.ts exists', async () => {
    await expect(addPlugin(cwd, '@acme/agent-x')).rejects.toBeInstanceOf(
      ConfigEditError,
    );
    expect(existsSync(join(cwd, 'agents.config.ts'))).toBe(false);
  });

  it('derives safe identifiers from package specifiers', () => {
    expect(identForPackage('@leclabs/agent-anatomy')).toBe('agentAnatomy');
    expect(identForPackage('foo-bar_baz')).toBe('fooBarBaz');
    expect(identForPackage('@acme/9lives')).toBe('_9lives');
  });
});
