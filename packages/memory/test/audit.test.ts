import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repoKeysFromConfig, scanLine } from '../src/audit.js';
import { main } from '../src/cli.js';

let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'memory-audit-'));
  // Hermetic: never let a developer-shell config leak repo keys into the run.
  // '' resolves to a nonexistent config path, so audit derives no keys from it.
  vi.stubEnv('CRATYLUS_CONFIG', '');
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

/** A SEMANTIC.md polluted with one marker of each built-in class. */
const POLLUTED_SEMANTIC = [
  '# some-agent — semantic',
  'Daily driver checkout lives at ~/workspaces/polis for now.',
  'Open thread: plans/scoped-memory wave 1 is mine.',
  'Stale branch to prune: mav/B9-toolkit-hardening.',
  'Landed the fix in PR #42.',
  '',
].join('\n');

const CLEAN_SEMANTIC = [
  '# some-agent — semantic',
  'I verify claims empirically before building on them.',
  'The expert makes the call; deferring a call that is mine is the custodial reflex.',
  '',
].join('\n');

describe('audit (CLI) — the v2 scan set {SEMANTIC.md, PROCEDURAL.md}', () => {
  it('seeded-polluted SEMANTIC/PROCEDURAL → exit 1 with the offending lines named (the v2 scan set bites)', () => {
    writeFileSync(join(home, 'SEMANTIC.md'), POLLUTED_SEMANTIC, 'utf8');
    writeFileSync(
      join(home, 'PROCEDURAL.md'),
      '# procedural\n- the deploy footgun writes beside ~/workspaces/other-repo\n',
      'utf8',
    );
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(
      /SEMANTIC\.md:2: \[workspace-path\] ~\/workspaces\/polis/,
    );
    expect(r.out).toMatch(/SEMANTIC\.md:3: \[plan-path\] plans\/scoped-memory/);
    expect(r.out).toMatch(
      /SEMANTIC\.md:4: \[branch-ref\] mav\/B9-toolkit-hardening/,
    );
    expect(r.out).toMatch(/SEMANTIC\.md:5: \[issue-ref\] #42/);
    expect(r.out).toMatch(
      /PROCEDURAL\.md:2: \[workspace-path\] ~\/workspaces\/other-repo/,
    );
    expect(r.out).toMatch(/audit: 5 finding\(s\)/);
  });

  it('the retired v1 files are OUT of the scan set: a polluted SELF.md/MEMORY.md no longer scans', () => {
    // Only legacy files present, both polluted — the v2 audit does not read them.
    writeFileSync(join(home, 'SELF.md'), POLLUTED_SEMANTIC, 'utf8');
    writeFileSync(
      join(home, 'MEMORY.md'),
      '# memory\n- ~/workspaces/other-repo\n',
      'utf8',
    );
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/0 file\(s\) scanned/);
  });

  it('clean SEMANTIC/PROCEDURAL → exit 0', () => {
    writeFileSync(join(home, 'SEMANTIC.md'), CLEAN_SEMANTIC, 'utf8');
    writeFileSync(
      join(home, 'PROCEDURAL.md'),
      '# procedural\n- pure craft.\n',
      'utf8',
    );
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/audit: clean \(2 file\(s\) scanned/);
  });

  it('a home with no stores audits clean (fresh spawn)', () => {
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/0 file\(s\) scanned/);
  });

  it('DEFAULT allow-file: <home>/audit-allow.txt is picked up without --allow', () => {
    writeFileSync(
      join(home, 'SEMANTIC.md'),
      '# semantic\nVault pointer: ~/workspaces/obsidian holds my cold notes.\n',
      'utf8',
    );
    writeFileSync(
      join(home, 'audit-allow.txt'),
      '~/workspaces/obsidian\n',
      'utf8',
    );
    const r = main(['audit', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/clean .*1 pinned/);
  });

  it('an EXPLICIT --allow overrides the default allow-file (default pins do not apply)', () => {
    writeFileSync(
      join(home, 'SEMANTIC.md'),
      '# semantic\nVault pointer: ~/workspaces/obsidian holds my cold notes.\n',
      'utf8',
    );
    // The default file would pin the finding...
    writeFileSync(
      join(home, 'audit-allow.txt'),
      '~/workspaces/obsidian\n',
      'utf8',
    );
    // ...but an explicit --allow with an unrelated pin takes precedence: the
    // finding fires, and the unrelated pin is reported stale.
    const other = join(home, 'other-allow.txt');
    writeFileSync(other, '~/workspaces/long-gone\n', 'utf8');
    const r = main(['audit', '--home', home, '--allow', other]);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/workspaces\/obsidian/);
    expect(r.err).toMatch(/stale pin .*~\/workspaces\/long-gone/);
  });

  it('--allow pins a reviewed finding → 0; a NEW unpinned finding still → 1', () => {
    writeFileSync(
      join(home, 'SEMANTIC.md'),
      '# semantic\nVault pointer: ~/workspaces/obsidian holds my cold notes.\n',
      'utf8',
    );
    const allow = join(home, 'pins.txt');
    writeFileSync(allow, '~/workspaces/obsidian\n', 'utf8');

    // The pinned finding alone passes.
    const pinnedOnly = main(['audit', '--home', home, '--allow', allow]);
    expect(pinnedOnly.code).toBe(0);
    expect(pinnedOnly.out).toMatch(/clean .*1 pinned/);

    // A NEW unpinned marker appears → the audit still bites.
    writeFileSync(
      join(home, 'PROCEDURAL.md'),
      '# procedural\n- new pollution: plans/fleet-cutover is blocked\n',
      'utf8',
    );
    const withNew = main(['audit', '--home', home, '--allow', allow]);
    expect(withNew.code).toBe(1);
    expect(withNew.out).toMatch(
      /PROCEDURAL\.md:2: \[plan-path\] plans\/fleet-cutover/,
    );
    expect(withNew.out).not.toMatch(/workspaces\/obsidian/);
  });

  it('a pin that no longer matches is reported STALE (shrink-only ratchet), exit stays 0', () => {
    writeFileSync(join(home, 'SEMANTIC.md'), CLEAN_SEMANTIC, 'utf8');
    const allow = join(home, 'pins.txt');
    writeFileSync(allow, '~/workspaces/long-gone\n', 'utf8');
    const r = main(['audit', '--home', home, '--allow', allow]);
    expect(r.code).toBe(0);
    expect(r.err).toMatch(/stale pin .*~\/workspaces\/long-gone/);
  });

  it('--keys flags known repo keys on word boundaries', () => {
    writeFileSync(
      join(home, 'PROCEDURAL.md'),
      '# procedural\n- the polis gates are turbo-cached\n- metropolis is unrelated\n',
      'utf8',
    );
    const keys = join(home, 'keys.txt');
    writeFileSync(keys, 'polis\n', 'utf8');
    const r = main(['audit', '--home', home, '--keys', keys]);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/PROCEDURAL\.md:2: \[repo-key\] polis/);
    // Word-boundary: "metropolis" must NOT fire the "polis" key.
    expect(r.out).not.toMatch(/PROCEDURAL\.md:3/);
  });

  it('--config derives repo keys from a .cratylus.config (containing repo basename)', () => {
    const repoRoot = join(home, 'polis');
    mkdirSync(repoRoot, { recursive: true });
    const config = join(repoRoot, '.cratylus.config');
    writeFileSync(config, '{"schema":1,"fleet":{"hosts":[]}}', 'utf8');
    writeFileSync(
      join(home, 'SEMANTIC.md'),
      '# semantic\nThe polis rebuild is where I broke the spell.\n',
      'utf8',
    );
    const r = main(['audit', '--home', home, '--config', config]);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/SEMANTIC\.md:2: \[repo-key\] polis/);
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
    expect(scanLine('import from @cratylus/canon')).toEqual([]);
    expect(scanLine('lives in packages/memory today')).toEqual([]);
  });

  it('fires branch-ref on explicit git ref forms (no context needed)', () => {
    expect(scanLine('prune origin/mav/old-branch soon')).toEqual([
      { cls: 'branch-ref', match: 'origin/mav/old-branch' },
    ]);
    expect(scanLine('pinned at refs/heads/main here')).toEqual([
      { cls: 'branch-ref', match: 'refs/heads/main' },
    ]);
  });

  it('fires branch-ref on a slash-token within the window of a git keyword or sha', () => {
    expect(scanLine('the branch principal/sigma-star-thesis lives on')).toEqual(
      [{ cls: 'branch-ref', match: 'principal/sigma-star-thesis' }],
    );
    expect(
      scanLine('Stale branch to prune: mav/B9-toolkit-hardening.'),
    ).toEqual([{ cls: 'branch-ref', match: 'mav/B9-toolkit-hardening' }]);
    expect(scanLine('reverted to c7acd40 from mav/hotfix-deploy')).toEqual([
      { cls: 'branch-ref', match: 'mav/hotfix-deploy' },
    ]);
    expect(scanLine('merge feature/foo next')).toEqual([
      { cls: 'branch-ref', match: 'feature/foo' },
    ]);
  });

  it('AMENDMENT: does not fire branch-ref on corpus-speak slash-tokens without git context', () => {
    // The live-probe FP class on nico@fire: dimension/value paths + concept pairs.
    expect(scanLine('the autonomy/human-on-the-loop value cell')).toEqual([]);
    expect(scanLine('a diff/round-trip equivalence check')).toEqual([]);
    expect(scanLine('candidates/prior-verdicts drive the elicitation')).toEqual(
      [],
    );
    expect(scanLine('the leclabs/cratylus society layer')).toEqual([]);
    // Git context outside the +/-3 token window does not anchor.
    expect(
      scanLine('merge went fine and much later autonomy/human-on-the-loop'),
    ).toEqual([]);
    // An all-git-verb slash-token is an act-pair enumeration, not a branch
    // (live-probe residue on nico@fire: "publish / send / push). A merge/push").
    expect(scanLine('send / push). A merge/push to a private repo')).toEqual(
      [],
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
    const config = join(repoRoot, '.cratylus.config');
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
    const config = join(home, '.cratylus.config');
    writeFileSync(config, '{not json', 'utf8');
    expect(() => repoKeysFromConfig(config)).toThrow();
  });
});
