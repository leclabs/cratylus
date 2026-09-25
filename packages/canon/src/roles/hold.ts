// ─────────────────────────────────────────────────────────────────────────────
// A ROLE, AND THE FOLD THAT RESOLVES ONE.
//
// A role is a BUNDLE OF EXPECTED ASPECTS. In the world, naming someone an architect
// tells you how they reason, what they are accountable for, what they may decide and
// what they must delegate; the corpus adopts that account because it is what the word
// already means, and a corpus whose roles mean what roles mean needs no second
// vocabulary for it.
//
// Before this module, `role` was a scalar dimension over bare tokens, so the corpus
// could NAME a role and could not STATE one. Everything the name should have carried
// was retyped on every holder — `kino` and `architect` agreed on 19 of 22 dimensions
// by copying — and the duplication bought nothing, because what must be FULL is the
// TARGET (a harness reads a flat declaration, never a resolution chain) and the fold
// below runs at `select`, before `compose`. The emitted Target is exactly as flat as
// it was when every value was retyped by hand.
//
// A ROLE IS NOT A DIMENSION, AND IT IS NOT A BASE CLASS. It is made OF dimension
// values, so it cannot be one of them; and there is no lineage here — `architect` is
// a thin holder of the architect role exactly as `kino` is, with no parent pointer, no
// abstract cell nobody dispatches, and no chain to resolve. Two operands, one
// precedence rule, no ordering question.
//
// SINGULAR ARITY IS THE POINT, not a simplification. A role is the CONTRACT A PEER
// DISPATCHES AGAINST: when an architect hands a cut piece to a planner it reasons about
// the planner's role to know what comes back. A union of roles is a contract no
// dispatcher can reason about, and it would readmit role conflict — incompatible
// demands between two positions held at once — which singular arity deletes outright.
// The situational switch (the same practitioner architects here and implements there)
// is modelled by DISPATCH: the situation selects which agent runs.
//
// WHAT A HOLDER MAY NOT ESCAPE is exactly one thing: the role's own contract, the
// `role` dimension value stating ⟨reads, writes⟩ and everything that follows from the
// pair. It is inviolable BY CONSTRUCTION rather than by a marking — `Declared` omits
// the key, so there is no field to override and no rule to enforce. Every other aspect
// a role supplies is a DEFAULT: a scalar the holder may override, a set the holder may
// extend. A general constitutive/default marking was considered and rejected: with the
// contract folded into the role's own value, no second aspect needed protecting, and a
// mechanism with no live subject is structure that carries no load.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Agent as AgentIdentity,
  DimensionFieldsOf,
} from '@cratylus/schema';
import { kebabToCamel } from '@cratylus/schema';
import { DIMENSION_NAMES, MANIFEST } from '../manifest.js';
import type { Agent, Role } from '../manifest.js';

/** Every dimension FIELD of this corpus, as an agent carries it. */
type DimensionFields = DimensionFieldsOf<typeof MANIFEST>;

/**
 * What a role SUPPLIES — a partial dimension vector, minus `role` (which is the
 * role's own `sign`) and plus `guardrails`, which is `required: true` in the
 * manifest and is therefore the position's to state. A position that confines
 * nobody is not a lesser position, it is an unconfined one, and the catch-all
 * belongs where every holder inherits it rather than on each holder in turn.
 */
export type RoleVector = Partial<Omit<DimensionFields, 'role' | 'guardrails'>> &
  Pick<DimensionFields, 'guardrails'>;

/** The expectations attached to one position. */
export interface RoleCell {
  /**
   * The `role` dimension value — the position's CONTRACT, not merely its name. It
   * states the pair ⟨reads, writes⟩ over the ladder and the acts the pair reserves;
   * delegation is a theorem of the pair rather than a second declaration beside it.
   */
  readonly sign: Role;
  /** The apparatus every holder operates through. Holders may add; see `holds`. */
  readonly skills?: readonly string[];
  /** The aspects expected of anyone holding the position — DEFAULTS, every one. */
  readonly vector: RoleVector;
}

/**
 * What the HOLDER declares: its identity, and any dimension value of its own.
 *
 * Unbounded in size — `kino` declares an entire domain over the architect role — and
 * bounded in exactly one way: `role` is absent, because the contract is the position's.
 * An aspect stated here OVERRIDES a scalar the role supplies and EXTENDS a set.
 */
export type Declared = AgentIdentity & Partial<Omit<DimensionFields, 'role'>>;

/**
 * `select(a) = hold(a) ⊕ declare(a)` — the two-operand fold, run at authoring time so
 * the projected Target stays flat.
 *
 * `⊕` reads the manifest's own `arity`, so the precedence rule is stated once and
 * cannot disagree with itself:
 *
 *   · set    → role members first, then the holder's own — EXTEND. A role-supplied
 *              member therefore survives every holder, which is why a set needs no
 *              inviolability marking: union already guarantees it.
 *   · scalar → the holder's value when the KEY IS PRESENT, else the role's — OVERRIDE.
 *              Present-with-`null` is an explicit suppression and is honoured as one;
 *              absent means "whatever the position says", which is the common case.
 *
 * A dimension neither operand states is `null` — omit-to-inherit, exactly as a
 * hand-written vector spells it.
 *
 * `provenance.mark` NEVER folds: it is instance-bound, minted per agent at
 * `create-agent`, and two agents sharing a mark are indistinguishable in the one place
 * an operator reads them. It arrives on `declared` and leaves untouched.
 */
export function holds(role: RoleCell, declared: Declared): Agent {
  const resolved: Record<string, unknown> = {
    name: declared.name,
    description: declared.description,
    archetype: declared.archetype,
    provenance: declared.provenance,
  };
  if (declared.preamble !== undefined) {
    resolved.preamble = declared.preamble;
  }
  const skills = [
    ...(role.skills ?? []),
    ...(declared.skills ?? []).filter((s) => !(role.skills ?? []).includes(s)),
  ];
  if (skills.length > 0) {
    resolved.skills = skills;
  }

  const roleVector = role.vector as Record<string, unknown>;
  const declaredVector = declared as unknown as Record<string, unknown>;

  for (const dimension of DIMENSION_NAMES) {
    const field = kebabToCamel(dimension);
    if (dimension === 'role') {
      resolved[field] = role.sign;
      continue;
    }
    const fromRole = roleVector[field];
    const stated = field in declaredVector ? declaredVector[field] : undefined;
    if (MANIFEST[dimension].arity === 'set') {
      const base = Array.isArray(fromRole) ? (fromRole as unknown[]) : [];
      const extension = Array.isArray(stated) ? (stated as unknown[]) : [];
      const union = [...base, ...extension.filter((v) => !base.includes(v))];
      resolved[field] = union.length > 0 ? union : null;
      continue;
    }
    resolved[field] =
      field in declaredVector ? (stated ?? null) : (fromRole ?? null);
  }

  // The ONE cast, and it is structural rather than hopeful: the loop is driven by
  // `DIMENSION_NAMES`, so every dimension field of `Agent` is assigned exactly once.
  return resolved as unknown as Agent;
}
