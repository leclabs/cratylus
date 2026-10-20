// ─────────────────────────────────────────────────────────────────────────────
// The value catalog enumerator.
//
// It walks each plugin's `<factor>/*.ts` value modules and lifts each discovered
// value to a value node. forge owns the MECHANISM; the canon owns the DATA (the
// value modules). This stays doctrine-agnostic: it consumes a directory of
// factor dirs, not `packages/canon`.
//
// VALUES are DISCOVERED, not listed: drop a new module under `<factor>/` and it
// appears with zero other edits. RUNTIME TS IMPORT: each module exports a typed
// `BareValue` whose only `import` is a type-only `import type { … }`, which
// erases at compile time — so node (v24+, type-stripping) imports the modules
// directly, no tsx/loader/parser needed.
// ─────────────────────────────────────────────────────────────────────────────

import { glob } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { FactorManifest } from '@cratylus/schema';
import {
  type ValueNode,
  type ValueShape,
  validateReferenceGraph,
} from '../resolve/resolve.js';

// ─────────────────────────────────────────────────────────────────────────────
// Multi-plugin value discovery — enumerate the factor dirs of EACH extended
// plugin, addressed by object identity (the imported binding), namespaced per plugin.
//
// This layer discovers the factor dirs across MANY plugins and lifts each discovered value to a
// **value NODE** (`resolve/ValueNode`) whose OBJECT IDENTITY is the address
// (a reference names a NODE, never a string id). Two plugins may both name a concept
// `parsimony`; each yields a DISTINCT node, so that is no collision (per-plugin
// Cratylic-name invariant). Projection's `discoverValues` (`project/index.ts`) calls it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A plugin's value ROOT: where to scan, and under what namespace. The plugin
 * contract's `AgentPlugin.name` (the namespace segment) paired with the RESOLVED
 * absolute path of its `AgentPlugin.factors` dir (the parent of the per-factor value dirs).
 *
 * An INPUT, built BEFORE the scan: nothing here is a finding, so nothing here may be
 * named for the scan that consumes it. `Root` is the dir the walk starts from; it is
 * not `Source`, because in a module whose subject is authored text "source" reads as
 * source code — and a value's BODY is the actual source.
 *
 * `AgentPlugin.factors` is package-relative; mapping it to this absolute path
 * is module-resolution (which node_modules package root) — the plugin's own
 * concern, as canon self-locates its dirs. Discovery consumes the already-resolved dir, so it stays
 * doctrine- and resolution-agnostic.
 *
 * A PAIR ARRAY ON THE WAY IN, A KEYED MAP ON THE WAY OUT — and the asymmetry is the
 * point, not an oversight left over from the map. `readonly PluginValueRoot[]` is
 * the only input shape that can DELIVER a duplicate namespace to the guard below.
 * Typing the input as `ReadonlyMap<string, string>` or `Record<string, string>` would
 * make the duplicate unrepresentable at the boundary — which sounds like the stronger
 * guarantee and is the weaker one: the collision would then be resolved by
 * last-write-wins inside the CALLER's `new Map(…)`, silently, at a site that reports
 * nothing and is no longer this module's to police. A shape that cannot express the
 * defect cannot reject it; it can only lose it.
 */
export interface PluginValueRoot {
  /** The plugin namespace segment (`AgentPlugin.name`). Namespaces the reporting id. */
  readonly name: string;
  /** Absolute path to the plugin's `factors` dir (parent of `<factor>/*.ts`). */
  readonly factorsDir: string;
}

/**
 * Two or more value roots declaring ONE namespace segment. Loud, before any scan.
 *
 * WHY THIS IS FATAL AND NOT A WARNING. The namespace is the whole of a value's
 * address hygiene: it prefixes every minted node id (`<plugin>:<factor>/<export>`), and
 * it is what makes two plugins' `parsimony` two nodes rather than a contest. Two
 * plugins sharing it collapses both at once — indistinguishable ids, and the
 * per-plugin Cratylic-name invariant — each plugin names each
 * concept its LOCAL Cratylic name, the term with the smallest semantic gap in its context, unique within
 * its OWN catalog and nowhere wider —
 * holding only by accident. There is no degraded-but-useful reading of the result to warn about.
 *
 * NOT `NamespaceCollisionError`. "Collision" is already spoken for in this module, with
 * the opposite verdict: two plugins sharing a value's TERM is explicitly a resolution
 * event and explicitly not an error. Reusing the word for the case that IS an error
 * would put one term on two meanings in one file.
 */
export class DuplicateNamespaceError extends Error {
  constructor(
    readonly namespace: string,
    readonly factorsDirs: readonly string[],
  ) {
    super(
      `duplicate plugin namespace '${namespace}': ${factorsDirs.length} value roots declare it (${factorsDirs.join(', ')}) — a namespace addresses exactly one plugin, so sharing one makes their values indistinguishable in every minted id`,
    );
    this.name = 'DuplicateNamespaceError';
  }
}

/**
 * ONE VALUE as authored — identity, factor, body. `node` is the `ValueNode`
 * (OBJECT IDENTITY = the imported binding). `factor` is the factor it files
 * under. `body` is its authored value: the branded-string body for a string value;
 * for a node-form value (the reference-bearing form) the node object itself.
 *
 * `Entry`, not the stage that produced it: every value in a pipeline is some stage's
 * output, so naming one for its provenance distinguishes it from nothing.
 *
 * NO `namespace` FIELD, deliberately. It would be the same string repeated once per
 * value, and it is already reachable twice over: the catalog map keys by it, and
 * `node.id` is minted already namespaced. Late reference resolution addresses by object
 * identity and never parses an id, so it has nothing to gain from a third copy.
 */
export interface ValueEntry {
  readonly node: ValueNode;
  readonly factor: string;
  readonly body: unknown;
}

/**
 * WHAT EVERY PLUGIN YIELDED: each namespace ⟼ its value entries, in root order.
 *
 * One plugin's catalog of values is now the map's VALUE — a bare
 * `readonly ValueEntry[]` — and its namespace is the KEY. The `{name, values}`
 * pair that used to carry both was a single entry of this map written out by hand, and
 * an array of those pairs is a map whose defining property is unenforced: it can hold a
 * namespace twice. Post-guard it cannot, so the type says so. `ReadonlyMap` and not
 * `Record` because a namespace is a plugin's own string, not a key this module coins,
 * and `Record<string, …>` invites `catalogs[ns]` on a value that may be absent.
 *
 * ORDER SURVIVES THE CHANGE: a `Map` iterates in insertion order, so `extends` position
 * is preserved exactly as the pair array preserved it. What does not survive is the caller's ability to read the i-th
 * result and assume it belongs to the i-th root; that correspondence was asserted in a
 * comment and is now asked for by name.
 *
 * The `Value` infix is load-bearing: `PluginCatalogs` would read as a catalog OF
 * plugins, which this is not. It is each plugin's catalog of values.
 */
export type PluginValueCatalogs = ReadonlyMap<string, readonly ValueEntry[]>;

/** The legal `resolve/ValueShape` values — gates whether an object export is a node. */
const VALUE_SHAPES: ReadonlySet<string> = new Set<ValueShape>([
  'scalar',
  'set',
  'structured',
]);

/** Is `v` a `ValueNode` (the reference-bearing export form)? */
function isValueNode(v: unknown): v is ValueNode {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const o = v as { id?: unknown; valueShape?: unknown };
  return typeof o.id === 'string' && VALUE_SHAPES.has(o.valueShape as string);
}

/**
 * Import every `*.ts` module under `dir` and yield each `⟨exportName, value⟩`. It
 * preserves the export NAME (the term, for the namespaced node id) and every export shape
 * (a string body OR a node-form `ValueNode`). A missing dir contributes nothing.
 */
async function scanFactorModules(
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
 * MANY ROOTS → MANY CATALOGS. Enumerate the values of each plugin as NODES
 * addressed by object identity, namespaced by the plugin `name`, then enforce
 * ACYCLICITY of the cross-plugin reference graph with `validateReferenceGraph` — a
 * reference cycle throws
 * `ReferenceCycleError`, a dangling edge `DanglingReferenceError`.
 *
 * NAMESPACE UNIQUENESS IS CHECKED FIRST, before a single dir is read: a duplicate is a
 * fact about the ROOTS, so nothing is learned by scanning, and failing after the IO
 * would only make the report slower and the partial state harder to describe.
 * `DuplicateNamespaceError` — never last-write-wins.
 *
 * THE LONG NAME IS DELIBERATE. `enumeratePluginCatalogs` would still admit
 * "catalogs *of* plugins", disambiguated only by the signature; carrying the noun's own
 * `Value` infix fixes it in the name rather than in the reader's second look.
 *
 * For each root, walks `<factorsDir>/<factor>/*.ts` per the catalog's factors:
 * - a STRING export → a freshly minted, reference-free node with a namespaced id
 *   `"<plugin>:<factor>/<exportName>"` and value shape from the factor's arity;
 * - a node-form `ValueNode` export → used AS-IS (its object identity is the imported
 *   binding), so cross-value references thread by identity.
 * Other export shapes are ignored (as the legacy scan ignores non-strings).
 */
export async function enumeratePluginValueCatalogs(
  roots: readonly PluginValueRoot[],
  manifest: FactorManifest,
): Promise<PluginValueCatalogs> {
  const dirsByNamespace = new Map<string, string[]>();
  for (const src of roots) {
    const dirs = dirsByNamespace.get(src.name);
    if (dirs) dirs.push(src.factorsDir);
    else dirsByNamespace.set(src.name, [src.factorsDir]);
  }
  for (const [namespace, dirs] of dirsByNamespace) {
    if (dirs.length > 1) throw new DuplicateNamespaceError(namespace, dirs);
  }

  const plugins = new Map<string, readonly ValueEntry[]>();
  const allNodes = new Set<ValueNode>();

  for (const src of roots) {
    const values: ValueEntry[] = [];
    for (const [factor, meta] of Object.entries(manifest)) {
      // An ARITY → VALUE SHAPE map, and a narrow one. Every module under a factor
      // dir is ONE value, so its node is an atom (`scalar`) unless the factor holds
      // many, where a consumer may append to it (`set`). A `slots` value fills one
      // slot and an `attribute` value is one attribute: both atoms.
      //
      // Deriving `Arity` FROM `ValueShape` would be structurally stronger and is refused:
      // `Arity` lives in the schema and `ValueShape` in the projector, so the derivation
      // would make the shapes depend on projection.
      const valueShape: ValueShape = meta.arity === 'set' ? 'set' : 'scalar';
      const dir = join(src.factorsDir, factor);
      for (const { exportName, value } of await scanFactorModules(dir)) {
        if (isValueNode(value)) {
          values.push({ node: value, factor, body: value });
          allNodes.add(value);
        } else if (typeof value === 'string') {
          const node: ValueNode = {
            id: `${src.name}:${factor}/${exportName}`,
            valueShape,
          };
          values.push({ node, factor, body: value });
          allNodes.add(node);
        }
      }
    }
    plugins.set(src.name, values);
  }

  // Closure and acyclicity of the reference graph.
  validateReferenceGraph(allNodes);

  return plugins;
}
