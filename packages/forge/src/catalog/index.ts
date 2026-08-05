// ─────────────────────────────────────────────────────────────────────────────
// The fragment catalog enumerator.
//
// `enumerateCatalog(corpusDimensionsDir, manifest)` walks a corpus's `<dimension>/*.ts`
// value modules, joins each dimension's discovered values with that dimension's runtime
// metadata (read from the GIVEN catalog — forge ships none), and emits the
// discovery contract:
//
//   { dimension, axis, kind, arity, values: [{ slug, definiens }] }   ×24
//
// forge owns the MECHANISM (it types the 24 dimensions, it knows axis/kind/arity);
// the corpus owns the DATA (the value modules). This stays doctrine-agnostic:
// it consumes a directory of dimension-module dirs, not `packages/canon` — exactly
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
  type Arity,
  type Classification,
  type DimensionManifest,
  type Genus,
  type Value,
  bodyOf,
  isDimensionValue,
} from '@cratylus/schema';
import {
  type Fragment,
  type FragmentKind,
  validateReferenceGraph,
} from '../resolve/resolve.js';

/** The discovery contract for one dimension: its metadata + discovered values. */
export interface CatalogEntry {
  /** The dimension name (e.g. `address`) — the catalog's own key, so a plain
   *  string: WHICH dimensions exist is the corpus's fact, not the projector's. */
  readonly dimension: string;
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
  dimension: string,
): Promise<string[]> {
  const dir = join(corpusDimensionsDir, dimension);
  const out: string[] = [];
  const seen = new Set<string>();
  let modules: string[];
  try {
    modules = [];
    // Both shapes: authored `.ts` in-workspace, built `.js` when installed. A
    // `.ts`-only glob matched nothing in an installed package — silently.
    for await (const p of glob('*.{ts,js,mjs}', { cwd: dir })) {
      if (!p.endsWith('.d.ts')) modules.push(p);
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
      // A value may carry its own enforcement, in which case it is an OBJECT and
      // a `typeof === 'string'` filter DROPS IT — silently, with the catalog
      // simply reporting one fewer value. That is the dangerous shape: an
      // omission, not a crash, and a catalog that under-reports reads exactly
      // like a corpus that is smaller. `bodyOf` reaches the declaration face of
      // either shape, so enforcing and bare values enumerate alike.
      if (!isDimensionValue(exported)) continue;
      const body = bodyOf(exported as Value<string>);
      if (!seen.has(body)) {
        seen.add(body);
        out.push(body);
      }
    }
  }
  out.sort(shortlex);
  return out;
}

/**
 * Enumerate the full fragment catalog of a corpus. For each of the catalog's
 * dimensions (in its declaration order), joins that dimension's metadata with the
 * values discovered under `<corpusDimensionsDir>/<dimension>/*.ts`.
 *
 * BOTH halves are now parameters — the corpus supplies the value modules AND the
 * catalog they file under. The dir was already an argument and this module already
 * called itself doctrine-agnostic; the metadata read is what finished that sentence.
 *
 * @param corpusDimensionsDir absolute path to a corpus's `dimensions/` dir (the parent
 *        of the per-dimension module dirs). For canon: `packages/canon/src/dimensions`.
 * @param manifest the dimension manifest to join against — REQUIRED, because forge
 *        has none to fall back to.
 */
export async function enumerateCatalog(
  corpusDimensionsDir: string,
  manifest: DimensionManifest,
): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];
  for (const [name, meta] of Object.entries(manifest)) {
    entries.push({
      dimension: name,
      axis: meta.axis,
      kind: meta.kind,
      arity: meta.arity,
      values: await valuesOf(corpusDimensionsDir, name),
    });
  }
  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-plugin fragment discovery (P3) — generalize the single-corpus scan above
// to enumerate the fragment dirs of EACH extended plugin, addressed by object
// identity (the imported binding), namespaced per plugin.
//
// `enumerateCatalog` (above) discovers ONE corpus's fragment BODIES (branded
// strings) per dimension — the human/CLI `catalog` view, kept verbatim. This layer
// discovers the same dirs across MANY plugins and lifts each discovered value to a
// **fragment NODE** (`resolve/Fragment`) whose OBJECT IDENTITY is the address
// (NORTH-STAR §3: a reference names a node, resolved late — never a string id). Two
// plugins may both name a concept `parsimony`; each yields a DISTINCT node, so that
// is a resolution event, not a collision (per-plugin σ* invariant).
//
// FEEDS THE LOADER (P4): the per-plugin `DiscoveredFragment[]` is what P4's load step
// turns into P2's `LoadedPlugin.contributions` (target = the node; value = the body);
// the resolver then keys `ResolvedAgentSet.fragments` by that same node object.
//
// [SIGNIFY — engine-internal names pending a cold-decode pass: `PluginFragmentSource`,
//  `DiscoveredFragment`, `DiscoveredPlugin`, `discoverPluginFragments`.]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A plugin's fragment root to scan: the P1 `AgentPlugin.name` (the namespace
 * segment) paired with the RESOLVED absolute path of its `AgentPlugin.fragments`
 * dir (the parent of the per-dimension module dirs — the per-plugin analogue of
 * `enumerateCatalog`'s `corpusDimensionsDir`).
 *
 * P1's `AgentPlugin.fragments` is package-relative; mapping it to this absolute path
 * is module-resolution (which node_modules package root) — P4's loader concern. P3
 * consumes the already-resolved dir so it stays doctrine- and resolution-agnostic.
 */
export interface PluginFragmentSource {
  /** The plugin namespace segment (`AgentPlugin.name`). Namespaces the reporting id. */
  readonly name: string;
  /** Absolute path to the plugin's `fragments` dir (parent of `<dimension>/*.ts`). */
  readonly fragmentsDir: string;
}

/**
 * One discovered fragment. `node` is the resolver `Fragment` (OBJECT IDENTITY = the
 * imported binding — what P4 targets in a `PatchEntry` and what the resolver keys the
 * resolved map by). `dimension` is the axis it files under. `body` is its
 * authored base value: the branded-string body for a string fragment; for a node-form
 * fragment (the §3 reference-bearing form) the node object itself — P4's loader decides
 * how a node-form fragment originates its base contribution.
 */
export interface DiscoveredFragment {
  readonly node: Fragment;
  readonly dimension: string;
  readonly body: unknown;
}

/**
 * A plugin's fragment enumeration — namespaced by its `name`. Two plugins sharing an
 * anchor do NOT collide: each `DiscoveredFragment.node` is a distinct object.
 */
export interface DiscoveredPlugin {
  readonly name: string;
  readonly fragments: readonly DiscoveredFragment[];
}

/** The legal `resolve/FragmentKind` values — gates whether an object export is a node. */
const FRAGMENT_KINDS: ReadonlySet<string> = new Set<FragmentKind>([
  'scalar',
  'set',
  'structured',
]);

/** Is `v` a resolver `Fragment` NODE (the §3 reference-bearing export form)? */
function isFragmentNode(v: unknown): v is Fragment {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const o = v as { id?: unknown; kind?: unknown };
  return typeof o.id === 'string' && FRAGMENT_KINDS.has(o.kind as string);
}

/**
 * Import every `*.ts` module under `dir` and yield each `⟨exportName, value⟩`. Unlike
 * `valuesOf` (which keeps only distinct strings for the human catalog), this preserves
 * the export NAME (the σ* anchor, for the namespaced node id) and every export shape
 * (a string body OR a node-form `Fragment`). A missing dir contributes nothing.
 */
async function scanDimensionModules(
  dir: string,
): Promise<Array<{ exportName: string; value: unknown }>> {
  const out: Array<{ exportName: string; value: unknown }> = [];
  let modules: string[];
  try {
    modules = [];
    // Both shapes: authored `.ts` in-workspace, built `.js` when installed. A
    // `.ts`-only glob matched nothing in an installed package — silently.
    for await (const p of glob('*.{ts,js,mjs}', { cwd: dir })) {
      if (!p.endsWith('.d.ts')) modules.push(p);
    }
  } catch {
    return out;
  }
  for (const rel of modules.sort()) {
    const mod = (await import(pathToFileURL(join(dir, rel)).href)) as Record<
      string,
      unknown
    >;
    for (const [exportName, value] of Object.entries(mod)) {
      out.push({ exportName, value });
    }
  }
  return out;
}

/**
 * Discover the fragments of each plugin as NODES addressed by object identity,
 * namespaced by the plugin `name`, then enforce ACYCLICITY of the cross-plugin
 * reference graph (NORTH-STAR §3) by reusing P2's `validateReferenceGraph` — a
 * reference cycle throws `ReferenceCycleError`, a dangling edge `DanglingReferenceError`.
 *
 * For each plugin, walks `<fragmentsDir>/<dimension>/*.ts` per the catalog's dimensions:
 * - a STRING export → a freshly minted, reference-free node with a namespaced id
 *   `"<plugin>:<dimension>/<exportName>"` and kind from the dimension's arity;
 * - a node-form `Fragment` export → used AS-IS (its object identity is the imported
 *   binding), so cross-fragment references thread by identity.
 * Other export shapes are ignored (as the legacy scan ignores non-strings).
 */
export async function discoverPluginFragments(
  sources: readonly PluginFragmentSource[],
  manifest: DimensionManifest,
): Promise<DiscoveredPlugin[]> {
  const plugins: DiscoveredPlugin[] = [];
  const allNodes = new Set<Fragment>();

  for (const src of sources) {
    const fragments: DiscoveredFragment[] = [];
    for (const [name, meta] of Object.entries(manifest)) {
      const dimension = name;
      // Arity (`scalar`|`set`) is a subset of `FragmentKind` — the structural
      // value-type a minted string-fragment node carries. [SIGNIFY: arity→kind map.]
      const kind: FragmentKind = meta.arity;
      const dir = join(src.fragmentsDir, dimension);
      for (const { exportName, value } of await scanDimensionModules(dir)) {
        if (isFragmentNode(value)) {
          fragments.push({ node: value, dimension, body: value });
          allNodes.add(value);
        } else if (typeof value === 'string') {
          const node: Fragment = {
            id: `${src.name}:${dimension}/${exportName}`,
            kind,
          };
          fragments.push({ node, dimension, body: value });
          allNodes.add(node);
        }
      }
    }
    plugins.push({ name: src.name, fragments });
  }

  // Acyclicity of the resolved reference graph (§3) — reuse the P2 law.
  validateReferenceGraph(allNodes);

  return plugins;
}
