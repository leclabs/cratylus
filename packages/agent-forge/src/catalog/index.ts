// ─────────────────────────────────────────────────────────────────────────────
// The fragment catalog enumerator.
//
// `enumerateCatalog(corpusDimensionsDir)` walks a corpus's `<dimension>/*.ts` value
// modules, joins each dimension's discovered values with the dimension's runtime
// metadata (`ANATOMY` in `../anatomy`), and emits the discovery contract:
//
//   { dimension, axis, kind, arity, values: [{ slug, definiens }] }   ×24
//
// agent-forge owns the MECHANISM (it types the 24 dimensions, it knows axis/kind/arity);
// the corpus owns the DATA (the value modules). This stays doctrine-agnostic:
// it consumes a directory of dimension-module dirs, not `packages/agent-anatomy` — exactly
// the T3.1 split (the deploy layer "consumes a render tree, not the corpus").
//
// VALUES are DISCOVERED, not listed: drop a new module under `<dimension>/` and it
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
  DIMENSION_NAMES,
  type Dimension,
  type Genus,
} from '../anatomy/index.js';

/** The discovery contract for one dimension: its metadata + discovered values. */
export interface CatalogEntry {
  /** The dimension name (e.g. `address`). */
  readonly dimension: Dimension;
  /** The MECE filing axis. */
  readonly axis: Genus;
  /** Open/closed classification — `enum | open | coined`. */
  readonly kind: Classification;
  /** Whether the dimension holds one value or many. */
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
 * Discover the value bodies under one dimension dir (`<corpusDimensionsDir>/<dimension>`).
 * A dimension value is now a branded STRING (`⟨α, residue⟩`); its dimension home is the
 * DIRECTORY, so every string export under `<dimension>/` is one of that dimension's
 * values. Imports every `*.ts` module and collects each exported string.
 */
async function valuesOf(
  corpusDimensionsDir: string,
  dimension: Dimension,
): Promise<string[]> {
  const dir = join(corpusDimensionsDir, dimension);
  const out: string[] = [];
  const seen = new Set<string>();
  let modules: string[];
  try {
    modules = [];
    for await (const p of glob('*.ts', { cwd: dir })) {
      modules.push(p);
    }
  } catch {
    // A dimension with no module dir yet contributes no values (still listed).
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
 * Enumerate the full fragment catalog of a corpus. For each of the 24 dimensions
 * (in anatomy declaration order), joins `ANATOMY` metadata with the values
 * discovered under `<corpusDimensionsDir>/<dimension>/*.ts`.
 *
 * @param corpusDimensionsDir absolute path to a corpus's `dimensions/` dir (the parent
 *        of the per-dimension module dirs). For agent-anatomy: `packages/agent-anatomy/src/dimensions`.
 */
export async function enumerateCatalog(
  corpusDimensionsDir: string,
): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];
  for (const dimension of DIMENSION_NAMES) {
    const meta = ANATOMY[dimension];
    entries.push({
      dimension,
      axis: meta.axis,
      kind: meta.kind,
      arity: meta.arity,
      values: await valuesOf(corpusDimensionsDir, dimension),
    });
  }
  return entries;
}
