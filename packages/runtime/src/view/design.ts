// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN VIEW — the concept lattice root to primitive, one line per live
// concept, each showing every plan standing on it with that plan's state,
// behind the divergence and the incoherence that must be resolved first.
//
// The view orders the lattice itself, from the factors it is given: the roots
// are the concepts no live concept factors on, and a concept prints once every
// live concept factoring on it has printed. A concept a factor cycle keeps from
// that order — in the cycle or beneath it — still gets its line, after the
// lattice, naming the concepts above it. How the plans stand on a concept is
// every given unit whose realized entity is that concept's, grouped by plan.
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
import { type LiveUnit, planName, standing } from './plan.js';

/** A concept as its reader sees it. */
export interface Concept {
  readonly anchor: string;
  readonly gloss: string;
  /** The anchors of its factors. */
  readonly factors: readonly string[];
}

/** A live concept, with the entity identity that joins it to the units
 *  realizing it and selects it for a drill; printed only beside an anchor a
 *  merge left on another live concept. */
export interface LiveConcept extends Concept {
  readonly entity: string;
}

/** The design computed at `commit`. */
export interface DesignState {
  readonly commit: string;
  /** Every live concept, in any order. */
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

function conceptInFull(concept: Concept): string[] {
  return [
    `concept: ${concept.anchor}`,
    ...field('gloss', concept.gloss),
    ...list('factors', concept.factors),
  ];
}

/**
 * The design's view: the whole lattice, or, given `entity`, that live concept in
 * full, or every version of that diverged concept in full, beneath the header
 * and the resolve-first layer.
 */
export function designView(state: DesignState, entity?: string): string {
  const { concepts } = state;

  // How each plan stands on each concept, keyed by concept entity, then by
  // plan entity: `plan (state): unit (marks), …`.
  const realizing = new Map<
    string,
    Map<string, { plan: string; units: string[] }>
  >();
  for (const unit of state.units) {
    const plans =
      realizing.get(unit.realizes.entity) ??
      new Map<string, { plan: string; units: string[] }>();
    realizing.set(unit.realizes.entity, plans);
    const standingOn = plans.get(unit.plan.entity) ?? {
      plan: planName(unit.plan),
      units: [],
    };
    plans.set(unit.plan.entity, standingOn);
    standingOn.units.push(`${unit.name} (${standing(unit)})`);
  }
  const realizedIn = (concept: string): string[] =>
    [...(realizing.get(concept)?.values() ?? [])].map(
      ({ plan, units }) => `${plan}: ${units.join(', ')}`,
    );

  // Root to primitive: a concept is placed once every live concept factoring
  // on it is placed; the roots are those nothing live factors on.
  const above = new Map<string, string[]>(concepts.map((c) => [c.anchor, []]));
  for (const c of concepts)
    for (const factor of c.factors) above.get(factor)?.push(c.anchor);
  const waiting = new Map(
    [...above].map(([anchor, over]) => [anchor, over.length]),
  );
  const ordered: LiveConcept[] = [];
  let level = concepts.filter((c) => waiting.get(c.anchor) === 0);
  while (level.length) {
    ordered.push(...level);
    const next = new Set<string>();
    for (const c of level)
      for (const factor of c.factors) {
        const n = waiting.get(factor);
        if (n === undefined) continue;
        waiting.set(factor, n - 1);
        if (n === 1) next.add(factor);
      }
    level = concepts.filter((c) => next.has(c.anchor));
  }
  const placed = new Set(ordered);
  const unplaced = concepts.filter((c) => !placed.has(c));
  const why = (c: LiveConcept): string =>
    `unplaced: in or beneath a factor cycle, factored on by ${(above.get(c.anchor) ?? []).join(', ')}`;

  const lines = [
    header('design', state.commit, [
      count(concepts.length, 'concept', 'concepts'),
      `${unplaced.length} unplaced`,
      `${state.diverged.length} diverged`,
      `${state.incoherent.length} incoherent`,
    ]),
    ...resolveFirst([
      ...state.diverged.flatMap((d) =>
        divergedLines(d, (v) => [conceptLine(v)]),
      ),
      ...state.incoherent.map(incoherenceLine),
    ]),
  ];

  if (entity !== undefined) {
    const concept = concepts.find((c) => c.entity === entity);
    const diverged = state.diverged.find((d) => d.entity === entity);
    const drilled = concept
      ? [
          ...conceptInFull(concept),
          ...(placed.has(concept) ? [] : [`  ${why(concept)}`]),
        ]
      : diverged && divergedLines(diverged, conceptInFull);
    return [
      ...lines,
      ...(drilled
        ? [...drilled, ...list('realized in', realizedIn(entity))]
        : ['no live or diverged concept is that entity']),
    ].join('\n');
  }

  const line = (c: LiveConcept): string => {
    const plans = realizedIn(c.entity);
    return `${conceptLine(c)}${plans.length ? ` · realized in ${plans.join('; ')}` : ''}`;
  };
  lines.push('lattice, root to primitive:');
  for (const c of ordered) lines.push(`  ${line(c)}`);
  if (unplaced.length) {
    lines.push('  no place:');
    for (const c of unplaced) lines.push(`    ${line(c)} · ${why(c)}`);
  }
  return lines.join('\n');
}
