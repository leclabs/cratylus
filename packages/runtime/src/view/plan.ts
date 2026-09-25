// ─────────────────────────────────────────────────────────────────────────────
// THE PLAN VIEW — one plan, its lifecycle state in the header, its units in wave
// order with the frontier marked in place, behind the drifted and suspect units,
// the owed rulings, the divergence and the incoherence that must be resolved
// first. Each unit line names the concept the unit serves.
//
// Lifecycle states are the `plan` skill's and arrive as display text. Wave,
// frontier, drift and suspicion arrive computed (`unit`, `pin`); this module
// orders by the wave it is given and computes none of them. A live unit given
// no wave still gets its line, after the waves, with the deps that keep it
// unplaced.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Diverged,
  type Incoherence,
  count,
  divergedLines,
  field,
  header,
  incoherenceLine,
  list,
  resolveFirst,
} from './layers.js';
import { type LiveNote, noteLine } from './notebook.js';

/** A plan as its reader sees it. */
export interface Plan {
  readonly name: string;
  readonly state: string;
}

/** A unit's full spec and lifecycle state as its reader sees it. */
export interface Unit {
  readonly name: string;
  /** The plan the unit belongs to. */
  readonly plan: Plan;
  /** The concept the unit realizes: its entity joins it to the design view,
   *  its anchor names it. */
  readonly realizes: { readonly entity: string; readonly anchor: string };
  readonly state: string;
  /** The names of the units it depends on. */
  readonly deps: readonly string[];
  readonly intent: string;
  readonly static: readonly string[];
  readonly outputs: readonly string[];
  readonly accept: readonly string[];
}

/** A live unit, with its entity identity and what `unit` and `pin` computed. */
export interface LiveUnit extends Unit {
  readonly entity: string;
  /** Its wave; `undefined` when a dep keeps it from any wave. */
  readonly wave: number | undefined;
  readonly frontier: boolean;
  readonly drifted: boolean;
  readonly suspect: boolean;
}

/** A plan computed at `commit`. */
export interface PlanState {
  readonly commit: string;
  /** The plan shown; absent when there is none to show. */
  readonly plan: Plan | undefined;
  /** The plan's live units, in the order given within each wave. */
  readonly units: readonly LiveUnit[];
  /** The owed rulings, each naming what it blocks. */
  readonly owed: readonly LiveNote[];
  readonly divergedPlans: readonly Diverged<Plan>[];
  readonly divergedUnits: readonly Diverged<Unit>[];
  readonly incoherent: readonly Incoherence[];
}

/** A plan with its lifecycle state, e.g. `record-store (s1)`. */
export function planName(plan: Plan): string {
  return `${plan.name} (${plan.state})`;
}

/** A unit's state and the marks computed on it, e.g. `u1, frontier, drifted`. */
export function standing(unit: LiveUnit): string {
  return [
    unit.state,
    ...(unit.frontier ? ['frontier'] : []),
    ...(unit.drifted ? ['drifted'] : []),
    ...(unit.suspect ? ['suspect'] : []),
  ].join(', ');
}

function unitLine(unit: Unit, marks: string): string {
  const deps = unit.deps.length ? ` · deps ${unit.deps.join(', ')}` : '';
  return `${unit.name} — ${marks} · realizes ${unit.realizes.anchor}${deps}`;
}

/** One unit in full; `placement` states the wave of a live unit. */
function unitInFull(unit: Unit, marks: string, placement?: string): string[] {
  return [
    `unit: ${unit.name} — ${marks}`,
    `  plan: ${planName(unit.plan)}`,
    `  realizes: ${unit.realizes.anchor}`,
    ...(placement === undefined ? [] : [`  wave: ${placement}`]),
    ...list('deps', unit.deps),
    ...field('intent', unit.intent),
    ...list('static', unit.static),
    ...list('outputs', unit.outputs),
    ...list('accept', unit.accept),
  ];
}

/**
 * The plan's view: the whole plan, or, given `entity`, that live unit in full,
 * or every version of that diverged unit in full, beneath the header and the
 * resolve-first layer.
 */
export function planView(state: PlanState, entity?: string): string {
  const { plan, units } = state;
  const drifted = units.filter((u) => u.drifted);
  const suspect = units.filter((u) => u.suspect);
  const unplaced = units.filter((u) => u.wave === undefined);

  // Why a unit has no wave: each dep that is not a placed live unit.
  const why = (unit: LiveUnit): string => {
    const held = unit.deps.flatMap((dep) => {
      const live = units.find((u) => u.name === dep);
      if (live) return live.wave === undefined ? [`${dep} unplaced`] : [];
      return state.divergedUnits.some((d) => d.name === dep)
        ? [`${dep} diverged`]
        : [`${dep} not live`];
    });
    return `unplaced: ${held.length ? held.join(', ') : 'no wave given'}`;
  };

  const lines = [
    header(plan ? `plan ${planName(plan)}` : 'no plan', state.commit, [
      count(units.length, 'unit', 'units'),
      `${units.filter((u) => u.frontier).length} frontier`,
      `${unplaced.length} unplaced`,
      `${drifted.length} drifted`,
      `${suspect.length} suspect`,
      count(state.owed.length, 'owed ruling', 'owed rulings'),
      `${state.divergedPlans.length + state.divergedUnits.length} diverged`,
      `${state.incoherent.length} incoherent`,
    ]),
    ...resolveFirst([
      ...state.divergedPlans.flatMap((d) =>
        divergedLines(d, (p) => [`plan ${planName(p)}`]),
      ),
      ...state.divergedUnits.flatMap((d) =>
        divergedLines(d, (u) => [unitLine(u, u.state)]),
      ),
      ...state.incoherent.map(incoherenceLine),
      ...drifted.map(
        (u) => `drifted: ${u.name} — ${u.realizes.anchor} changed since pinned`,
      ),
      ...suspect.map(
        (u) =>
          `suspect: ${u.name} — ${u.realizes.anchor} or a factor beneath it diverged or changed since pinned`,
      ),
      ...state.owed.map((note) => `owed ruling: ${noteLine(note)}`),
    ]),
  ];

  if (entity !== undefined) {
    const unit = units.find((u) => u.entity === entity);
    const diverged = state.divergedUnits.find((d) => d.entity === entity);
    return [
      ...lines,
      ...(unit
        ? unitInFull(
            unit,
            standing(unit),
            unit.wave === undefined ? `none — ${why(unit)}` : `${unit.wave}`,
          )
        : diverged
          ? divergedLines(diverged, (u) => unitInFull(u, u.state))
          : ['no live or diverged unit is that entity']),
    ].join('\n');
  }

  lines.push('units in wave order:');
  const waves = [
    ...new Set(units.flatMap((u) => (u.wave === undefined ? [] : [u.wave]))),
  ].sort((a, b) => a - b);
  for (const wave of waves) {
    lines.push(`  wave ${wave}:`);
    for (const unit of units)
      if (unit.wave === wave)
        lines.push(`    ${unitLine(unit, standing(unit))}`);
  }
  if (unplaced.length) {
    lines.push('  no wave:');
    for (const unit of unplaced)
      lines.push(`    ${unitLine(unit, standing(unit))} · ${why(unit)}`);
  }
  return lines.join('\n');
}
