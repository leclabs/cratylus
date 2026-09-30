// ─────────────────────────────────────────────────────────────────────────────
// THE PLAN VIEW — the plan shown, its lifecycle state in the header, then the
// plan's line and its units in wave order with the frontier marked in place,
// behind the drifted and suspect units, the owed rulings, the divergence and
// the incoherence that must be resolved first. Each unit line names the concept
// the unit serves.
//
// The plan shown is the one holding the state that admits one plan, or each
// plan a reader named, whole, with its units. When a merge leaves more than one
// plan in that state, the view shows each of them, each with its own units and
// its own counts in the header, and the incoherence naming them stands in the
// resolve-first layer. A diverged unit keeps its place in its wave, and a
// diverged plan shown keeps its line, each marked, so what names them stays
// listed.
//
// Lifecycle states are the `plan` skill's and arrive as display text. Wave,
// frontier, drift and suspicion arrive computed (`unit`, `pin`); this module
// orders by the wave it is given and computes none of them. A live unit given
// no wave still gets its line, after the waves, with the deps that keep it
// unplaced.
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
import { type Note, noteLine } from './notebook.js';

/** A plan's whole state as its reader sees it. A diverged plan has no one
 *  state or set of concepts: wherever it is named it reads as diverged, and its
 *  versions are shown only as versions. */
export interface Plan {
  readonly name: Name;
  /** The concepts it realizes; empty for a diverged plan. */
  readonly realizes: readonly Name[];
  /** Its lifecycle state; ignored for a diverged plan. */
  readonly state: string;
  readonly diverged: boolean;
}

/** One event of a unit's ledger: its kind and fact, who wrote it, and when. */
export type Event = { readonly author: string; readonly time: string } & (
  | { readonly kind: 'land'; readonly commit: string }
  | {
      readonly kind: 'assay';
      readonly commit: string;
      readonly verdict: string;
      readonly missing: readonly string[];
    }
  | { readonly kind: 'whole'; readonly commit: string }
  | { readonly kind: 'broke'; readonly check: string }
);

/** A unit's full spec, lifecycle state and ledger as its reader sees it. */
export interface Unit {
  readonly name: Name;
  /** The plan the unit belongs to. */
  readonly plan: Plan;
  /** The concept the unit realizes. */
  readonly realizes: Name;
  readonly state: string;
  /** The units of its plan it depends on. */
  readonly deps: readonly Name[];
  readonly intent: string;
  readonly static: readonly string[];
  readonly outputs: readonly string[];
  readonly accept: readonly string[];
  /** What happened to it while it was worked, in order. */
  readonly ledger: readonly Event[];
}

/** A live unit, with what `unit` and `pin` computed on it. */
export interface LiveUnit extends Unit {
  /** Its wave; `undefined` when a dep keeps it from any wave. */
  readonly wave: number | undefined;
  readonly frontier: boolean;
  /** DRIFTED: how the concept it realizes moved since pinned, e.g.
   *  `c diverged` or `c amended in gloss and factors (added a; removed b)`;
   *  `undefined` when it has not. */
  readonly drift: string | undefined;
  /** SUSPECT: each concept beneath the one it realizes that moved since pinned,
   *  and how, e.g. `base amended in gloss`; empty when none did or it drifted. */
  readonly suspicion: readonly string[];
  /** Its plan is closed, so it is never written again: it is shown, and no
   *  drift or suspicion on it is asked to be resolved. */
  readonly frozen: boolean;
}

/** A diverged unit, with the wave it holds its place in: placed by the deps of
 *  every version of it. */
export interface DivergedUnit extends Diverged<Unit> {
  readonly wave: number | undefined;
  /** Its plan is closed: shown in its place, never asked to be reconciled. */
  readonly frozen: boolean;
}

/** The plan view's input. */
export interface PlanState extends Computed {
  /** The plans shown: the one holding the state that admits one plan, each of
   *  them when a merge leaves more than one, none when no plan holds it; or
   *  the plans a reader named. */
  readonly plans: readonly Plan[];
  /** The live units of the plans shown, in the order given within each wave. */
  readonly units: readonly LiveUnit[];
  /** The owed rulings blocking a plan shown or a unit of one — every one when
   *  no plan is shown — each naming what it blocks. */
  readonly owed: readonly Note[];
  /** The diverged plans the plans shown are among, or every one when no plan
   *  is shown. */
  readonly divergedPlans: readonly Diverged<Plan>[];
  /** The diverged units of the plans shown, each holding its place. */
  readonly divergedUnits: readonly DivergedUnit[];
  /** Withdrawn plans and units, each its last version, so a withdrawn holder
   *  of a shared name drills to what the view is given of it. A withdrawn
   *  unit's name carries its mark, `u (withdrawn)`. */
  readonly withdrawnPlans: readonly Plan[];
  readonly withdrawnUnits: readonly Unit[];
  readonly incoherent: readonly Incoherence[];
}

/** A plan with its lifecycle state, e.g. `record-store (s1)`, or marked
 *  diverged. */
export function planName(plan: Plan): string {
  return `${printed(plan.name)} (${plan.diverged ? 'diverged' : plan.state})`;
}

/** A unit's state and the marks computed on it, e.g. `u1, frontier, drifted`. */
export function standing(unit: LiveUnit): string {
  return [
    unit.state,
    ...(unit.frontier ? ['frontier'] : []),
    ...(unit.drift !== undefined ? ['drifted'] : []),
    ...(unit.suspicion.length ? ['suspect'] : []),
  ].join(', ');
}

function planLine(plan: Plan): string {
  const realizes =
    plan.realizes.length && !plan.diverged
      ? ` · realizes ${plan.realizes.map(printed).join(', ')}`
      : '';
  return `plan ${planName(plan)}${realizes}`;
}

/** One plan in full; `mark` follows its name (` — withdrawn`). */
function planInFull(plan: Plan, mark = ''): string[] {
  return [
    `plan: ${planName(plan)}${mark}`,
    ...list('realizes', plan.realizes.map(printed)),
  ];
}

/** What one event of a ledger says, e.g. `assay c1: not-achieved — missing: a; b`. */
function eventFact(event: Event): string {
  switch (event.kind) {
    case 'land':
    case 'whole':
      return `${event.kind} ${event.commit}`;
    case 'assay':
      return `assay ${event.commit}: ${event.verdict}${event.missing.length ? ` — missing: ${event.missing.map(inline).join('; ')}` : ''}`;
    case 'broke':
      return `broke: ${inline(event.check)}`;
  }
}

/** A unit's latest event as its line carries it: `landed c1`, `not achieved`,
 *  `achieved`, `whole`, `broke: check`; empty when it has none. */
function latest(unit: Unit): string {
  const event = unit.ledger.at(-1);
  if (event === undefined) return '';
  switch (event.kind) {
    case 'land':
      return ` · last: landed ${event.commit}`;
    case 'assay':
      return ` · last: ${event.verdict.replace('-', ' ')}`;
    case 'whole':
      return ' · last: whole';
    case 'broke':
      return ` · last: broke: ${inline(event.check)}`;
  }
}

function unitLine(unit: Unit, marks: string): string {
  const deps = unit.deps.length
    ? ` · deps ${unit.deps.map(printed).join(', ')}`
    : '';
  return `${printed(unit.name)} — ${marks} · realizes ${printed(unit.realizes)}${deps}${latest(unit)}`;
}

/** A unit's ledger, one entry per event in order, each with who wrote it when. */
function ledgerLines(unit: Unit): string[] {
  return unit.ledger.length === 0
    ? ['  ledger: none']
    : [
        '  ledger:',
        ...unit.ledger.map(
          (e, i) => `    ${i + 1}. ${eventFact(e)} — ${e.author}, ${e.time}`,
        ),
      ];
}

/** One unit by its line and its ledger, none of its spec. */
function unitLedger(unit: Unit, marks: string): string[] {
  return [`unit: ${printed(unit.name)} — ${marks}`, ...ledgerLines(unit)];
}

/** One unit in full; `placement` states the wave of a live unit. */
function unitInFull(unit: Unit, marks: string, placement?: string): string[] {
  return [
    `unit: ${printed(unit.name)} — ${marks}`,
    `  plan: ${planName(unit.plan)}`,
    `  realizes: ${printed(unit.realizes)}`,
    ...(placement === undefined ? [] : [`  wave: ${placement}`]),
    ...list('deps', unit.deps.map(printed)),
    ...field('intent', unit.intent),
    ...list('static', unit.static),
    ...list('outputs', unit.outputs),
    ...list('accept', unit.accept),
    ...ledgerLines(unit),
  ];
}

/**
 * The plan's view: the whole of each plan shown, or, given a `name`, every live
 * or withdrawn unit and plan it names in full and every version of every
 * diverged unit and plan it names by any of its names in full, beneath the
 * header and the resolve-first layer. With `ledgerOnly`, a name drills to each
 * live unit it names by its line and its ledger alone, and to no spec.
 */
export function planView(
  state: PlanState,
  name?: Name,
  ledgerOnly = false,
): string {
  const { units } = state;
  const drifted = units.filter((u) => u.drift !== undefined);
  const suspect = units.filter((u) => u.suspicion.length);
  const unplaced = units.filter((u) => u.wave === undefined);

  // Every plan with a line: those shown, then any other a given unit names,
  // so no live unit goes without one.
  const plans = new Map(state.plans.map((p) => [printed(p.name), p]));
  for (const unit of units)
    if (!plans.has(printed(unit.plan.name)))
      plans.set(printed(unit.plan.name), unit.plan);

  // Why a unit has no wave: each dep that is not a placed live unit of its plan,
  // each dep matched by its whole name, identity included.
  const why = (unit: LiveUnit): string => {
    const own = (u: Unit) => printed(u.plan.name) === printed(unit.plan.name);
    const held = unit.deps.flatMap((dep) => {
      const live = units.find(
        (u) => own(u) && printed(u.name) === printed(dep),
      );
      if (live)
        return live.wave === undefined ? [`${printed(dep)} unplaced`] : [];
      return state.divergedUnits.some(
        (d) =>
          d.names.some((n) => printed(n) === printed(dep)) &&
          d.versions.some(({ value }) => own(value)),
      )
        ? [`${printed(dep)} diverged`]
        : [`${printed(dep)} not live`];
    });
    return `unplaced: ${held.length ? held.join(', ') : 'no wave given'}`;
  };
  const placement = (unit: LiveUnit): string =>
    unit.wave === undefined ? `none — ${why(unit)}` : `${unit.wave}`;

  // The unit counts, for `own` units. With several plans shown, each plan's
  // counts are its own, never summed across plans.
  const counted = (own: readonly LiveUnit[]): string[] => [
    count(own.length, 'unit', 'units'),
    `${own.filter((u) => u.frontier).length} frontier`,
    `${own.filter((u) => u.wave === undefined).length} unplaced`,
    `${own.filter((u) => u.drift !== undefined).length} drifted`,
    `${own.filter((u) => u.suspicion.length).length} suspect`,
  ];
  const lines = [
    header(
      state.plans.length === 0
        ? 'no plan'
        : `${state.plans.length === 1 ? 'plan' : 'plans'} ${state.plans.map(planName).join(', ')}`,
      state,
      [
        ...(state.plans.length > 1
          ? state.plans.map(
              (p) =>
                `${printed(p.name)}: ${counted(
                  units.filter((u) => printed(u.plan.name) === printed(p.name)),
                ).join(', ')}`,
            )
          : counted(units)),
        count(state.owed.length, 'owed ruling', 'owed rulings'),
        `${state.divergedPlans.length + state.divergedUnits.length} diverged`,
        `${state.incoherent.length} incoherent`,
      ],
    ),
    ...resolveFirst([
      ...state.divergedPlans.flatMap((d) =>
        divergedLines(d, (p) => [planLine(p)]),
      ),
      ...state.divergedUnits
        .filter((d) => !d.frozen)
        .flatMap((d) =>
          divergedLines(
            d,
            (u) => [unitLine(u, u.state)],
            (u) => unitInFull(u, u.state),
          ),
        ),
      ...state.incoherent.map(incoherenceLine),
      ...drifted
        .filter((u) => !u.frozen)
        .map((u) => `drifted: ${printed(u.name)} — ${u.drift} since pinned`),
      ...suspect
        .filter((u) => !u.frozen)
        .map(
          (u) =>
            `suspect: ${printed(u.name)} — beneath ${printed(u.realizes)}, ${u.suspicion.join(', ')} since pinned`,
        ),
      ...state.owed.map((note) => `owed ruling: ${noteLine(note)}`),
    ]),
  ];

  if (name !== undefined)
    return [
      ...lines,
      ...drilled(
        name,
        ledgerOnly
          ? units
              .filter((u) => denotes(name, u.name))
              .map((u) => unitLedger(u, standing(u)))
          : [
              ...units
                .filter((u) => denotes(name, u.name))
                .map((u) => unitInFull(u, standing(u), placement(u))),
              ...[...plans.values()]
                .filter((p) => !p.diverged && denotes(name, p.name))
                .map((p) => planInFull(p)),
              ...state.withdrawnUnits
                .filter((u) => denotes(name, u.name))
                .map((u) => unitInFull(u, u.state)),
              ...state.withdrawnPlans
                .filter((p) => denotes(name, p.name))
                .map((p) => planInFull(p, ' — withdrawn')),
              ...state.divergedUnits
                .filter((d) => denotesAny(name, d.names))
                .map((d) => divergedLines(d, (u) => unitInFull(u, u.state))),
              ...state.divergedPlans
                .filter((d) => denotesAny(name, d.names))
                .map((d) => divergedLines(d, (p) => planInFull(p))),
            ],
      ),
    ].join('\n');

  // A diverged unit's line, in its place: marked, with its names.
  const divergedLine = (d: DivergedUnit): string =>
    `${d.names.map(printed).join(' or ')} — diverged, ${count(d.versions.length, 'version', 'versions')}${d.retracted.length ? ' and a retraction' : ''}`;
  for (const plan of plans.values()) {
    lines.push(`${planLine(plan)} — units in wave order:`);
    const ownPlan = (u: Unit) => printed(u.plan.name) === printed(plan.name);
    const own = units.filter(ownPlan);
    const split = state.divergedUnits.filter((d) =>
      d.versions.some(({ value }) => ownPlan(value)),
    );
    const waves = [
      ...new Set(
        [...own, ...split].flatMap((u) =>
          u.wave === undefined ? [] : [u.wave],
        ),
      ),
    ].sort((a, b) => a - b);
    for (const wave of waves) {
      lines.push(`  wave ${wave}:`);
      for (const unit of own)
        if (unit.wave === wave)
          lines.push(`    ${unitLine(unit, standing(unit))}`);
      for (const d of split)
        if (d.wave === wave) lines.push(`    ${divergedLine(d)}`);
    }
    const held = own.filter((u) => u.wave === undefined);
    const heldSplit = split.filter((d) => d.wave === undefined);
    if (held.length || heldSplit.length) {
      lines.push('  no wave:');
      for (const unit of held)
        lines.push(`    ${unitLine(unit, standing(unit))} · ${why(unit)}`);
      for (const d of heldSplit) lines.push(`    ${divergedLine(d)}`);
    }
  }
  return lines.join('\n');
}
