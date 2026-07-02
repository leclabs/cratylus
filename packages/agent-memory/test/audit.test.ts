import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repoKeysFromConfig, scanLine } from '../src/audit.js';
import { main } from '../src/cli.js';

let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'episodic-audit-'));
  // Hermetic: never let a developer-shell config leak repo keys into the run.
  // '' resolves to a nonexistent config path, so audit derives no keys from it.
  vi.stubEnv('AGENT_FACTORY_CONFIG', '');
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

/** A SELF.md polluted with one marker of each built-in class. */
const POLLUTED_SELF = [
  '# some-agent — self',
  'Daily driver checkout lives at ~/workspaces/polis for now.',
  'Open thread: plans/scoped-memory wave 1 is mine.',
  'Stale branch to prune: mav/B9-toolkit-hardening.',
  'Landed the fix in PR #42.',
  '',
].join('\n');

const CLEAN_SELF = [
  '# some-agent — self',
  'I verify claims empirically before building on them.',
  'The expert makes the call; deferring a call that is mine is the custodial reflex.',
  '',
].join('\n');

describe('audit (CLI)', () => {
  it('seeded-polluted SELF/MEMORY → exit 1 with the offending lines named', () => {
    writeFileSync(join(home, 'SELF.md'), POLLUTED_SELF, 'utf8');
    writeFileSync(
      join(home, 'MEMORY.md'),
      '# memory\n- the deploy footgun writes beside ~/workspaces/other-repo\n',
      'utf8',
    );
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(
      /SELF\.md:2: \[workspace-path\] ~\/workspaces\/polis/,
    );
    expect(r.out).toMatch(/SELF\.md:3: \[plan-path\] plans\/scoped-memory/);
    expect(r.out).toMatch(
      /SELF\.md:4: \[branch-ref\] mav\/B9-toolkit-hardening/,
    );
    expect(r.out).toMatch(/SELF\.md:5: \[issue-ref\] #42/);
    expect(r.out).toMatch(
      /MEMORY\.md:2: \[workspace-path\] ~\/workspaces\/other-repo/,
    );
    expect(r.out).toMatch(/audit: 5 finding\(s\)/);
  });

  it('clean SELF/MEMORY → exit 0', () => {
    writeFileSync(join(home, 'SELF.md'), CLEAN_SELF, 'utf8');
    writeFileSync(join(home, 'MEMORY.md'), '# memory\n- pure craft.\n', 'utf8');
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/audit: clean \(2 file\(s\) scanned/);
  });

  it('a home with no SELF/MEMORY audits clean (fresh spawn)', () => {
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/0 file\(s\) scanned/);
  });

  it('--allow pins a reviewed finding → 0; a NEW unpinned finding still → 1', () => {
    writeFileSync(
      join(home, 'SELF.md'),
      '# self\nVault pointer: ~/workspaces/obsidian holds my cold notes.\n',
      'utf8',
    );
    const allow = join(home, 'audit-allow.txt');
    writeFileSync(allow, '~/workspaces/obsidian\n', 'utf8');

    // The pinned finding alone passes.
    const pinnedOnly = main(['audit', '--home', home, '--allow', allow]);
    expect(pinnedOnly.code).toBe(0);
    expect(pinnedOnly.out).toMatch(/clean .*1 pinned/);

    // A NEW unpinned marker appears → the audit still bites.
    writeFileSync(
      join(home, 'MEMORY.md'),
      '# memory\n- new pollution: plans/fleet-cutover is blocked\n',
      'utf8',
    );
    const withNew = main(['audit', '--home', home, '--allow', allow]);
    expect(withNew.code).toBe(1);
    expect(withNew.out).toMatch(
      /MEMORY\.md:2: \[plan-path\] plans\/fleet-cutover/,
    );
    expect(withNew.out).not.toMatch(/workspaces\/obsidian/);
  });

  it('a pin that no longer matches is reported STALE (shrink-only ratchet), exit stays 0', () => {
    writeFileSync(join(home, 'SELF.md'), CLEAN_SELF, 'utf8');
    const allow = join(home, 'audit-allow.txt');
    writeFileSync(allow, '~/workspaces/long-gone\n', 'utf8');
    const r = main(['audit', '--home', home, '--allow', allow]);
    expect(r.code).toBe(0);
    expect(r.err).toMatch(/stale pin .*~\/workspaces\/long-gone/);
  });

  it('--keys flags known repo keys on word boundaries', () => {
    writeFileSync(
      join(home, 'MEMORY.md'),
      '# memory\n- the polis gates are turbo-cached\n- metropolis is unrelated\n',
      'utf8',
    );
    const keys = join(home, 'keys.txt');
    writeFileSync(keys, 'polis\n', 'utf8');
    const r = main(['audit', '--home', home, '--keys', keys]);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/MEMORY\.md:2: \[repo-key\] polis/);
    // Word-boundary: "metropolis" must NOT fire the "polis" key.
    expect(r.out).not.toMatch(/MEMORY\.md:3/);
  });

  it('--config derives repo keys from a .agent-factory.config (containing repo basename)', () => {
    const repoRoot = join(home, 'polis');
    mkdirSync(repoRoot, { recursive: true });
    const config = join(repoRoot, '.agent-factory.config');
    writeFileSync(config, '{"schema":1,"fleet":{"hosts":[]}}', 'utf8');
    writeFileSync(
      join(home, 'SELF.md'),
      '# self\nThe polis rebuild is where I broke the spell.\n',
      'utf8',
    );
    const r = main(['audit', '--home', home, '--config', config]);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/SELF\.md:2: \[repo-key\] polis/);
  });

  it('requires --home', () => {
    const r = main(['audit']);
    expect(r.code).not.toBe(0);
    expect(r.err).toMatch(/--home/);
  });
});

describe('scanLine (detector precision)', () => {
  it('does not fire issue-ref on hex colors, headings, or entities', () => {
    expect(scanLine('palette green is #00ff00 and #dcffd8')).toEqual([]);
    expect(scanLine('## 2 section heading')).toEqual([]);
    expect(scanLine('the entity &#39; is not a ref')).toEqual([]);
  });

  it('fires issue-ref on PR/issue forms', () => {
    expect(scanLine('fixed in #42')).toEqual([
      { cls: 'issue-ref', match: '#42' },
    ]);
    expect(scanLine('see github pull/17 for the diff')).toEqual([
      { cls: 'issue-ref', match: 'pull/17' },
    ]);
  });

  it('does not fire branch-ref on @scoped packages or repo-tree paths', () => {
    expect(scanLine('import from @leclabs/agent-anatomy')).toEqual([]);
    expect(scanLine('lives in packages/agent-memory today')).toEqual([]);
  });

  it('fires branch-ref on branch-shaped refs', () => {
    expect(scanLine('prune origin/mav/old-branch soon')).toEqual([
      { cls: 'branch-ref', match: 'origin/mav/old-branch' },
    ]);
    expect(scanLine('the branch principal/sigma-star-thesis lives on')).toEqual(
      [{ cls: 'branch-ref', match: 'principal/sigma-star-thesis' }],
    );
  });

  it('matches repo keys case-insensitively', () => {
    expect(scanLine('The Polis society', ['polis'])).toEqual([
      { cls: 'repo-key', match: 'Polis' },
    ]);
  });
});

describe('repoKeysFromConfig', () => {
  it('yields the containing repo basename plus a forward-compatible projects field', () => {
    const repoRoot = join(home, 'my-repo');
    mkdirSync(repoRoot, { recursive: true });
    const config = join(repoRoot, '.agent-factory.config');
    writeFileSync(
      config,
      '{"schema":1,"projects":["web-platform","polis"]}',
      'utf8',
    );
    expect(repoKeysFromConfig(config)).toEqual([
      'my-repo',
      'web-platform',
      'polis',
    ]);
  });

  it('throws loudly on malformed JSON (config present ⇒ authoritative)', () => {
    const config = join(home, '.agent-factory.config');
    writeFileSync(config, '{not json', 'utf8');
    expect(() => repoKeysFromConfig(config)).toThrow();
  });
});
