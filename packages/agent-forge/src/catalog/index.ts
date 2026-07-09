// ─────────────────────────────────────────────────────────────────────────────
// The organ-value catalog enumerator.
//
// `enumerateCatalog(corpusOrgansDir)` walks a corpus's `<organ>/*.ts` value
// modules, joins each organ's discovered values with the organ's runtime
// metadata (`ANATOMY` in `../anatomy`), and emits the discovery contract:
//
//   { organ, axis, kind, arity, values: [{ slug, definiens }] }   ×24
//
// agent-forge owns the MECHANISM (it types the 24 organs, it knows axis/kind/arity);
// the corpus owns the DATA (the value modules). This stays doctrine-agnostic:
// it consumes a directory of organ-module dirs, not `packages/agent-anatomy` — exactly
// the T3.1 split (the deploy layer "consumes a render tree, not the corpus").
//
// VALUES are DISCOVERED, not listed: drop a new module under `<organ>/` and it
// appears with zero other edits. RUNTIME TS IMPORT: each module is a typed
// `Fragment` whose only `import` is a type-only `import type { … }`, which
// erases at compile time — so node (v24+, type-stripping) imports the modules
// directly, no tsx/loader/parser needed.
// ─────────────────────────────────────────────────────────────────────────────

import { glob } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ANATOMY,
  type Arity,
  type Classification,
  type Genus,
  ORGAN_NAMES,
  type Organ,
} from '../anatomy/index.js';

/** The discovery contract for one organ: its metadata + discovered values. */
export interface CatalogEntry {
  /** The organ name (e.g. `address`). */
  readonly organ: Organ;
  /** The MECE filing axis. */
  readonly axis: Genus;
  /** Open/closed classification — `enum | open | coined`. */
  readonly kind: Classification;
  /** Whether the organ holds one value or many. */
  readonly arity: Arity;
  /**
   * The discovered value bodies (each a branded-string cell, `⟨α, residue⟩`),
   * sorted shortlex.
   */
  readonly values: readonly string[];
}

/**
 * Shortlex order: shorter strings first, ties broken lexicographically (the
 * order `signify` emits as `≺`). Deterministic and locale-independent.
 */
export function shortlex(a: string, b: string): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Discover the value bodies under one organ dir (`<corpusOrgansDir>/<organ>`).
 * An organ value is now a branded STRING (`⟨α, residue⟩`); its organ home is the
 * DIRECTORY, so every string export under `<organ>/` is one of that organ's
 * values. Imports every `*.ts` module and collects each exported string.
 */
async function valuesOf(
  corpusOrgansDir: string,
  organ: Organ,
): Promise<string[]> {
  const dir = join(corpusOrgansDir, organ);
  const out: string[] = [];
  const seen = new Set<string>();
  let modules: string[];
  try {
    modules = [];
    for await (const p of glob('*.ts', { cwd: dir })) {
      modules.push(p);
    }
  } catch {
    // An organ with no module dir yet contributes no values (still listed).
    return out;
  }
  for (const rel of modules.sort()) {
    const mod = (await import(pathToFileURL(join(dir, rel)).href)) as Record<
      string,
      unknown
    >;
    for (const exported of Object.values(mod)) {
      if (typeof exported === 'string' && !seen.has(exported)) {
        seen.add(exported);
        out.push(exported);
      }
    }
  }
  out.sort(shortlex);
  return out;
}

/**
 * Enumerate the full organ-value catalog of a corpus. For each of the 24 organs
 * (in anatomy declaration order), joins `ANATOMY` metadata with the values
 * discovered under `<corpusOrgansDir>/<organ>/*.ts`.
 *
 * @param corpusOrgansDir absolute path to a corpus's `organs/` dir (the parent
 *        of the per-organ module dirs). For agent-anatomy: `packages/agent-anatomy/src/organs`.
 */
export async function enumerateCatalog(
  corpusOrgansDir: string,
): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];
  for (const organ of ORGAN_NAMES) {
    const meta = ANATOMY[organ];
    entries.push({
      organ,
      axis: meta.axis,
      kind: meta.kind,
      arity: meta.arity,
      values: await valuesOf(corpusOrgansDir, organ),
    });
  }
  return entries;
}
