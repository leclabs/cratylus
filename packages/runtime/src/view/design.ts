// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN VIEW — the concept lattice root to primitive, one line per live
// concept, each showing how the plans stand on it, behind the divergence and
// the incoherence that must be resolved first.
//
// Concepts arrive in root-to-primitive order, computed by `design-domain`; this
// module keeps the order it is given. How the plans stand on a concept is every
// given unit whose realized entity is that concept's.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Diverged,
  type Incoherence,
  count,
  divergedLines,
  field,
  header,
  incoherenceLine,
  inline,
  list,
  resolveFirst,
} from './layers.js';
import { type LiveUnit, standing } from './plan.js';

/** A concept as its reader sees it. */
export interface Concept {
  readonly anchor: string;
  readonly gloss: string;
  /** The anchors of its factors. */
  readonly factors: readonly string[];
}

/** A live concept, with the entity identity that joins it to the units
 *  realizing it and is never printed. */
export interface LiveConcept extends Concept {
  readonly entity: string;
}

/** The design computed at `commit`. */
export interface DesignState {
  readonly commit: string;
  /** Every live concept, root to primitive. */
  readonly concepts: readonly LiveConcept[];
  /** The units of every plan, whatever its state, that the concepts are
   *  joined to. */
  readonly units: readonly LiveUnit[];
  readonly diverged: readonly Diverged<Concept>[];
  readonly incoherent: readonly Incoherence[];
}

function conceptLine(concept: Concept): string {
  const factors = concept.factors.length
    ? ` · factors ${concept.factors.join(', ')}`
    : '';
  return `${concept.anchor} — ${inline(concept.gloss)}${factors}`;
}

/**
 * The design's view: the whole lattice, or, given `focus` (the entity of a live
 * concept), that one concept in full beneath the header and the resolve-first
 * layer.
 */
export function designView(state: DesignState, focus?: string): string {
  const realizing = new Map<string, string[]>();
  for (const unit of state.units)
    realizing.set(unit.realizes.entity, [
      ...(realizing.get(unit.realizes.entity) ?? []),
      `${unit.plan}/${unit.name} (${standing(unit)})`,
    ]);
  const lines = [
    header('design', state.commit, [
      count(state.concepts.length, 'concept', 'concepts'),
      `${state.diverged.length} diverged`,
      `${state.incoherent.length} incoherent`,
    ]),
    ...resolveFirst([
      ...state.diverged.flatMap((d) => divergedLines(d, conceptLine)),
      ...state.incoherent.map(incoherenceLine),
    ]),
  ];

  if (focus !== undefined) {
    const concept = state.concepts.find((c) => c.entity === focus);
    if (!concept) return [...lines, 'no live concept by that name'].join('\n');
    return [
      ...lines,
      `concept: ${concept.anchor}`,
      ...field('gloss', concept.gloss),
      ...list('factors', concept.factors),
      ...list('realized by', realizing.get(concept.entity) ?? []),
    ].join('\n');
  }

  lines.push('lattice, root to primitive:');
  for (const concept of state.concepts) {
    const units = realizing.get(concept.entity);
    const realized = units ? ` · realized by ${units.join('; ')}` : '';
    lines.push(`  ${conceptLine(concept)}${realized}`);
  }
  return lines.join('\n');
}
