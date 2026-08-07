// A VERSION IS A CLAIM ABOUT THE ARTIFACT, and the manifest is the only thing that defines it.
//
// `0.1.0` shipped to npm with every CLI reporting `0.0.0`. Confirmed the way a claim about a
// published artifact has to be confirmed — by installing the tarball on another host and
// asking it. The cause was a literal `const VERSION = '0.0.0'` in three packages:
// `changeset version` rewrites the manifest and cannot rewrite a string in TypeScript, so the
// two were guaranteed to diverge at the first release and to stay diverged forever.
//
// Nothing caught it because every gate here reads SOURCE, and the defect is only observable
// in the relationship between source and manifest — which is exactly what this file reads.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { describe, expect, it } from 'vitest';

const repoRoot = requireRepoRoot(dirname(fileURLToPath(import.meta.url)));

/** Every package whose source declares a `VERSION`, and the manifest that defines it. */
const DECLARERS = ['runtime', 'memory', 'forge'] as const;

function manifestVersion(pkg: string): string {
  return JSON.parse(
    readFileSync(join(repoRoot, 'packages', pkg, 'package.json'), 'utf8'),
  ).version;
}

/** THE PURE PREDICATE the live leg rests on: does this source hardcode a version?
 *
 *  Pure so the convicting fixture can drive THE SAME function over synthetic text. A control
 *  that reaches its verdict by another path proves only that the other path works. */
function hardcodesVersion(src: string): boolean {
  return /const VERSION[^=]*=\s*['"`]\d/.test(src);
}

function sourceOf(pkg: string): string {
  const rel = {
    runtime: 'src/main.ts',
    memory: 'src/cli.ts',
    forge: 'src/cli/index.ts',
  }[pkg] as string;
  return readFileSync(join(repoRoot, 'packages', pkg, rel), 'utf8');
}

describe('a version has one home — the manifest', () => {
  it('no source assigns VERSION a literal', () => {
    // The SHAPE is what is banned, not one stale number. Pinning `'0.0.0'` would pass the
    // moment somebody hardcoded `'0.1.0'` instead, which is the same defect one release later.
    const offenders = DECLARERS.filter((p) => hardcodesVersion(sourceOf(p)));
    expect(
      offenders,
      `these hardcode a version instead of reading the manifest: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('every declarer reads it by package self-reference', () => {
    for (const p of DECLARERS)
      expect(sourceOf(p), `${p} does not read its own manifest`).toContain(
        `@cratylus/${p}/package.json`,
      );
  });

  it('the BUILT bin reports the manifest version — the claim, checked against the artifact', () => {
    // The end-to-end leg, and the only one that would have caught the shipped defect: it
    // runs the emitted bin exactly as a consumer's shell does.
    const bin = join(repoRoot, 'packages', 'cli', 'dist', 'bin.js');
    const reported = execFileSync('node', [bin, '--version'], {
      encoding: 'utf8',
    }).trim();
    expect(reported).toBe(manifestVersion('runtime'));
  });

  it('is non-vacuous — CONVICTS a hardcoded version and SPARES a derived one', () => {
    // The defect exactly as it shipped, and the same defect one release later — pinning
    // `'0.0.0'` would let `'0.1.0'` through, which is why the SHAPE is what is banned.
    expect(hardcodesVersion("const VERSION = '0.0.0';")).toBe(true);
    expect(hardcodesVersion("export const VERSION = '0.1.0';")).toBe(true);
    expect(hardcodesVersion('const VERSION = "2.3.4";')).toBe(true);
    // And the repair must not read as the defect, or the gate bans its own fix.
    expect(
      hardcodesVersion(
        "const VERSION: string = createRequire(import.meta.url)('@cratylus/runtime/package.json').version;",
      ),
    ).toBe(false);
  });

  it('the version is not `0.0.0` once anything has been published', () => {
    // A guard against the specific regression: a fresh literal, or a manifest that lost its
    // bump. `0.0.0` is legitimate only before the first release, and that moment is past.
    for (const p of DECLARERS)
      expect(manifestVersion(p), `${p} is unversioned`).not.toBe('0.0.0');
  });
});
