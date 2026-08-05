// ─────────────────────────────────────────────────────────────────────────────
// TERMINUS — the one question this capability answers, read from disk.
//
//   terminus ⇔ ¬∃P: bound(P)                            -- nothing is elevated
//            ∨ ruling-owed(P)                            -- a fork the principal cannot resolve
//            ∨ done(P)                                   -- open states empty ∧ completed non-empty
//            ∨ (sharded(P) ∧ ¬done(P) ∧ frontier(P) = ∅) -- the dep graph is ill-formed · SURFACE
//
// EVERY DISJUNCT IS A PREDICATE OVER FILES. This module opens directories and asks
// whether files are in them. It never reads a transcript, a message, or the text of
// a turn — the failure mode that convicted the predecessor mechanism was judging
// EMITTED TEXT, where mid-turn narration read as the turn's close and blocked turns
// that were about to go on making tool calls. A predicate over placement cannot
// mis-fire that way: `plans/<P>/ready/` either has a file in it or it does not.
//
// THE FOURTH DISJUNCT IS THE ESCAPE, and it is here from the start rather than
// retrofitted. A plan whose shards are all `pending` behind an unsatisfiable or
// cyclic dependency has nothing workable and is not done: without this disjunct the
// gate would block every turn forever with no on-disk act available to clear it. It
// reports terminus AND says the graph is ill-formed, because both are true and the
// second is the thing the operator has to hear.
//
// IT KNOWS NO PLAN VOCABULARY. The plan root, the state folder names, which state
// is terminal, which states form the frontier, and the marker filenames all arrive
// as {@link PlanLayout} — configuration the projection emitted, sourced from canon's
// one home (`canon/src/toolkit/plan-states.ts`). `@cratylus/runtime` depends on
// nothing (ARCHITECTURE property 4), so a bundled default here would be the same
// hand-copied second home the event-tap vocabulary repair closed.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The plan-set layout, as canon states it and the projection hands it over. Every
 * field is a NAME this package must not know: it is received, never defaulted.
 */
export interface PlanLayout {
  /** Absolute path of the plan set — the directory whose children are plans. */
  readonly root: string;
  /** The task-file state folders, in lifecycle order. */
  readonly states: readonly string[];
  /** The terminal state: a task-file here is finished. */
  readonly completed: string;
  /** The states a shard sits in when the plan is workable AT it. */
  readonly frontier: readonly string[];
  /** The marker file whose presence at `dir(P)` means P is the bound plan. */
  readonly boundMarker: string;
  /** The marker file whose presence at `dir(P)` records a fork put to the operator. */
  readonly rulingOwedMarker: string;
}

/**
 * WHICH disjunct answered — the readout's reason, never a second decision. Exactly
 * one non-terminal value (`in-flight`); the other four are the four disjuncts.
 */
export type Ground =
  | 'unbound'
  | 'ruling-owed'
  | 'done'
  | 'ill-formed'
  | 'in-flight';

/** The answer, with the plan it is about and a sentence an agent can act on. */
export interface TerminusReadout {
  readonly terminus: boolean;
  readonly ground: Ground;
  /** The bound plan, when one is bound. */
  readonly plan?: string;
  /** What the ground means here, in terms of files — the text a refusal carries. */
  readonly detail: string;
}

/** Directory entries of `dir` that are directories, dotfiles skipped; `[]` if absent. */
function dirsUnder(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/** Task-files (not dirs, not dotfiles) directly under `<root>/<plan>/<state>/`. */
function shardsIn(layout: PlanLayout, plan: string, state: string): string[] {
  try {
    return readdirSync(join(layout.root, plan, state), { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * `bound(P)` — the plan bearing the bound marker. The praxis law is `∃! P :
 * bound(P)` (WIP=1), and this returns the FIRST in sorted order: a second marker is
 * a violation of that law, not a case for this readout to arbitrate.
 */
export function boundPlan(layout: PlanLayout): string | undefined {
  for (const plan of dirsUnder(layout.root)) {
    if (existsSync(join(layout.root, plan, layout.boundMarker))) return plan;
  }
  return undefined;
}

/** The first non-empty line of a marker file — the fork as it was put to the operator. */
function markerText(path: string): string {
  try {
    const line = readFileSync(path, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l !== '');
    return line ?? '(the marker names no fork)';
  } catch {
    return '(the marker is unreadable)';
  }
}

/**
 * Read the terminus predicate off the plan set. Total: every input yields a readout,
 * and an unreadable or absent plan root reads as `unbound` — there is no plan there
 * to be elevated for, which is the same answer as no marker.
 *
 * DISJUNCT ORDER IS THE REASON'S PRIORITY, not the predicate's meaning (a
 * disjunction has no order). An owed ruling outranks the derived `done`/`in-flight`
 * readouts for the reason `phase()` puts `superseded` above `landed`: an explicit
 * declaration someone WROTE outranks a state inferred from placement.
 */
export function terminusOf(layout: PlanLayout): TerminusReadout {
  const plan = boundPlan(layout);
  if (plan === undefined) {
    return {
      terminus: true,
      ground: 'unbound',
      detail: `no plan under ${layout.root} bears \`${layout.boundMarker}\` — nothing is bound, so nothing is elevated`,
    };
  }

  const owed = join(layout.root, plan, layout.rulingOwedMarker);
  if (existsSync(owed)) {
    return {
      terminus: true,
      ground: 'ruling-owed',
      plan,
      detail: `${plan} bears \`${layout.rulingOwedMarker}\`: ${markerText(owed)} — a ruling is owed and the principal cannot take it`,
    };
  }

  const open = layout.states.filter((s) => s !== layout.completed);
  const openShards = open.flatMap((s) =>
    shardsIn(layout, plan, s).map((t) => `${s}/${t}`),
  );
  const completed = shardsIn(layout, plan, layout.completed);
  const sharded = openShards.length > 0 || completed.length > 0;

  if (completed.length > 0 && openShards.length === 0) {
    return {
      terminus: true,
      ground: 'done',
      plan,
      detail: `${plan} has ${completed.length} shard(s) under \`${layout.completed}\` and none under ${open.map((s) => `\`${s}\``).join(', ')}`,
    };
  }

  const frontier = layout.frontier.flatMap((s) =>
    shardsIn(layout, plan, s).map((t) => `${s}/${t}`),
  );
  if (sharded && frontier.length === 0) {
    return {
      terminus: true,
      ground: 'ill-formed',
      plan,
      detail: `SURFACE: ${plan} has ${openShards.length} unfinished shard(s) and an EMPTY frontier (${layout.frontier.map((s) => `\`${s}\``).join(', ')} are empty) — its dependency graph is ill-formed (a cycle, or a dep nothing satisfies). The plan cannot be worked as cut; say so to the operator`,
    };
  }

  return {
    terminus: false,
    ground: 'in-flight',
    plan,
    detail: sharded
      ? `${plan} has ${frontier.length} shard(s) on its frontier (${frontier.join(', ')})`
      : `${plan} is bound but not yet cut into shards — the cut is owed before dispatch`,
  };
}
