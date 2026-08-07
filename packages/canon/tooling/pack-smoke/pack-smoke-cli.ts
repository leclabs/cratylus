// The I/O half: pack every publishable package, read each tarball, apply the predicates.
//
// SEPARATE FROM THE PREDICATES ON PURPOSE. `pack-smoke.ts` is pure, so the gate can drive
// the exact same functions over synthetic shapes without packing anything — a control that
// travels a different path proves only that the path works.
//
// IT PACKS WITH pnpm, NEVER npm, and that is the subject rather than a convenience: pnpm is
// what rewrites `workspace:` and `catalog:` and strips the publish lifecycle. Packing with
// npm here would produce a tarball that passes nothing and prove the wrong thing.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { type Packed, findings, report } from './pack-smoke.js';

const repoRoot = requireRepoRoot(process.cwd());

/** The packages a publish would actually upload: not private, and not changeset-ignored. */
function publishable(): string[] {
  const ignored = new Set<string>(
    JSON.parse(
      readFileSync(join(repoRoot, '.changeset', 'config.json'), 'utf8'),
    ).ignore ?? [],
  );
  return readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(repoRoot, 'packages', e.name, 'package.json'))
    .flatMap((f) => {
      let m: { name?: string; private?: boolean };
      try {
        m = JSON.parse(readFileSync(f, 'utf8'));
      } catch {
        return [];
      }
      if (m.private === true || m.name === undefined) return [];
      return ignored.has(m.name) ? [] : [m.name];
    })
    .sort();
}

/** Pack one package with pnpm and read the tarball back. */
function packOne(name: string, into: string): Packed {
  execFileSync(
    'pnpm',
    ['--filter', name, 'exec', 'pnpm', 'pack', '--pack-destination', into],
    { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const tgz = readdirSync(into).filter((f) => f.endsWith('.tgz'));
  const newest = tgz[tgz.length - 1] as string;
  const listing = execFileSync('tar', ['-tzf', join(into, newest)], {
    encoding: 'utf8',
  });
  // npm tarballs root everything at `package/`.
  const entries = listing
    .split('\n')
    .filter((l) => l.startsWith('package/') && !l.endsWith('/'))
    .map((l) => l.slice('package/'.length));
  const manifest = JSON.parse(
    execFileSync('tar', ['-xzOf', join(into, newest), 'package/package.json'], {
      encoding: 'utf8',
    }),
  );
  rmSync(join(into, newest));
  return { pkg: name, manifest, entries };
}

export function packAll(): Packed[] {
  const work = mkdtempSync(join(tmpdir(), 'pack-smoke-'));
  try {
    return publishable().map((n) => packOne(n, work));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // `--list` prints the publishable set, one per line, and nothing else.
  //
  // IT EXISTS SO THE AUDIT AND THE UPLOAD CANNOT DISAGREE. They did: `release.sh` derived
  // its own set from a pnpm filter and packed SIX tarballs — including `@cratylus/canon`,
  // which is excluded by the changeset `ignore` list and must never publish — while this
  // gate audited five. An audit that covers a different set than the upload is an audit of
  // something else, and the disagreement was invisible until the counts were printed side
  // by side. One derivation, one home, consumed by both.
  if (process.argv.includes('--list')) {
    for (const n of publishable()) console.log(n);
    process.exit(0);
  }
  const packed = packAll();
  // THE DENOMINATOR IS PRINTED. The honest steady state is zero findings, so a bare "OK"
  // is indistinguishable from having packed nothing at all.
  console.log(
    `pack-smoke: ${packed.length} package(s) — ${packed.map((p) => p.pkg).join(', ')}`,
  );
  if (packed.length === 0) {
    console.error(
      'pack-smoke: nothing publishable was found — the scan is DARK',
    );
    process.exit(2);
  }
  const fs = findings(packed);
  if (fs.length > 0) {
    console.error(report(fs));
    process.exit(1);
  }
  console.log('pack-smoke: OK');
}
