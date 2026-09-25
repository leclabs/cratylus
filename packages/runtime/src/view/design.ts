// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN VIEW — the concept lattice root to primitive, one line per live or
// diverged concept, each showing every plan standing on it with that plan's
// state, behind the divergence and the incoherence that must be resolved first.
//
// The view orders the lattice itself, from the factors it is given: the roots
// are the concepts no concept in the lattice factors on, and a concept prints
// once every concept factoring on it has printed. A diverged concept keeps its
// place, marked, placed by the factors of every version of it and reached by
// any of its anchors, so a concept factoring on it stays listed above it. A
// concept a factor cycle keeps from that order — in the cycle or beneath it —
// still gets its line, after the lattice, naming the concepts above it. How the
// plans stand on a concept is every given unit realizing that concept, grouped
// by plan. Factors and units join concepts by their whole name, identity
// included where one is given.
//
// A concept's trace reads the design alone: its versions with their reasons,
// its closure (what it stands on) and its blast (what stands on it), and no plan.
// ─────────────────────────────────────────────────────────────────────────────

import { type Name, printed } from '../record-store/names.js';
import {
  type Computed,
  type Diverged,
  type Incoherence,
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
  resolveFirst,
} from './layers.js';
import { type LiveUnit, planName, standing } from './plan.js';

/** A concept's whole state as its reader is shown it: every name in it a
 *  `Name`, identity beside it where the name is held by more than one. */
export interface ShownConcept {
  readonly anchor: Name;
  readonly gloss: string;
  readonly factors: readonly Name[];
}

/** The design view's input. */
export interface DesignState extends Computed {
  /** Every live concept, in any order. */
  readonly concepts: readonly ShownConcept[];
  /** The units of every plan, whatever its state, that the concepts are
   *  joined to. */
  readonly units: readonly LiveUnit[];
  /** Why the plans standing on each concept are not shown, when they are not;
   *  `units` is then empty. */
  readonly plansUnshown?: string;
  readonly diverged: readonly Diverged<ShownConcept>[];
  /** Withdrawn concepts, each its last version, so a withdrawn holder of a
   *  shared anchor drills to what the view is given of it. */
  readonly withdrawn: readonly ShownConcept[];
  readonly incoherent: readonly Incoherence[];
}

/** One entry of a concept's history, oldest first. */
export interface TraceEntry {
  /** The write, as display text: the verb that wrote it. */
  readonly verb: string;
  /** The version it wrote; `null` for a retraction. */
  readonly concept: ShownConcept | null;
  readonly author: string;
  readonly time: string;
  readonly reason: string;
}

/** How a concept came to be, what it stands on and what stands on it. */
export interface Trace {
  readonly anchor: Name;
  readonly history: readonly TraceEntry[];
  /** Its closure, itself excluded: every concept its factors reach. */
  readonly closure: readonly Name[];
  /** Its blast, itself excluded: every concept whose closure holds it. */
  readonly blast: readonly Name[];
}

function factorsText(factors: readonly Name[]): string {
  return factors.length ? ` · factors ${factors.map(printed).join(', ')}` : '';
}

function conceptLine(concept: ShownConcept): string {
  return `${printed(concept.anchor)} — ${inline(concept.gloss)}${factorsText(concept.factors)}`;
}

/** One concept in full; `mark` follows its anchor (` — withdrawn`). */
function conceptInFull(concept: ShownConcept, mark = ''): string[] {
  return [
    `concept: ${printed(concept.anchor)}${mark}`,
    ...field('gloss', concept.gloss),
    ...list('factors', concept.factors.map(printed)),
  ];
}

/** A place in the lattice: a live concept, or a diverged one reached by any of
 *  its anchors and placed by the factors of every version of it. */
interface Node {
  /** Its anchors as printed; the first is its key. */
  readonly names: readonly string[];
  readonly factors: readonly Name[];
  /** Its line, before the plans standing on it. */
  readonly line: string;
  /** Every anchor the plans standing on it may name it by. */
  readonly anchors: readonly Name[];
}

/** The lattice root to primitive: a node is placed once every node factoring
 *  on it is placed; the roots are those nothing in the lattice factors on. What
 *  a factor cycle keeps from that order is `unplaced`, and `above` names, by
 *  key, the nodes factoring on each. */
function order(nodes: readonly Node[]) {
  const key = new Map<string, string>();
  for (const n of nodes)
    for (const name of n.names) key.set(name, n.names[0] as string);
  const keyOf = (n: Node) => n.names[0] as string;
  const above = new Map<string, string[]>(nodes.map((n) => [keyOf(n), []]));
  const below = (n: Node): string[] => [
    ...new Set(
      n.factors.flatMap((f) => {
        const k = key.get(printed(f));
        return k === undefined ? [] : [k];
      }),
    ),
  ];
  for (const n of nodes) for (const k of below(n)) above.get(k)?.push(keyOf(n));
  const waiting = new Map([...above].map(([k, over]) => [k, over.length]));
  const ordered: Node[] = [];
  let level = nodes.filter((n) => waiting.get(keyOf(n)) === 0);
  while (level.length) {
    ordered.push(...level);
    const next = new Set<string>();
    for (const n of level)
      for (const k of below(n)) {
        const left = (waiting.get(k) as number) - 1;
        waiting.set(k, left);
        if (left === 0) next.add(k);
      }
    level = nodes.filter((n) => next.has(keyOf(n)));
  }
  const placed = new Set(ordered);
  const why = (n: Node): string =>
    `unplaced: in or beneath a factor cycle, factored on by ${(above.get(keyOf(n)) ?? []).join(', ')}`;
  return {
    ordered,
    placed,
    unplaced: nodes.filter((n) => !placed.has(n)),
    why,
  };
}

/** Every node of the lattice: each live concept, then each diverged one. */
function nodesOf(state: DesignState): Node[] {
  return [
    ...state.concepts.map((c) => ({
      names: [printed(c.anchor)],
      factors: c.factors,
      line: conceptLine(c),
      anchors: [c.anchor],
    })),
    ...state.diverged.map((d) => {
      const factors = [
        ...new Map(
          d.versions.flatMap((v) => v.factors).map((f) => [printed(f), f]),
        ).values(),
      ];
      return {
        names: d.names.map(printed),
        factors,
        line: `${d.names.map(printed).join(' or ')} — diverged, ${count(d.versions.length, 'version', 'versions')}${d.retracted.length ? ' and a retraction' : ''}${factorsText(factors)}`,
        anchors: d.names,
      };
    }),
  ];
}

/** Layers 1 and 2 of the design view. */
function designHead(state: DesignState, unplaced: number): string[] {
  return [
    header('design', state, [
      count(state.concepts.length, 'concept', 'concepts'),
      `${unplaced} unplaced`,
      `${state.diverged.length} diverged`,
      `${state.incoherent.length} incoherent`,
    ]),
    ...(state.plansUnshown === undefined
      ? []
      : [`plans standing on each concept: ${state.plansUnshown}`]),
    ...resolveFirst([
      ...state.diverged.flatMap((d) =>
        divergedLines(d, (v) => [conceptLine(v)]),
      ),
      ...state.incoherent.map(incoherenceLine),
    ]),
  ];
}

/** A concept's trace, beneath the design's header and resolve-first layer. It
 *  names no plan: `state.units` is not read. */
export function traceView(state: DesignState, trace: Trace): string {
  return [
    ...designHead(state, order(nodesOf(state)).unplaced.length),
    `trace: ${printed(trace.anchor)}`,
    ...list(
      'history, oldest first',
      trace.history.map(
        (e) =>
          `${e.verb} by ${e.author} at ${e.time} — ${e.reason} — ${e.concept === null ? 'withdrawn' : conceptLine(e.concept)}`,
      ),
    ),
    ...list('closure, what it stands on', trace.closure.map(printed)),
    ...list('blast, what stands on it', trace.blast.map(printed)),
  ].join('\n');
}

/**
 * The design's view: the whole lattice, or, given an `anchor`, every live or
 * withdrawn concept it names in full and every version of every diverged
 * concept it names by any of its anchors in full, beneath the header and the
 * resolve-first layer.
 */
export function designView(state: DesignState, anchor?: Name): string {
  // How each plan stands on each concept, keyed by the concept's printed name,
  // then the plan's: `plan (state): unit (marks), …`.
  const realizing = new Map<
    string,
    Map<string, { plan: string; units: string[] }>
  >();
  for (const unit of state.units) {
    const concept = printed(unit.realizes);
    const plans =
      realizing.get(concept) ??
      new Map<string, { plan: string; units: string[] }>();
    realizing.set(concept, plans);
    const key = printed(unit.plan.name);
    const standingOn = plans.get(key) ?? {
      plan: planName(unit.plan),
      units: [],
    };
    plans.set(key, standingOn);
    standingOn.units.push(`${printed(unit.name)} (${standing(unit)})`);
  }
  // Every plan standing on a concept by any of `names`, each plan once.
  const realizedIn = (names: readonly Name[]): string[] => {
    const plans = new Map<string, { plan: string; units: string[] }>();
    for (const name of names)
      for (const [key, { plan, units }] of realizing.get(printed(name)) ?? [])
        plans.set(key, {
          plan,
          units: [...(plans.get(key)?.units ?? []), ...units],
        });
    return [...plans.values()].map(
      ({ plan, units }) => `${plan}: ${units.join(', ')}`,
    );
  };

  const nodes = nodesOf(state);
  const { ordered, placed, unplaced, why } = order(nodes);
  const lines = designHead(state, unplaced.length);

  if (anchor !== undefined) {
    const unplacedWhy = (c: ShownConcept): string[] => {
      const node = nodes.find((n) => n.names[0] === printed(c.anchor));
      return node && !placed.has(node) ? [`  ${why(node)}`] : [];
    };
    return [
      ...lines,
      ...drilled(anchor, [
        ...state.concepts
          .filter((c) => denotes(anchor, c.anchor))
          .map((c) => [
            ...conceptInFull(c),
            ...unplacedWhy(c),
            ...list('realized in', realizedIn([c.anchor])),
          ]),
        ...state.withdrawn
          .filter((c) => denotes(anchor, c.anchor))
          .map((c) => [
            ...conceptInFull(c, ' — withdrawn'),
            ...list('realized in', realizedIn([c.anchor])),
          ]),
        ...state.diverged
          .filter((d) => denotesAny(anchor, d.names))
          .map((d) => [
            ...divergedLines(d, (c) => conceptInFull(c)),
            ...list('realized in', realizedIn(d.names)),
          ]),
      ]),
    ].join('\n');
  }

  const line = (n: Node): string => {
    const plans = realizedIn(n.anchors);
    return `${n.line}${plans.length ? ` · realized in ${plans.join('; ')}` : ''}`;
  };
  lines.push('lattice, root to primitive:');
  for (const n of ordered) lines.push(`  ${line(n)}`);
  if (unplaced.length) {
    lines.push('  no place:');
    for (const n of unplaced) lines.push(`    ${line(n)} · ${why(n)}`);
  }
  return lines.join('\n');
}
