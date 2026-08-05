// P4 — the two scaffold verbs' write side: `scaffoldAgentsConfig` (init) and
// `addPlugin` (add). Proves init scaffolds `extends: [canon]`, and add appends a
// real import + extends member (idempotent, loud on an unrecognized shape).

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ConfigEditError,
  DEFAULT_PLUGIN_PACKAGE,
  addPlugin,
  identForPackage,
  scaffoldAgentsConfig,
} from '../../src/config/index.js';

describe('scaffoldAgentsConfig — the init zero-config default', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-scaffold-'));
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('writes agents.config.ts extending [canon] with empty patches', async () => {
    // AMENDED (t-canon-package-default): this used to assert the literal
    // '@cratylus/canon' as the ONLY corpus the scaffold could name. It now pins
    // the DEFAULT — what you get when you name no plugin — while the companion
    // test below proves the default is overridable. The literal is still
    // asserted, once, on the constant: the default value is a real design
    // decision and stays gated. Reading it off the constant everywhere else is
    // what keeps the pin from re-freezing the hardcode.
    expect(DEFAULT_PLUGIN_PACKAGE).toBe('@cratylus/canon');
    const res = await scaffoldAgentsConfig(cwd);
    expect(res.created).toBe(true);
    expect(res.plugin).toBe(DEFAULT_PLUGIN_PACKAGE);
    const src = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(src).toContain(`import canon from '${DEFAULT_PLUGIN_PACKAGE}'`);
    expect(src).toMatch(/extends:\s*\[canon\]/);
    expect(src).toMatch(/patches:\s*\[\]/);
  });

  it('scaffolds against a plugin that is NOT this corpus', async () => {
    // The defect this proves gone: the scaffold used to name `@cratylus/canon`
    // by construction, so every scaffolded project extended THIS corpus with no
    // way out — the projector deciding what the design IS. The default stays;
    // the unoverridability is what was the defect.
    const res = await scaffoldAgentsConfig(cwd, { plugin: '@acme/corpus' });
    expect(res.created).toBe(true);
    const src = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(src).toContain("import corpus from '@acme/corpus'");
    expect(src).toMatch(/extends:\s*\[corpus\]/);
    expect(src).toMatch(/patches:\s*\[\]/);
    expect(src).not.toContain('@cratylus/canon');
    expect(res.plugin).toBe('@acme/corpus');
  });

  it('refuses an unusable plugin specifier rather than writing a broken config', async () => {
    await expect(
      scaffoldAgentsConfig(cwd, { plugin: '   ' }),
    ).rejects.toBeInstanceOf(ConfigEditError);
    expect(existsSync(join(cwd, 'agents.config.ts'))).toBe(false);
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
    cwd = mkdtempSync(join(tmpdir(), 'forge-add-'));
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('appends a real import + extends member', async () => {
    await scaffoldAgentsConfig(cwd);
    const res = await addPlugin(cwd, '@acme/agent-x');
    expect(res.changed).toBe(true);
    expect(res.ident).toBe('agentX');
    const src = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(src).toContain("import agentX from '@acme/agent-x'");
    expect(src).toMatch(/extends:\s*\[canon,\s*agentX\]/);
  });

  it('edits a scaffold built on a non-default plugin', async () => {
    // The edit path reads the config's SHAPE, not this corpus's name — so a
    // project scaffolded against another plugin is a first-class citizen of
    // `add`, not a degraded one.
    await scaffoldAgentsConfig(cwd, { plugin: '@acme/corpus' });
    const res = await addPlugin(cwd, '@acme/agent-x');
    expect(res.changed).toBe(true);
    const src = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(src).toMatch(/extends:\s*\[corpus,\s*agentX\]/);
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
    expect(identForPackage('@cratylus/canon')).toBe('canon');
    expect(identForPackage('foo-bar_baz')).toBe('fooBarBaz');
    expect(identForPackage('@acme/9lives')).toBe('_9lives');
  });
});
