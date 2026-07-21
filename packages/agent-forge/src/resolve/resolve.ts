// ─────────────────────────────────────────────────────────────────────────────
// The resolver — the semantic-merge core (NORTH-STAR §4).
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
// `kind ⊥ dimension`. A fragment's KIND is its structural value-type
// (`scalar`·`set`·`structured`) — orthogonal to its DIMENSION (the anatomy axis it
// configures, which this doctrine-agnostic engine never sees). Kind alone gates
// which ops are legal: scalar→{replace}, set→{replace,append}, structured→
// {replace,merge}. An illegal op FAILS LOUDLY — silent merge ambiguity is the #1
// distrust source.
//
// ADDRESSING IS BY OBJECT IDENTITY (NORTH-STAR §3), never a string id: a
// `PatchEntry.target` and a `Fragment.references` edge are the imported binding
// itself. The resolved set is keyed by the `Fragment` OBJECT, so a binding names a
// NODE and the resolver supplies its value.
//
// This engine is DOCTRINE-AGNOSTIC: it folds an already-loaded contribution model
// and knows nothing of anatomy. P1's `AgentPlugin` declares WHICH DIRS a plugin
// ships; the loader that scans those dirs into the `LoadedPlugin` fragment-nodes +
// contributions this engine folds is P3/P4's concern. P2 owns the fold + the LOUD
// resolve-time validation only.
// ─────────────────────────────────────────────────────────────────────────────

// ── Structural kinds + ops ───────────────────────────────────────────────────

/** A fragment's structural value-type — governs which ops are legal (⊥ dimension). */
export type FragmentKind = 'scalar' | 'set' | 'structured';

/** A patch strategy. `force` is a PRIORITY FIELD on an entry, not an op (see below). */
export type PatchOp = 'replace' | 'append' | 'merge';

/** kind → its legal ops. An op outside its target's set FAILS LOUDLY. */
const LEGAL_OPS: { readonly [K in FragmentKind]: ReadonlySet<PatchOp> } = {
  scalar: new Set<PatchOp>(['replace']),
  set: new Set<PatchOp>(['replace', 'append']),
  structured: new Set<PatchOp>(['replace', 'merge']),
};

// ── The fragment node + the fold atom ────────────────────────────────────────

/**
 * A fragment NODE — a referential identity, addressed by the imported binding
 * (object identity), never by `id` (which is for reporting only). It declares its
 * structural `kind`; its VALUE is not stored here — it is the fold of the
 * contributions that target this node. `references` are the late-bound edges to
 * other nodes (NORTH-STAR §3): the resolved reference graph must be ACYCLIC.
 */
export interface Fragment {
  /** Human-readable label for reports / errors. NOT the address — identity is by object. */
  readonly id: string;
  /** Structural value-type — the op-legality axis (⊥ dimension). */
  readonly kind: FragmentKind;
  /** Late-bound edges to other nodes; the acyclicity graph (§3). Optional. */
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
 * from P1's `AgentPlugin` (which declares only WHICH DIRS to scan): the P3/P4 loader
 * scans an `AgentPlugin`'s dirs into these fragment-nodes + originating contributions.
 * `contributions` are this plugin's own `PatchEntry`s, in authored order.
 */
export interface LoadedPlugin {
  /** The namespace segment — reporting + per-plugin σ* uniqueness (NORTH-STAR §3). */
  readonly name: string;
  /** This plugin's fragment contributions, in authored order. */
  readonly contributions: readonly PatchEntry[];
}

/**
 * A resolve request: the ordered `extends` plugins whose contributions fold in
 * position, then the consumer `patches` (an ARRAY keyed by imported binding — never
 * a string-keyed map, NORTH-STAR §4) that fold last within the non-forced band.
 */
export interface ResolveConfig {
  readonly extends: readonly LoadedPlugin[];
  readonly patches?: readonly PatchEntry[];
}

// ── The resolved output ──────────────────────────────────────────────────────

/** One node's fold result. */
export interface ResolvedFragment {
  readonly fragment: Fragment;
  /** The folded value (`replace` reset / `append`·`merge` accumulation). */
  readonly value: unknown;
}

/**
 * The resolved catalog — keyed by the `Fragment` OBJECT (identity addressing). At
 * P2 it carries the resolved fragments; presets (agents/skills) join in later shards.
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

/** An op is not in its target kind's legal set (e.g. `merge` on a `scalar`). */
export class IllegalOpForKindError extends Error {
  constructor(
    readonly target: Fragment,
    readonly op: PatchOp,
  ) {
    super(
      `illegal op '${op}' for kind '${target.kind}' on fragment '${target.id}' — legal ops: ${[
        ...LEGAL_OPS[target.kind],
      ].join(', ')}`,
    );
    this.name = 'IllegalOpForKindError';
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

/** The resolved reference graph has a cycle — no base case for late binding (§3). */
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
 * kind, a force-priority tie, a dangling reference, or a reference cycle each
 * THROWS its named error rather than resolving silently wrong.
 */
export function resolve(config: ResolveConfig): ResolvedAgentSet {
  const patches = config.patches ?? [];

  // Collection order = extends position (plugin order, then contribution order),
  // then patches position. This index IS the non-forced precedence.
  const pluginEntries: PatchEntry[] = [];
  for (const plugin of config.extends) {
    for (const c of plugin.contributions) pluginEntries.push(c);
  }
  const ordered: PatchEntry[] = [...pluginEntries, ...patches];

  // A node is DEFINED only by an extended plugin's contribution — never by a patch.
  const defined = new Set<Fragment>();
  for (const e of pluginEntries) defined.add(e.target);

  // (1) missing extends target — a patch onto an undefined fragment.
  for (const p of patches) {
    if (!defined.has(p.target)) throw new MissingExtendsTargetError(p.target);
  }

  // (2) illegal op for kind — over every contribution, plugin- or consumer-authored.
  for (const e of ordered) {
    if (!LEGAL_OPS[e.target.kind].has(e.op)) {
      throw new IllegalOpForKindError(e.target, e.op);
    }
  }

  // (3) reference graph — dangling edges + acyclicity, over the defined nodes.
  validateReferenceGraph(defined);

  // Group contributions by target node, preserving collection order.
  const byNode = new Map<Fragment, PatchEntry[]>();
  for (const e of ordered) {
    const list = byNode.get(e.target);
    if (list) list.push(e);
    else byNode.set(e.target, [e]);
  }

  // (4) fold each node — force-tie check happens inside foldNode.
  const fragments = new Map<Fragment, ResolvedFragment>();
  for (const [node, entries] of byNode) {
    fragments.set(node, { fragment: node, value: foldNode(node, entries) });
  }

  return { fragments };
}

/**
 * Fold one node's contributions by the FOLD LAW. Non-forced entries fold in
 * collection order; forced entries fold AFTER, sorted by ascending priority so the
 * highest priority lands last (force folds last). A duplicate forced priority ties.
 */
function foldNode(node: Fragment, entries: readonly PatchEntry[]): unknown {
  const nonForced = entries.filter((e) => e.force === undefined);
  const forced = entries.filter((e) => e.force !== undefined);

  // Force-priority tie — two forced entries at one priority has no deterministic last.
  const seen = new Set<number>();
  for (const e of forced) {
    const p = e.force as number;
    if (seen.has(p)) throw new ForcePriorityTieError(node, p);
    seen.add(p);
  }
  const forcedSorted = [...forced].sort(
    (a, b) => (a.force as number) - (b.force as number),
  );

  const order = [...nonForced, ...forcedSorted];
  let acc: unknown;
  for (const e of order) acc = applyOp(acc, e.op, e.value);
  return acc;
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
 * EXPORTED for reuse by the multi-plugin fragment discovery (P3): the same acyclicity
 * law that guards resolve-time also guards discovery-time, so a cross-plugin reference
 * cycle is caught the moment fragments are enumerated (NORTH-STAR §3), not only at fold.
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
