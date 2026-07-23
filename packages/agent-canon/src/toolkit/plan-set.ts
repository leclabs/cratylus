// plan-set.ts — the CANON home of the PLAN-LEVEL lifecycle (sibling to
// `plan-states.ts`, which owns the TASK-level state folders). Realizes
// `plans/plan-set-dynamics/DESIGN.md` §1–3, §6: the plan-as-whole phase machine,
// plan-set membership, the landing relation, and retirement.
//
// Two disciplines the design fixes and this module obeys:
//   • folder-as-state — a plan's membership/retirement is READ OFF its on-disk
//     residence (directly under `plans/` = in-scope; under `plans/.retired/` =
//     retired). No stored membership flag.
//   • derived-on-demand-never-stored — `landing(P)` is COMPUTED FROM GIT each call
//     and written NOWHERE (`∀P: stored(P)=∅` — no sidecar, no PLAN.md field, no
//     cache). `phase` likewise is a pure readout, never a stored field.
//
// ENGINE untouched, `PLAN_STATES` untouched: the plan tier adds no task-state
// folder and no scaffold path — only the lazily-`mkdir`ed `plans/.retired/`
// container, created by `retire`.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAN_STATES } from './plan-states.js';

/** On-disk container for retired plans; dot-prefixed ⇒ auto-excluded from `list`. */
export const RETIRED_DIR = '.retired';

/** A plan's lifecycle phase (plan-level; distinct from the task-level `States`). */
export type Phase = 'proposed' | 'in-flight' | 'landed' | 'retired';

/** The abstract succession map (mirrors the task machine's `next`). */
export const nextPhase: Readonly<Record<Phase, Phase>> = {
  proposed: 'in-flight',
  'in-flight': 'landed',
  landed: 'retired',
  retired: 'retired',
};

/**
 * The repo the plan-set lives in. Git ops run with `cwd = repoRoot`; the plan-set
 * is always `<repoRoot>/plans/`. Defaults to this repo (self-located from
 * `import.meta.url`); tests inject a temp repo.
 */
export interface PlanSetContext {
  readonly repoRoot: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const anatomyRoot = join(here, '..', '..');
/** Default context: the repo this module ships in (`packages/agent-canon/../..`). */
export const defaultContext: PlanSetContext = {
  repoRoot: join(anatomyRoot, '..', '..'),
};

const PLANS = 'plans';

function git(ctx: PlanSetContext, args: string[]): string {
  return execFileSync('git', args, {
    cwd: ctx.repoRoot,
    encoding: 'utf8',
  }).trim();
}

/** Files (not dirs, not dotfiles) directly under `plans/<plan>/<state>/`. */
function tasksInState(
  ctx: PlanSetContext,
  plan: string,
  state: string,
): string[] {
  const dir = join(ctx.repoRoot, PLANS, plan, state);
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && !e.name.startsWith('.'))
    .map((e) => e.name);
}

// ── derived from the task-level machine (fold over on-disk task placement) ──

/** `∃ t ∈ P : state(t) ∈ {active, completed}` — the plan has been dispatched. */
export function dispatched(ctx: PlanSetContext, plan: string): boolean {
  return (
    tasksInState(ctx, plan, 'active').length > 0 ||
    tasksInState(ctx, plan, 'completed').length > 0
  );
}

/** `∀ t ∈ P : state(t) = completed` (with ≥1 task) — all tasks landed on-disk. */
export function done(ctx: PlanSetContext, plan: string): boolean {
  if (tasksInState(ctx, plan, 'completed').length === 0) {
    return false;
  }
  return PLAN_STATES.filter((s) => s !== 'completed').every(
    (s) => tasksInState(ctx, plan, s).length === 0,
  );
}

// ── derived from on-disk residence (folder-as-state) ──

/** `dir(P)` resides under `plans/.retired/`. */
export function archived(ctx: PlanSetContext, plan: string): boolean {
  try {
    return readdirSync(join(ctx.repoRoot, PLANS, RETIRED_DIR)).includes(plan);
  } catch {
    return false;
  }
}

/** `¬archived(P)` — P is a member of the working set. */
export function inscope(ctx: PlanSetContext, plan: string): boolean {
  return !archived(ctx, plan);
}

// ── the landing relation — computed from VCS on demand, written NOWHERE ──

/** Is P "done" (all task-files under `completed/`, ≥1) in the tree at `sha`? */
function doneAt(ctx: PlanSetContext, sha: string, plan: string): boolean {
  let out: string;
  try {
    out = git(ctx, [
      'ls-tree',
      '-r',
      '--name-only',
      sha,
      '--',
      `${PLANS}/${plan}`,
    ]);
  } catch {
    return false;
  }
  const prefix = `${PLANS}/${plan}/`;
  const states = new Set<string>(PLAN_STATES);
  let hasCompleted = false;
  for (const f of out.split('\n').filter(Boolean)) {
    if (!f.startsWith(prefix)) {
      continue;
    }
    const seg = f.slice(prefix.length).split('/');
    // seg = [state, ...file]; a bare file in the plan dir (PLAN.md, .owner) has
    // length 1 and is not a task-file.
    const state = seg[0];
    if (seg.length < 2 || state === undefined || !states.has(state)) {
      continue;
    }
    if (state === 'completed') {
      hasCompleted = true;
    } else {
      return false; // a task-file still under pending/ready/active ⇒ not done
    }
  }
  return hasCompleted;
}

/**
 * `landing : P ⇀ commit` — the FIRST trunk commit at which every task-file of P
 * sits under `completed/` (P's result landed), as a sha; `undefined` if P has not
 * landed. Recomputed from git each call (`git log --first-parent` over
 * `plans/<plan>`); nothing is written (`stored(P) = ∅`).
 */
export function landing(ctx: PlanSetContext, plan: string): string | undefined {
  let shas: string[];
  try {
    shas = git(ctx, [
      'log',
      '--first-parent',
      '--reverse',
      '--format=%H',
      '--',
      `${PLANS}/${plan}`,
    ])
      .split('\n')
      .filter(Boolean);
  } catch {
    return undefined;
  }
  for (const sha of shas) {
    if (doneAt(ctx, sha, plan)) {
      return sha;
    }
  }
  return undefined;
}

/** `landingOf : P ↦ landing(P)` — recompute from VCS each call; write nothing. */
export const landingOf = landing;

/** `landing(P) defined ∧ ¬archived(P)` — phase-3 test / retirement trigger. */
export function landed(ctx: PlanSetContext, plan: string): boolean {
  return !archived(ctx, plan) && landing(ctx, plan) !== undefined;
}

// ── the plan-phase readout (total, priority-ordered, mutually exclusive) ──

/**
 * `phase : P → Phase` — a pure derivation over {archived, landed, dispatched},
 * never a stored field. Priority: archived ⇒ retired · landed ⇒ landed ·
 * dispatched ⇒ in-flight · else ⇒ proposed (DESIGN §3(1)).
 */
export function phase(ctx: PlanSetContext, plan: string): Phase {
  if (archived(ctx, plan)) {
    return 'retired';
  }
  if (landing(ctx, plan) !== undefined) {
    return 'landed';
  }
  if (dispatched(ctx, plan)) {
    return 'in-flight';
  }
  return 'proposed';
}

// ── plan-set membership ──

/** Dirs directly under `dir` that bear a `PLAN.md`, sorted; dotfiles skipped. */
function plansUnder(dir: string): string[] {
  let entries: import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .filter((name) => {
      try {
        return readdirSync(join(dir, name)).includes('PLAN.md');
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * `list = { P ∈ Plans | inscope(P) }` — plan dirs directly under `plans/` bearing
 * a `PLAN.md` (`.retired/` is dot-prefixed and holds no top-level `PLAN.md`, so it
 * is naturally skipped). `{ retired: true }` enumerates the archive instead.
 */
export function list(
  ctx: PlanSetContext = defaultContext,
  opts: { retired?: boolean } = {},
): string[] {
  const root = opts.retired
    ? join(ctx.repoRoot, PLANS, RETIRED_DIR)
    : join(ctx.repoRoot, PLANS);
  return plansUnder(root);
}

// ── retirement — preserve, don't delete ──

/**
 * `retire : P ↦ P'` — relocate `dir(P)` under `plans/.retired/` via `git mv`
 * (content + history preserved: a move, not a delete). Precondition `landed(P)`.
 * Leaves the move STAGED — the commit is gated (no `git commit`, no `git push`).
 */
export function retire(ctx: PlanSetContext, plan: string): void {
  if (!landed(ctx, plan)) {
    throw new Error(
      `retire: precondition landed(${plan}) not met (a plan retires only once its result lands)`,
    );
  }
  mkdirSync(join(ctx.repoRoot, PLANS, RETIRED_DIR), { recursive: true });
  git(ctx, ['mv', `${PLANS}/${plan}`, `${PLANS}/${RETIRED_DIR}/${plan}`]);
}
