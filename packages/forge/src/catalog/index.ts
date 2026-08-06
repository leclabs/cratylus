// ─────────────────────────────────────────────────────────────────────────────
// The fragment catalog enumerator.
//
// `enumerateCatalog(corpusDimensionsDir, manifest)` walks a corpus's `<dimension>/*.ts`
// value modules, joins each dimension's discovered values with that dimension's runtime
// metadata (read from the GIVEN catalog — forge ships none), and emits the
// discovery contract:
//
//   { dimension, axis, repertoire, arity, values: [{ slug, definiens }] }   ×24
//
// forge owns the MECHANISM (it types the 24 dimensions, it knows axis/repertoire/arity);
// the corpus owns the DATA (the value modules). This stays doctrine-agnostic:
// it consumes a directory of dimension-module dirs, not `packages/canon` — the same
// split the deploy layer makes when it "consumes a render tree, not the corpus".
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
  type DimensionManifest,
  type Genus,
  type Repertoire,
  type Value,
  bodyOf,
  isDimensionValue,
} from '@cratylus/schema';
import {
  type Fragment,
  type ValueShape,
  validateReferenceGraph,
} from '../resolve/resolve.js';

/** The discovery contract for one dimension: its metadata + discovered values. */
export interface CatalogEntry {
  /** The dimension name (e.g. `address`) — the catalog's own key, so a plain
   *  string: WHICH dimensions exist is the corpus's fact, not the projector's. */
  readonly dimension: string;
  /** The MECE filing axis. */
  readonly axis: Genus;
  /** How the value-catalog is sourced — `enum | open | curated`. */
  readonly repertoire: Repertoire;
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
      repertoire: meta.repertoire,
      arity: meta.arity,
      values: await valuesOf(corpusDimensionsDir, name),
    });
  }
  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-plugin fragment discovery — generalize the single-corpus scan above
// to enumerate the fragment dirs of EACH extended plugin, addressed by object
// identity (the imported binding), namespaced per plugin.
//
// `enumerateCatalog` (above) discovers ONE corpus's fragment BODIES (branded
// strings) per dimension — the human/CLI `catalog` view, kept verbatim. This layer
// discovers the same dirs across MANY plugins and lifts each discovered value to a
// **fragment NODE** (`resolve/Fragment`) whose OBJECT IDENTITY is the address
// (a reference names a NODE, resolved LATE — never a string id, so a reference reads
// the node's post-patch value rather than an import-time snapshot). Two
// plugins may both name a concept `parsimony`; each yields a DISTINCT node, so that
// is a resolution event, not a collision (per-plugin σ* invariant).
//
// FEEDS THE LOADER: the per-plugin `FragmentEntry[]` is what the `agents.config.ts`
// loader (`config/loader.ts`) turns into the resolver's `LoadedPlugin.contributions`
// (target = the node; value = the body); the resolver then keys
// `ResolvedAgentSet.fragments` by that same node object.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A plugin's fragment ROOT: where to scan, and under what namespace. The plugin
 * contract's `AgentPlugin.name` (the namespace segment) paired with the RESOLVED
 * absolute path of its `AgentPlugin.fragments` dir (the parent of the per-dimension module dirs —
 * the per-plugin analogue of `enumerateCatalog`'s `corpusDimensionsDir`).
 *
 * An INPUT, built BEFORE the scan: nothing here is a finding, so nothing here may be
 * named for the scan that consumes it. `Root` is the dir the walk starts from; it is
 * not `Source`, because in a module whose subject is authored text "source" reads as
 * source code — and a fragment's BODY is the actual source.
 *
 * `AgentPlugin.fragments` is package-relative; mapping it to this absolute path
 * is module-resolution (which node_modules package root) — the config loader's concern
 * (`config/loader.ts`). Discovery consumes the already-resolved dir, so it stays
 * doctrine- and resolution-agnostic.
 *
 * A PAIR ARRAY ON THE WAY IN, A KEYED MAP ON THE WAY OUT — and the asymmetry is the
 * point, not an oversight left over from the map. `readonly PluginFragmentRoot[]` is
 * the only input shape that can DELIVER a duplicate namespace to the guard below.
 * Typing the input as `ReadonlyMap<string, string>` or `Record<string, string>` would
 * make the duplicate unrepresentable at the boundary — which sounds like the stronger
 * guarantee and is the weaker one: the collision would then be resolved by
 * last-write-wins inside the CALLER's `new Map(…)`, silently, at a site that reports
 * nothing and is no longer this module's to police. A shape that cannot express the
 * defect cannot reject it; it can only lose it.
 */
export interface PluginFragmentRoot {
  /** The plugin namespace segment (`AgentPlugin.name`). Namespaces the reporting id. */
  readonly name: string;
  /** Absolute path to the plugin's `fragments` dir (parent of `<dimension>/*.ts`). */
  readonly fragmentsDir: string;
}

/**
 * Two or more fragment roots declaring ONE namespace segment. Loud, before any scan.
 *
 * WHY THIS IS FATAL AND NOT A WARNING. The namespace is the whole of a fragment's
 * address hygiene: it prefixes every minted node id (`<plugin>:<dim>/<export>`), it is
 * the `name` a `ContributionSource{kind:'plugin'}` attributes a fold contribution to,
 * and it is what makes two plugins' `parsimony` two nodes rather than a contest. Two
 * plugins sharing it collapses all three at once — indistinguishable ids, provenance
 * that names the wrong plugin, and the per-plugin σ* invariant — each plugin names each
 * concept its LOCALLY fittest anchor, unique within its OWN catalog and nowhere wider —
 * holding only by accident. There is no degraded-but-useful reading of the result to warn about.
 *
 * NOT `NamespaceCollisionError`. "Collision" is already spoken for in this module, with
 * the opposite verdict: two plugins sharing a fragment ANCHOR is explicitly a resolution
 * event and explicitly not an error. Reusing the sign for the case that IS an error
 * would put one sign on two glosses in one file.
 */
export class DuplicateNamespaceError extends Error {
  constructor(
    readonly namespace: string,
    readonly fragmentsDirs: readonly string[],
  ) {
    super(
      `duplicate plugin namespace '${namespace}': ${fragmentsDirs.length} fragment roots declare it (${fragmentsDirs.join(', ')}) — a namespace addresses exactly one plugin, so sharing one makes their fragments indistinguishable in every minted id, every provenance record and every patch target`,
    );
    this.name = 'DuplicateNamespaceError';
  }
}

/**
 * ONE FRAGMENT as authored — identity, axis, body. `node` is the resolver `Fragment`
 * (OBJECT IDENTITY = the imported binding — what the config loader targets in a
 * `PatchEntry`, and what the resolver keys the resolved map by). `dimension` is the
 * axis it files under.
 * `body` is its authored base value: the branded-string body for a string fragment;
 * for a node-form fragment (the reference-bearing form) the node object itself —
 * the config loader decides how a node-form fragment originates its base contribution.
 *
 * `Entry`, not the stage that produced it: every value in a pipeline is some stage's
 * output, so naming one for its provenance distinguishes it from nothing.
 *
 * NO `namespace` FIELD, deliberately. It would be the same string repeated once per
 * fragment, and it is already reachable twice over: the catalog map keys by it, and
 * `node.id` is minted already namespaced. Late reference resolution addresses by object
 * identity and never parses an id, so it has nothing to gain from a third copy.
 */
export interface FragmentEntry {
  readonly node: Fragment;
  readonly dimension: string;
  readonly body: unknown;
}

/**
 * WHAT EVERY PLUGIN YIELDED: each namespace ⟼ its fragment entries, in root order.
 *
 * One plugin's catalog of fragments is now the map's VALUE — a bare
 * `readonly FragmentEntry[]` — and its namespace is the KEY. The `{name, fragments}`
 * pair that used to carry both was a single entry of this map written out by hand, and
 * an array of those pairs is a map whose defining property is unenforced: it can hold a
 * namespace twice. Post-guard it cannot, so the type says so. `ReadonlyMap` and not
 * `Record` because a namespace is a plugin's own string, not a key this module coins,
 * and `Record<string, …>` invites `catalogs[ns]` on a value that may be absent.
 *
 * ORDER SURVIVES THE CHANGE: a `Map` iterates in insertion order, so `extends` position
 * — which the resolver's ordered fold depends on — is preserved exactly as the pair
 * array preserved it. What does not survive is the caller's ability to read the i-th
 * result and assume it belongs to the i-th root; that correspondence was asserted in a
 * comment and is now asked for by name.
 *
 * The `Fragment` infix is load-bearing: `PluginCatalogs` would read as a catalog OF
 * plugins, which this is not. It is each plugin's catalog of fragments.
 */
export type PluginFragmentCatalogs = ReadonlyMap<
  string,
  readonly FragmentEntry[]
>;

/** The legal `resolve/ValueShape` values — gates whether an object export is a node. */
const VALUE_SHAPES: ReadonlySet<string> = new Set<ValueShape>([
  'scalar',
  'set',
  'structured',
]);

/** Is `v` a resolver `Fragment` NODE (the reference-bearing export form)? */
function isFragmentNode(v: unknown): v is Fragment {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const o = v as { id?: unknown; valueShape?: unknown };
  return typeof o.id === 'string' && VALUE_SHAPES.has(o.valueShape as string);
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
 * MANY ROOTS → MANY CATALOGS. Enumerate the fragments of each plugin as NODES
 * addressed by object identity, namespaced by the plugin `name`, then enforce
 * ACYCLICITY of the cross-plugin reference graph by reusing the
 * resolver's `validateReferenceGraph` — a reference cycle throws
 * `ReferenceCycleError`, a dangling edge `DanglingReferenceError`.
 *
 * NAMESPACE UNIQUENESS IS CHECKED FIRST, before a single dir is read: a duplicate is a
 * fact about the ROOTS, so nothing is learned by scanning, and failing after the IO
 * would only make the report slower and the partial state harder to describe.
 * `DuplicateNamespaceError` — never last-write-wins.
 *
 * THE LONG SIGN IS DELIBERATE. This sits beside `enumerateCatalog`, and a sibling pair
 * is exactly where a misread costs most. `enumeratePluginCatalogs` would still admit
 * "catalogs *of* plugins", disambiguated only by the signature; carrying the noun's own
 * `Fragment` infix fixes it in the name rather than in the reader's second look.
 *
 * For each root, walks `<fragmentsDir>/<dimension>/*.ts` per the catalog's dimensions:
 * - a STRING export → a freshly minted, reference-free node with a namespaced id
 *   `"<plugin>:<dimension>/<exportName>"` and value shape from the dimension's arity;
 * - a node-form `Fragment` export → used AS-IS (its object identity is the imported
 *   binding), so cross-fragment references thread by identity.
 * Other export shapes are ignored (as the legacy scan ignores non-strings).
 */
export async function enumeratePluginFragmentCatalogs(
  roots: readonly PluginFragmentRoot[],
  manifest: DimensionManifest,
): Promise<PluginFragmentCatalogs> {
  const dirsByNamespace = new Map<string, string[]>();
  for (const src of roots) {
    const dirs = dirsByNamespace.get(src.name);
    if (dirs) dirs.push(src.fragmentsDir);
    else dirsByNamespace.set(src.name, [src.fragmentsDir]);
  }
  for (const [namespace, dirs] of dirsByNamespace) {
    if (dirs.length > 1) throw new DuplicateNamespaceError(namespace, dirs);
  }

  const plugins = new Map<string, readonly FragmentEntry[]>();
  const allNodes = new Set<Fragment>();

  for (const src of roots) {
    const fragments: FragmentEntry[] = [];
    for (const [name, meta] of Object.entries(manifest)) {
      const dimension = name;
      // NOT A MAP — a WIDTH COERCION. `Arity` (`scalar`|`set`) is a strict subset of
      // `ValueShape` (`+structured`), so there is no arity→shape function here and nothing
      // to name; the owed-signification marker that stood here was recording a debt against a
      // non-entity. The ANNOTATION is the check: if the two vocabularies ever diverge this
      // line stops compiling, which is the guarantee the comment was standing in for.
      //
      // Deriving `Arity` FROM `ValueShape` would be structurally stronger and is refused:
      // `Arity` lives in the schema and `ValueShape` in the projector, so the derivation
      // would make the shapes depend on projection — ARCHITECTURE property 2.
      //
      // THE COERCION IS ALSO THE SIGN-LEVEL DEFECT, now visible. It compiles only
      // because `ValueShape` REUSES `Arity`'s two signs, where they mean cardinality
      // and only cardinality; here they mean degree of internal structure. Same signs,
      // two axes, one repo — recorded on `ValueShape`, not repaired here.
      const valueShape: ValueShape = meta.arity;
      const dir = join(src.fragmentsDir, dimension);
      for (const { exportName, value } of await scanDimensionModules(dir)) {
        if (isFragmentNode(value)) {
          fragments.push({ node: value, dimension, body: value });
          allNodes.add(value);
        } else if (typeof value === 'string') {
          const node: Fragment = {
            id: `${src.name}:${dimension}/${exportName}`,
            valueShape,
          };
          fragments.push({ node, dimension, body: value });
          allNodes.add(node);
        }
      }
    }
    plugins.set(src.name, fragments);
  }

  // Acyclicity of the resolved reference graph — reuse the resolver's law.
  validateReferenceGraph(allNodes);

  return plugins;
}
