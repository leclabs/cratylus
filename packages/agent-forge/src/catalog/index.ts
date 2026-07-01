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
  type Fragment,
  type Genus,
  ORGAN_NAMES,
  type Organ,
} from '../anatomy/index.js';

/** One discovered value of an organ: its anchor + definition body. */
export interface CatalogValue {
  /** The cell anchor (σ*_R) — the slug the value module exports. */
  readonly slug: string;
  /** The `≜ <definiens>` body. */
  readonly definiens: string;
}

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
  /** The discovered values, sorted shortlex by slug. */
  readonly values: readonly CatalogValue[];
}

/**
 * Shortlex order: shorter strings first, ties broken lexicographically (the
 * order [[signify]] emits as `≺`). Deterministic and locale-independent.
 */
export function shortlex(a: string, b: string): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Is `x` a value-cell `Fragment` (the shape every organ module exports)? */
function isFragment(x: unknown): x is Fragment {
  if (typeof x !== 'object' || x === null) {
    return false;
  }
  const f = x as Record<string, unknown>;
  return (
    typeof f.organ === 'string' &&
    typeof f.slug === 'string' &&
    typeof f.definiens === 'string'
  );
}

/**
 * Discover the value `Fragment`s under one organ dir (`<corpusOrgansDir>/<organ>`).
 * Imports every `*.ts` module and collects each exported `Fragment` whose
 * `organ` matches — tolerant of default OR named exports (agent-anatomy uses named).
 */
async function valuesOf(
  corpusOrgansDir: string,
  organ: Organ,
): Promise<CatalogValue[]> {
  const dir = join(corpusOrgansDir, organ);
  const out: CatalogValue[] = [];
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
      if (
        isFragment(exported) &&
        exported.organ === organ &&
        !seen.has(exported.slug)
      ) {
        seen.add(exported.slug);
        out.push({ slug: exported.slug, definiens: exported.definiens });
      }
    }
  }
  out.sort((a, b) => shortlex(a.slug, b.slug));
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
