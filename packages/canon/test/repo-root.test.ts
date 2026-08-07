// The root-resolution helper — all four cases the law needs, in both languages.
//
// THE FOURTH CASE IS THE ONE THAT MATTERS. A temp dir with NO `.git` is not an exotic
// edge: it is a published tarball, and it is every synthetic repo this suite builds with
// `mkdtemp`. A helper that only asks git works perfectly in development and fails in
// exactly the two places nobody runs interactively.
//
// BOTH LANGUAGES ARE EXERCISED HERE, over the same four cases, because the strategy order
// is written twice — once in TypeScript, once in shell — with nothing holding the copies
// in agreement. This file is that nothing made into something.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROOT_MARKER,
  gitRoot,
  markerRoot,
  repoRoot,
  requireRepoRoot,
} from '@cratylus/tooling/repo-root';
import { afterAll, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const shellHelper = join(
  requireRepoRoot(here),
  'packages',
  'tooling',
  'src',
  'repo-root.sh',
);

const scratch: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'repo-root-'));
  scratch.push(d);
  return d;
}
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

/** `repo_root` through the shell helper: '' when it refuses. */
function shellRoot(from: string): string {
  try {
    return execFileSync(
      'sh',
      ['-c', `. "$1" && repo_root "$2"`, 'sh', shellHelper, from],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
  } catch {
    return '';
  }
}

describe('repo-root — one answer, however it is asked', () => {
  it('resolves from the repo root itself', () => {
    const root = requireRepoRoot(here);
    expect(repoRoot(root)).toBe(root);
    expect(shellRoot(root)).toBe(root);
  });

  it('resolves from a nested package, and gives the SAME answer', () => {
    // The whole point: the answer does not depend on the asker's depth.
    const root = requireRepoRoot(here);
    expect(repoRoot(here)).toBe(root);
    expect(repoRoot(join(root, 'packages', 'forge', 'src'))).toBe(root);
    expect(shellRoot(here)).toBe(root);
  });

  it('resolves a temp repo WITH .git — via git, not the marker', () => {
    const d = tmp();
    execFileSync('git', ['init', '-q'], { cwd: d });
    mkdirSync(join(d, 'deep', 'deeper'), { recursive: true });
    // No marker anywhere, so a pass here is git and only git.
    expect(markerRoot(join(d, 'deep', 'deeper'))).toBeNull();
    // macOS resolves TMPDIR through /private; compare git's own idea of the root.
    const viaGit = gitRoot(d);
    expect(viaGit).not.toBeNull();
    expect(repoRoot(join(d, 'deep', 'deeper'))).toBe(viaGit);
    expect(shellRoot(join(d, 'deep', 'deeper'))).toBe(viaGit);
  });

  it('resolves a temp dir WITHOUT .git — the tarball and fixture case', () => {
    const d = tmp();
    writeFileSync(join(d, ROOT_MARKER), 'packages:\n  - "packages/*"\n');
    const nested = join(d, 'packages', 'thing', 'src');
    mkdirSync(nested, { recursive: true });
    // The fallback is genuinely exercised: git must NOT answer for this dir…
    expect(gitRoot(nested)).toBeNull();
    // …and the marker walk must.
    const found = markerRoot(nested);
    expect(found).not.toBeNull();
    expect(repoRoot(nested)).toBe(found);
    expect(shellRoot(nested)).toBe(found);
  });

  it('REFUSES rather than guessing when neither strategy answers', () => {
    // A wrong root that looks like a right one is what produced the silent failures this
    // helper exists to prevent, so the no-answer case must be loud.
    const d = tmp(); // no .git, no marker, and /tmp has no repo above it
    expect(gitRoot(d)).toBeNull();
    expect(markerRoot(d)).toBeNull();
    expect(repoRoot(d)).toBeNull();
    expect(() => requireRepoRoot(d)).toThrow(/no repo root above/);
    expect(shellRoot(d)).toBe('');
  });

  it('the two languages name the SAME marker — the copies have no other keeper', () => {
    const sh = execFileSync(
      'sh',
      ['-c', `. "$1" && printf '%s' "$ROOT_MARKER"`, 'sh', shellHelper],
      { encoding: 'utf8' },
    );
    expect(sh).toBe(ROOT_MARKER);
  });
});
