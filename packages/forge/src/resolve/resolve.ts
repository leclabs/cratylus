// ─────────────────────────────────────────────────────────────────────────────
// The value node and its reference graph.
//
// A value NODE is what the catalog's discovery (`catalog/index.ts`) mints for each
// value of a factor it finds. ADDRESSING IS BY OBJECT IDENTITY, never a string id: a
// `ValueNode.references` edge is the imported binding itself, so a binding names a
// NODE.
//
// The reference graph over the discovered nodes must be closed and ACYCLIC; a
// dangling edge or a cycle THROWS its named error rather than passing silently.
// ─────────────────────────────────────────────────────────────────────────────

// ── Structural value shapes ──────────────────────────────────────────────────

/**
 * A value's structural value-type (⊥ factor): none, uniform or named parts
 * of internal structure. The catalog derives it from the factor's arity.
 */
export type ValueShape = 'scalar' | 'set' | 'structured';

// ── The value node ───────────────────────────────────────────────────────────

/**
 * A value NODE — a referential identity, addressed by the imported binding
 * (object identity), never by `id` (which is for reporting only). It declares its
 * structural `valueShape`; its VALUE is not stored here. `references` are the
 * late-bound edges to other nodes: the reference graph must be ACYCLIC.
 */
export interface ValueNode {
  /** Human-readable label for reports / errors. NOT the address — identity is by object. */
  readonly id: string;
  /** Structural value-type (⊥ factor). */
  readonly valueShape: ValueShape;
  /** Late-bound edges to other nodes; the acyclicity graph. Optional. */
  readonly references?: readonly ValueNode[];
}

// ── LOUD validation errors (each named; each THROWS, never silent) ────────────

/** A `references` edge points at a value no extended plugin defines (dangling / late-bound). */
export class DanglingReferenceError extends Error {
  constructor(
    readonly from: ValueNode,
    readonly to: ValueNode,
  ) {
    super(
      `dangling reference: value '${from.id}' references '${to.id}', which no extended plugin defines`,
    );
    this.name = 'DanglingReferenceError';
  }
}

/** The resolved reference graph has a cycle — no base case for late binding. */
export class ReferenceCycleError extends Error {
  constructor(readonly cycle: readonly ValueNode[]) {
    super(
      `reference cycle: ${cycle.map((f) => f.id).join(' → ')} — the resolved reference graph must be acyclic`,
    );
    this.name = 'ReferenceCycleError';
  }
}

/**
 * Validate the late-bound reference graph over the defined nodes: every edge must
 * point at a defined node (else DanglingReferenceError), and the graph must be
 * ACYCLIC (else ReferenceCycleError). DFS with a recursion stack finds a back-edge.
 *
 * The multi-plugin value discovery in `catalog/` runs it, so a cross-plugin
 * reference cycle is caught the moment values are enumerated.
 */
export function validateReferenceGraph(defined: ReadonlySet<ValueNode>): void {
  // Dangling: an edge to a value no extended plugin defines.
  for (const node of defined) {
    for (const ref of node.references ?? []) {
      if (!defined.has(ref)) throw new DanglingReferenceError(node, ref);
    }
  }

  // Acyclicity: colored DFS. WHITE=unseen, GREY=on-stack, BLACK=done.
  const GREY = 1;
  const BLACK = 2;
  const color = new Map<ValueNode, 1 | 2>();
  const stack: ValueNode[] = [];

  const visit = (node: ValueNode): void => {
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
