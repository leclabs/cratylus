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
// every given unit realizing that concept, grouped by plan. Factors and units
// join concepts by their whole name, identity included where one is given.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Diverged,
  type Incoherence,
  type Name,
  count,
  denotes,
  denotesAny,
  divergedLines,
  drilled,
  field,
  header,
  incoherenceLine,
  inline,
  list,
  named,
  resolveFirst,
} from './layers.js';
import { type LiveUnit, planName, standing } from './plan.js';

/** A concept's whole state as its reader sees it. */
export interface Concept {
  readonly anchor: Name;
  readonly gloss: string;
  readonly factors: readonly Name[];
}

/** The design view's input, computed at `commit`. */
export interface DesignState {
  readonly commit: string;
  /** Every live concept, in any order. */
  readonly concepts: readonly Concept[];
  /** The units of every plan, whatever its state, that the concepts are
   *  joined to. */
  readonly units: readonly LiveUnit[];
  readonly diverged: readonly Diverged<Concept>[];
  /** Withdrawn concepts, each its last version, so a withdrawn holder of a
   *  shared anchor drills to what the view is given of it. */
  readonly withdrawn: readonly Concept[];
  readonly incoherent: readonly Incoherence[];
}

function conceptLine(concept: Concept): string {
  const factors = concept.factors.length
    ? ` · factors ${concept.factors.map(named).join(', ')}`
    : '';
  return `${named(concept.anchor)} — ${inline(concept.gloss)}${factors}`;
}

/** One concept in full; `mark` follows its anchor (` — withdrawn`). */
function conceptInFull(concept: Concept, mark = ''): string[] {
  return [
    `concept: ${named(concept.anchor)}${mark}`,
    ...field('gloss', concept.gloss),
    ...list('factors', concept.factors.map(named)),
  ];
}

/**
 * The design's view: the whole lattice, or, given an `anchor`, every live or
 * withdrawn concept it names in full and every version of every diverged
 * concept it names by any of its anchors in full, beneath the header and the
 * resolve-first layer.
 */
export function designView(state: DesignState, anchor?: Name): string {
  const { concepts } = state;

  // How each plan stands on each concept, keyed by the concept's printed name,
  // then the plan's: `plan (state): unit (marks), …`.
  const realizing = new Map<
    string,
    Map<string, { plan: string; units: string[] }>
  >();
  for (const unit of state.units) {
    const concept = named(unit.realizes);
    const plans =
      realizing.get(concept) ??
      new Map<string, { plan: string; units: string[] }>();
    realizing.set(concept, plans);
    const key = named(unit.plan.name);
    const standingOn = plans.get(key) ?? {
      plan: planName(unit.plan),
      units: [],
    };
    plans.set(key, standingOn);
    standingOn.units.push(`${named(unit.name)} (${standing(unit)})`);
  }
  const realizedIn = (concept: Name): string[] =>
    [...(realizing.get(named(concept))?.values() ?? [])].map(
      ({ plan, units }) => `${plan}: ${units.join(', ')}`,
    );

  // Root to primitive: a concept is placed once every live concept factoring
  // on it is placed; the roots are those nothing live factors on.
  const above = new Map<string, string[]>(
    concepts.map((c) => [named(c.anchor), []]),
  );
  for (const c of concepts)
    for (const factor of c.factors)
      above.get(named(factor))?.push(named(c.anchor));
  const waiting = new Map(
    [...above].map(([name, over]) => [name, over.length]),
  );
  const ordered: Concept[] = [];
  let level = concepts.filter((c) => waiting.get(named(c.anchor)) === 0);
  while (level.length) {
    ordered.push(...level);
    const next = new Set<string>();
    for (const c of level)
      for (const factor of c.factors) {
        const n = waiting.get(named(factor));
        if (n === undefined) continue;
        waiting.set(named(factor), n - 1);
        if (n === 1) next.add(named(factor));
      }
    level = concepts.filter((c) => next.has(named(c.anchor)));
  }
  const placed = new Set(ordered);
  const unplaced = concepts.filter((c) => !placed.has(c));
  const why = (c: Concept): string =>
    `unplaced: in or beneath a factor cycle, factored on by ${(above.get(named(c.anchor)) ?? []).join(', ')}`;

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

  if (anchor !== undefined)
    return [
      ...lines,
      ...drilled(anchor, [
        ...concepts
          .filter((c) => denotes(anchor, c.anchor))
          .map((c) => [
            ...conceptInFull(c),
            ...(placed.has(c) ? [] : [`  ${why(c)}`]),
            ...list('realized in', realizedIn(c.anchor)),
          ]),
        ...state.withdrawn
          .filter((c) => denotes(anchor, c.anchor))
          .map((c) => [
            ...conceptInFull(c, ' — withdrawn'),
            ...list('realized in', realizedIn(c.anchor)),
          ]),
        ...state.diverged
          .filter((d) => denotesAny(anchor, d.names))
          .map((d) => [
            ...divergedLines(d, (c) => conceptInFull(c)),
            ...list('realized in', d.names.flatMap(realizedIn)),
          ]),
      ]),
    ].join('\n');

  const line = (c: Concept): string => {
    const plans = realizedIn(c.anchor);
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
