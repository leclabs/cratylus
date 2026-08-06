// ─────────────────────────────────────────────────────────────────────────────
// The resolver — the semantic-merge core.
//
// FOLD LAW (the one genuinely-new part; cold-decodable): a node's resolved value
// is an ORDERED FOLD of its contributions over an empty base, NOT a winner-pick.
//   · `replace` RESETS — discards the prior, becomes the new base (the only
//     last-writer-wins case).
//   · `append` / `merge` ACCUMULATE onto the prior (order-sensitive, never
//     winner-take-all).
//   · a `force(priority)` contribution HOISTS to fold AFTER every non-forced one
//     (highest priority last), so FORCE FOLDS LAST regardless of authored position.
// In one line: ordered fold — replace resets, append/merge accumulate, force
// folds last.
//
// `valueShape ⊥ dimension`. A fragment's VALUE SHAPE is its structural value-type
// (`scalar`·`set`·`structured`) — orthogonal to its DIMENSION (the anatomy axis it
// configures, which this doctrine-agnostic engine never sees). The shape alone gates
// which ops are legal: scalar→{replace}, set→{replace,append}, structured→
// {replace,merge}. An illegal op FAILS LOUDLY — silent merge ambiguity is the #1
// distrust source.
//
// ADDRESSING IS BY OBJECT IDENTITY, never a string id: a
// `PatchEntry.target` and a `Fragment.references` edge are the imported binding
// itself. The resolved set is keyed by the `Fragment` OBJECT, so a binding names a
// NODE and the resolver supplies its value.
//
// This engine is DOCTRINE-AGNOSTIC: it folds an already-loaded contribution model
// and knows nothing of anatomy. `AgentPlugin` declares WHICH DIRS a plugin ships;
// scanning those dirs into the `LoadedPlugin` fragment-nodes + contributions this
// engine folds belongs to `catalog/` and `config/loader.ts`. This module owns the
// fold + the LOUD resolve-time validation only.
// ─────────────────────────────────────────────────────────────────────────────

// ── Structural value shapes + ops ────────────────────────────────────────────

/**
 * A fragment's structural value-type — governs which ops are legal (⊥ dimension).
 *
 * This type read `FragmentKind`, and its field `kind`, until 2026-08-05. `kind` was
 * carrying THREE concepts across two packages — MODEL's `Kind ≜ {fragment, agent,
 * rule, skill}` (`RuleCell.kind`), how a dimension's value-catalog is sourced
 * (`DimensionMeta`, now `repertoire`), and this one. `kind` fires "variant tag
 * answering WHAT IS THIS?", so a blind reverse decode gave `RuleCell` the strongest
 * claim and this site predicted nothing: asked to guess the members off the sign
 * alone, a cold reader reaches for domain categories long before structural ones.
 * Off `valueShape` the members `'scalar' | 'set' | 'structured'` are near-guessable,
 * and the op table weakly follows — you can append to a uniform collection, merge
 * named parts, and only replace an atom.
 *
 * ALIGNMENT, NOT COLLISION, with `validate/residue.ts`'s `ResidueShape`. `MODEL.md:22`
 * rules `shape ⊥ vocabulary`, which installs `shape` as a GENUS — structure-of, as
 * against names-of — and a genus term is supposed to recur. `<Noun>Shape` is a family
 * whose qualifier names the subject whose structure is meant; meeting one member lets
 * a reader predict the construction of the next. What would be a collision is a bare
 * `shape` field here, since `GatedField.shape` already squats that unqualified name —
 * so the `value` qualifier on the field below is LOAD-BEARING, not verbose.
 *
 * KNOWN RESIDUAL, recorded because it is REAL and not an alibi: two of these three
 * signs are `Arity`'s two signs, where they mean cardinality and only cardinality.
 * The coherent single axis here is DEGREE OF INTERNAL STRUCTURE (none · uniform ·
 * named parts) — which is the axis the op table actually reads — but a reader
 * arriving from `Arity` has the cardinality frame loaded, and the two frames disagree
 * about where `structured` belongs. The tell is that `a set of structured values` is
 * unrepresentable here. The member signs, not this type's sign, are what that costs.
 */
export type ValueShape = 'scalar' | 'set' | 'structured';

/** A patch strategy. `force` is a PRIORITY FIELD on an entry, not an op (see below). */
export type PatchOp = 'replace' | 'append' | 'merge';

/** value shape → its legal ops. An op outside its target's set FAILS LOUDLY. */
const LEGAL_OPS: { readonly [K in ValueShape]: ReadonlySet<PatchOp> } = {
  scalar: new Set<PatchOp>(['replace']),
  set: new Set<PatchOp>(['replace', 'append']),
  structured: new Set<PatchOp>(['replace', 'merge']),
};

// ── The fragment node + the fold atom ────────────────────────────────────────

/**
 * A fragment NODE — a referential identity, addressed by the imported binding
 * (object identity), never by `id` (which is for reporting only). It declares its
 * structural `valueShape`; its VALUE is not stored here — it is the fold of the
 * contributions that target this node. `references` are the late-bound edges to
 * other nodes: the resolved reference graph must be ACYCLIC.
 */
export interface Fragment {
  /** Human-readable label for reports / errors. NOT the address — identity is by object. */
  readonly id: string;
  /** Structural value-type — the op-legality axis (⊥ dimension). */
  readonly valueShape: ValueShape;
  /** Late-bound edges to other nodes; the acyclicity graph. Optional. */
  readonly references?: readonly Fragment[];
}

/**
 * A PATCH ENTRY — the universal fold atom `⟨target, op, value, force?⟩`. One shape
 * serves both roles: a plugin ORIGINATES a fragment's base with entries (usually a
 * `replace`), and a consumer MODIFIES fragments with the `patches` entries. The
 * fold treats every entry uniformly.
 *
 * `force` is a PRIORITY, not an op: an entry carrying `force` hoists to fold AFTER
 * all non-forced entries for its node, highest priority last. Two forced entries on
 * one node at the SAME priority is a loud tie error — never a silent pick.
 */
export interface PatchEntry {
  /** The node this entry contributes to — an imported binding (object identity). */
  readonly target: Fragment;
  readonly op: PatchOp;
  /** The contributed value. Interpreted per `op`: replaced / appended / merged. */
  readonly value: unknown;
  /** Optional force priority — hoists this entry to fold after all non-forced ones. */
  readonly force?: number;
}

/**
 * A plugin in LOADED form — the fragment-bearing shape this engine folds. Distinct
 * from `AgentPlugin` (which declares only WHICH DIRS to scan): the catalog scan +
 * config loader turn an `AgentPlugin`'s dirs into these fragment-nodes + originating
 * contributions.
 * `contributions` are this plugin's own `PatchEntry`s, in authored order.
 */
export interface LoadedPlugin {
  /** The namespace segment — reporting + per-plugin σ* uniqueness. */
  readonly name: string;
  /** This plugin's fragment contributions, in authored order. */
  readonly contributions: readonly PatchEntry[];
}

/**
 * A resolve request: the ordered `extends` plugins whose contributions fold in
 * position, then the consumer `patches` (an ARRAY keyed by imported binding — never
 * a string-keyed map, which would contradict the object-import addressing above) that
 * fold last within the non-forced band.
 */
export interface ResolveConfig {
  readonly extends: readonly LoadedPlugin[];
  readonly patches?: readonly PatchEntry[];
}

// ── The resolved output ──────────────────────────────────────────────────────

/**
 * The SOURCE of one fold contribution — WHERE it came from, for provenance
 * reporting (`explain`). A plugin's originating contribution
 * (`kind: 'plugin'`, carrying the plugin `name`) or a consumer patch
 * (`kind: 'patch'`, carrying its `index` in the `patches` array). This is the
 * attribution `explain` reads off to say which plugin/patch a fragment came from.
 *
 * `kind` STAYS HERE, and that is the 2026-08-05 census's ruling rather than an
 * oversight. This is a discriminated UNION and `kind` is its variant tag — the one
 * job the sign fires for cold ("a literal answering WHAT IS THIS?"), the same job it
 * does on `RuleCell.kind`. One gloss, one sign, applied to two unions is alignment;
 * what the census convicts is one sign over two GLOSSES, which is why the structural
 * value-shape and the value-catalog sourcing both had to vacate it.
 */
export type ContributionSource =
  | { readonly kind: 'plugin'; readonly name: string }
  | { readonly kind: 'patch'; readonly index: number };

/**
 * One contribution in a node's resolved fold, recorded in FOLD ORDER (non-forced
 * in collection order, then forced by ascending priority — the order actually
 * applied). Its `source` attributes it to a plugin or a patch; `op`/`value`/`force`
 * mirror the `PatchEntry`; `reset` is true iff this op RESET the accumulator (a
 * `replace`, which discards the prior). The last `reset` in the list is the EFFECTIVE
 * BASE that the subsequent `append`/`merge` accumulated onto — so this list cold-decodes
 * "why this fragment won its final value" with no source-archaeology — which is the
 * falsifier for calling provenance first-class: a reader who has to open the plugin
 * sources to answer that question means this list failed.
 */
export interface FragmentContribution {
  readonly source: ContributionSource;
  readonly op: PatchOp;
  /** The contributed value BEFORE folding (interpreted per `op`). */
  readonly value: unknown;
  /** The force priority, when this contribution was hoisted (else absent). */
  readonly force?: number;
  /** True iff this op reset the accumulator (`replace`) — discarded the prior. */
  readonly reset: boolean;
}

/** One node's fold result — its value plus the source-attributed fold that produced it. */
export interface ResolvedFragment {
  readonly fragment: Fragment;
  /** The folded value (`replace` reset / `append`·`merge` accumulation). */
  readonly value: unknown;
  /**
   * The ordered fold that produced `value`, each contribution attributed to its
   * plugin/patch source. In fold order, so the last
   * `reset` is the base and the tail accumulates onto it.
   */
  readonly provenance: readonly FragmentContribution[];
}

/**
 * The resolved catalog — keyed by the `Fragment` OBJECT (identity addressing). It
 * carries the resolved fragments; presets (agents/skills) are a forward seam.
 */
export interface ResolvedAgentSet {
  readonly fragments: ReadonlyMap<Fragment, ResolvedFragment>;
}

// ── LOUD validation errors (each named; each THROWS, never silent) ────────────

/** A `patches` entry targets a fragment no extended plugin defines. */
export class MissingExtendsTargetError extends Error {
  constructor(readonly target: Fragment) {
    super(
      `missing extends target: no extended plugin defines fragment '${target.id}' — cannot patch it`,
    );
    this.name = 'MissingExtendsTargetError';
  }
}

/** An op is not in its target's value-shape legal set (e.g. `merge` on a `scalar`). */
export class IllegalOpForValueShapeError extends Error {
  constructor(
    readonly target: Fragment,
    readonly op: PatchOp,
  ) {
    super(
      `illegal op '${op}' for value shape '${target.valueShape}' on fragment '${target.id}' — legal ops: ${[
        ...LEGAL_OPS[target.valueShape],
      ].join(', ')}`,
    );
    this.name = 'IllegalOpForValueShapeError';
  }
}

/** Two forced entries on one node share a priority — no deterministic last. */
export class ForcePriorityTieError extends Error {
  constructor(
    readonly target: Fragment,
    readonly priority: number,
  ) {
    super(
      `force-priority tie: two forced entries on fragment '${target.id}' both at priority ${priority} — no deterministic winner`,
    );
    this.name = 'ForcePriorityTieError';
  }
}

/** A `references` edge points at a fragment no extended plugin defines (dangling / late-bound). */
export class DanglingReferenceError extends Error {
  constructor(
    readonly from: Fragment,
    readonly to: Fragment,
  ) {
    super(
      `dangling reference: fragment '${from.id}' references '${to.id}', which no extended plugin defines`,
    );
    this.name = 'DanglingReferenceError';
  }
}

/** The resolved reference graph has a cycle — no base case for late binding. */
export class ReferenceCycleError extends Error {
  constructor(readonly cycle: readonly Fragment[]) {
    super(
      `reference cycle: ${cycle.map((f) => f.id).join(' → ')} — the resolved reference graph must be acyclic`,
    );
    this.name = 'ReferenceCycleError';
  }
}

// ── The resolver ─────────────────────────────────────────────────────────────

/**
 * Resolve a config into a `ResolvedAgentSet` by the FOLD LAW above. Validation is
 * LOUD and runs before the fold: a missing extends target, an illegal op for a
 * value shape, a force-priority tie, a dangling reference, or a reference cycle each
 * THROWS its named error rather than resolving silently wrong.
 */
export function resolve(config: ResolveConfig): ResolvedAgentSet {
  const patches = config.patches ?? [];

  // Collection order = extends position (plugin order, then contribution order),
  // then patches position. This index IS the non-forced precedence. Each entry is
  // TAGGED with its source so the fold can attribute provenance.
  const pluginEntries: SourcedEntry[] = [];
  for (const plugin of config.extends) {
    const source: ContributionSource = { kind: 'plugin', name: plugin.name };
    for (const c of plugin.contributions)
      pluginEntries.push({ entry: c, source });
  }
  const patchEntries: SourcedEntry[] = patches.map((entry, index) => ({
    entry,
    source: { kind: 'patch', index },
  }));
  const ordered: SourcedEntry[] = [...pluginEntries, ...patchEntries];

  // A node is DEFINED only by an extended plugin's contribution — never by a patch.
  const defined = new Set<Fragment>();
  for (const e of pluginEntries) defined.add(e.entry.target);

  // (1) missing extends target — a patch onto an undefined fragment.
  for (const p of patches) {
    if (!defined.has(p.target)) throw new MissingExtendsTargetError(p.target);
  }

  // (2) illegal op for value shape — over every contribution, plugin- or consumer-authored.
  for (const { entry } of ordered) {
    if (!LEGAL_OPS[entry.target.valueShape].has(entry.op)) {
      throw new IllegalOpForValueShapeError(entry.target, entry.op);
    }
  }

  // (3) reference graph — dangling edges + acyclicity, over the defined nodes.
  validateReferenceGraph(defined);

  // Group contributions by target node, preserving collection order.
  const byNode = new Map<Fragment, SourcedEntry[]>();
  for (const e of ordered) {
    const list = byNode.get(e.entry.target);
    if (list) list.push(e);
    else byNode.set(e.entry.target, [e]);
  }

  // (4) fold each node — force-tie check + provenance capture happen in foldNode.
  const fragments = new Map<Fragment, ResolvedFragment>();
  for (const [node, entries] of byNode) {
    const { value, provenance } = foldNode(node, entries);
    fragments.set(node, { fragment: node, value, provenance });
  }

  return { fragments };
}

/** A `PatchEntry` tagged with WHERE it came from, so the fold can attribute provenance. */
interface SourcedEntry {
  readonly entry: PatchEntry;
  readonly source: ContributionSource;
}

/**
 * Fold one node's contributions by the FOLD LAW, capturing the source-attributed
 * fold trace alongside the value. Non-forced entries fold in collection order;
 * forced entries fold AFTER, sorted by ascending priority so the highest priority
 * lands last (force folds last). A duplicate forced priority ties. The returned
 * `provenance` is in fold order — one `FragmentContribution` per applied entry.
 */
function foldNode(
  node: Fragment,
  entries: readonly SourcedEntry[],
): { value: unknown; provenance: FragmentContribution[] } {
  const nonForced = entries.filter((e) => e.entry.force === undefined);
  const forced = entries.filter((e) => e.entry.force !== undefined);

  // Force-priority tie — two forced entries at one priority has no deterministic last.
  const seen = new Set<number>();
  for (const e of forced) {
    const p = e.entry.force as number;
    if (seen.has(p)) throw new ForcePriorityTieError(node, p);
    seen.add(p);
  }
  const forcedSorted = [...forced].sort(
    (a, b) => (a.entry.force as number) - (b.entry.force as number),
  );

  const order = [...nonForced, ...forcedSorted];
  let acc: unknown;
  const provenance: FragmentContribution[] = [];
  for (const { entry, source } of order) {
    acc = applyOp(acc, entry.op, entry.value);
    provenance.push({
      source,
      op: entry.op,
      value: entry.value,
      ...(entry.force !== undefined ? { force: entry.force } : {}),
      reset: entry.op === 'replace',
    });
  }
  return { value: acc, provenance };
}

/** Apply one op over the accumulator. `replace` resets; `append`/`merge` accumulate. */
function applyOp(acc: unknown, op: PatchOp, value: unknown): unknown {
  switch (op) {
    case 'replace':
      return value;
    case 'append': {
      const prior = Array.isArray(acc) ? acc : [];
      const next = Array.isArray(value) ? value : [value];
      return [...prior, ...next];
    }
    case 'merge': {
      const prior =
        acc && typeof acc === 'object' && !Array.isArray(acc) ? acc : {};
      const next =
        value && typeof value === 'object' && !Array.isArray(value)
          ? value
          : {};
      return { ...prior, ...next };
    }
  }
}

/**
 * Validate the late-bound reference graph over the defined nodes: every edge must
 * point at a defined node (else DanglingReferenceError), and the graph must be
 * ACYCLIC (else ReferenceCycleError). DFS with a recursion stack finds a back-edge.
 *
 * EXPORTED for reuse by the multi-plugin fragment discovery in `catalog/`: the same
 * acyclicity law guards resolve-time and discovery-time, so a cross-plugin reference
 * cycle is caught the moment fragments are enumerated, not only at fold.
 */
export function validateReferenceGraph(defined: ReadonlySet<Fragment>): void {
  // Dangling: an edge to a fragment no extended plugin defines.
  for (const node of defined) {
    for (const ref of node.references ?? []) {
      if (!defined.has(ref)) throw new DanglingReferenceError(node, ref);
    }
  }

  // Acyclicity: colored DFS. WHITE=unseen, GREY=on-stack, BLACK=done.
  const GREY = 1;
  const BLACK = 2;
  const color = new Map<Fragment, 1 | 2>();
  const stack: Fragment[] = [];

  const visit = (node: Fragment): void => {
    color.set(node, GREY);
    stack.push(node);
    for (const ref of node.references ?? []) {
      const c = color.get(ref);
      if (c === GREY) {
        // Back-edge — slice the on-stack path from ref to close the cycle.
        const from = stack.indexOf(ref);
        throw new ReferenceCycleError([...stack.slice(from), ref]);
      }
      if (c === undefined) visit(ref);
    }
    stack.pop();
    color.set(node, BLACK);
  };

  for (const node of defined) {
    if (color.get(node) === undefined) visit(node);
  }
}
