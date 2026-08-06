// plan-set.ts — the CANON home of the PLAN-LEVEL lifecycle (sibling to
// `plan-states.ts`, which owns the TASK-level state folders): the plan-as-whole
// phase machine, plan-set membership, the landing relation, and retirement.
//
// RETIRE MEANS DELETE. It used to mean `git mv` into a `plans/.retired/` archive,
// and the cell asserted `content(retire(P)) = content(P)` — a postcondition
// deletion cannot satisfy. The law that refutes the archive was already in the
// cell: `retire(P) defined ⇔ terminal(P) ∧ drained(yield(P))`, and `drained` means
// every intent is ALREADY authored into its strongest seam. So the archive's
// content preserved nothing the corpus did not hold, and git holds the bytes
// regardless. (The shard that argued this retired with its plan; git holds it.)
//
// Two disciplines this module obeys:
//   • folder-as-state — a plan's MEMBERSHIP is its on-disk residence: a directory
//     under `plans/` bearing a `PLAN.md`. There is no second residence and no
//     stored membership flag; retirement is the member LEAVING.
//   • derived-on-demand-never-stored — `landing(P)` and its twin `retirement(P)`
//     are COMPUTED FROM GIT each call and written NOWHERE (`∀P: stored(P)=∅` — no
//     sidecar, no PLAN.md field, no cache). `phase` likewise is a pure readout.
//     `retiredDesignators` extends the same discipline one tier DOWN, to the shards
//     a retirement took with it: a set difference between what git has seen and what
//     the disk holds, with no manifest and no hand-kept list anywhere in it.
//
// THE CARRIER FOR "RETIRED" IS THE RETIRING COMMIT. A deleted plan resides
// nowhere, so residence cannot answer; VCS can, and the corpus had already made
// exactly this move once for `landing`. `retires(c, P) ⇔ c deletes dir(P)`, and
// `retirement(P)` is the first such commit on trunk — the twin of `lands`/`landing`.
//
// The ONE admitted stored signal is SUPERSESSION (`.superseded-by`): "P's work
// relocated to successor Q" cannot be derived from residence+git, so it is the sole
// fact this module stores — a tracked dotfile. This does not violate the discipline
// (never store what you CAN derive); it records what is inherently non-derivable.
// It widens the retire trigger from `landed` to `terminal = landed ∨ superseded`,
// so a superseded plan retires canonically instead of being hand-deleted.
//
// ENGINE untouched, `PLAN_STATES` untouched: the plan tier adds no task-state
// folder, no scaffold path, and — since the archive died — no container at all.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireRepoRoot } from '@repo/tooling/repo-root';
import { PLAN_STATES } from '../src/plan-states.js';

/** In-plan marker naming the successor a plan's work relocated to; its presence
 *  makes the plan `superseded` (a terminal phase). Supersession is NOT derivable
 *  from residence+git — it is the one relation this module stores, a tracked dotfile. */
export const SUPERSEDED_MARKER = '.superseded-by';

/** A plan's lifecycle phase (plan-level; distinct from the task-level `States`). */
export type Phase =
  | 'proposed'
  | 'in-flight'
  | 'landed'
  | 'superseded'
  | 'retired';

/** The abstract succession map (mirrors the task machine's `next`). `superseded` is
 *  an off-chain terminal (reachable from any pre-terminal phase) that leads to `retired`. */
export const nextPhase: Readonly<Record<Phase, Phase>> = {
  proposed: 'in-flight',
  'in-flight': 'landed',
  landed: 'retired',
  superseded: 'retired',
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
// ONE level, not two — this file sits at `tooling/`, not `src/toolkit/`. The stale hop
// resolved `repoRoot` to a directory with no `plans/`, so every derived set came back
// empty. THIRD instance of this class in one move (`render-oracle.sh`,
// `project-targets.ts`, here): a path expressed as a COUNT of parent hops encodes the
// file's own location in its body, so relocating the file silently changes what it
// points at, and the failure reads as "nothing found" rather than "wrong place".
const canonRoot = join(here, '..');
/** Default context: the repo this module ships in (`packages/canon/../..`). */
export const defaultContext: PlanSetContext = {
  repoRoot: requireRepoRoot(canonRoot),
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

// ── supersession — the one STORED signal (non-derivable), a tracked marker ──

/** The successor named in P's `.superseded-by` marker, or `undefined` if P bears none. */
export function supersededBy(
  ctx: PlanSetContext,
  plan: string,
): string | undefined {
  try {
    const body = readFileSync(
      join(ctx.repoRoot, PLANS, plan, SUPERSEDED_MARKER),
      'utf8',
    ).trim();
    return body.length > 0 ? body : undefined;
  } catch {
    return undefined;
  }
}

/** `superseded(P)` — P bears a `.superseded-by` marker (its work relocated to a
 *  successor). A STORED declaration: supersession cannot be derived from git. */
export function superseded(ctx: PlanSetContext, plan: string): boolean {
  return supersededBy(ctx, plan) !== undefined;
}

/**
 * `supersede : (P, by) ↦ P` — declare P's work relocated to successor `by` by
 * writing + STAGING the `.superseded-by` marker (commit gated, like `retire`).
 * `by` must be a known plan (in-scope ∨ retired) and not P itself.
 */
export function supersede(ctx: PlanSetContext, plan: string, by: string): void {
  const successor = by.trim();
  if (successor.length === 0) {
    throw new Error('supersede: a non-empty successor plan name is required');
  }
  if (successor === plan) {
    throw new Error('supersede: a plan cannot supersede itself');
  }
  // A retired plan is DELETED, so `Plans` (what is on disk) is the whole of what
  // can be named here — there is no archive to also consult.
  const known = new Set(list(ctx));
  if (!known.has(plan)) {
    throw new Error(`supersede: unknown plan '${plan}'`);
  }
  if (!known.has(successor)) {
    throw new Error(`supersede: unknown successor plan '${successor}'`);
  }
  const rel = `${PLANS}/${plan}/${SUPERSEDED_MARKER}`;
  writeFileSync(join(ctx.repoRoot, rel), `${successor}\n`);
  git(ctx, ['add', '--', rel]);
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

/** Trunk commits that touched `plans/<plan>`, oldest first. The one git walk both
 *  `landing` and its twin `retirement` fold over. */
function touchingCommits(ctx: PlanSetContext, plan: string): string[] {
  try {
    return git(ctx, [
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
    return [];
  }
}

/**
 * `landing : P ⇀ commit` — the FIRST trunk commit at which every task-file of P
 * sits under `completed/` (P's result landed), as a sha; `undefined` if P has not
 * landed. Recomputed from git each call (`git log --first-parent` over
 * `plans/<plan>`); nothing is written (`stored(P) = ∅`).
 */
export function landing(ctx: PlanSetContext, plan: string): string | undefined {
  for (const sha of touchingCommits(ctx, plan)) {
    if (doneAt(ctx, sha, plan)) {
      return sha;
    }
  }
  return undefined;
}

/** `landingOf : P ↦ landing(P)` — recompute from VCS each call; write nothing. */
export const landingOf = landing;

// ── the retirement relation — the twin of landing, likewise VCS-only ──
//
// `retire` DELETES, so residence can no longer answer "was P retired?": a deleted
// plan resides nowhere. The commit that deleted it can. `retires(c, P) ⇔ c deletes
// dir(P)`; `retirement(P)` is the first such commit on trunk. Nothing is stored —
// exactly the discipline `landing` already established.

/** Does the tree at `sha` hold NO file under `plans/<plan>`? */
function absentAt(ctx: PlanSetContext, sha: string, plan: string): boolean {
  try {
    const out = git(ctx, [
      'ls-tree',
      '-r',
      '--name-only',
      sha,
      '--',
      `${PLANS}/${plan}`,
    ]);
    return out.split('\n').filter(Boolean).length === 0;
  } catch {
    return false;
  }
}

/**
 * `retirement : P ⇀ commit` — the FIRST trunk commit at which `plans/<plan>` holds
 * no file, having held one at an earlier commit: the RETIRING commit. `undefined`
 * while P is still on disk (`P ∈ Plans` ⇒ not retired, whatever an older deletion
 * says — a re-authored plan is a live plan again) and for a plan git never saw.
 * Recomputed each call, written NOWHERE (`stored(P) = ∅`).
 */
export function retirement(
  ctx: PlanSetContext,
  plan: string,
): string | undefined {
  if (plansUnder(join(ctx.repoRoot, PLANS)).includes(plan)) {
    return undefined;
  }
  let existed = false;
  for (const sha of touchingCommits(ctx, plan)) {
    if (!absentAt(ctx, sha, plan)) {
      existed = true;
    } else if (existed) {
      return sha;
    }
  }
  return undefined;
}

/** `retirementOf : P ↦ retirement(P)` — recompute from VCS each call; write nothing. */
export const retirementOf = retirement;

/** `retired(P) ⇔ retirement(P) defined` — P's directory was deleted by a trunk
 *  commit and has not come back. The successor to the old residence test
 *  `dir(P) @ plans/.retired/`, which no longer names anything. */
export function retired(ctx: PlanSetContext, plan: string): boolean {
  return retirement(ctx, plan) !== undefined;
}

/** `landing(P) defined ∧ ¬retired(P)` — the plan's result landed on trunk. */
export function landed(ctx: PlanSetContext, plan: string): boolean {
  return !retired(ctx, plan) && landing(ctx, plan) !== undefined;
}

/** `terminal(P) ⇔ landed(P) ∨ superseded(P)` — P has no remaining live work, so it
 *  may retire: its result LANDED, or it was SUPERSEDED (work relocated). The retire
 *  trigger. */
export function terminal(ctx: PlanSetContext, plan: string): boolean {
  return landed(ctx, plan) || superseded(ctx, plan);
}

// ── the plan-phase readout (total, priority-ordered, mutually exclusive) ──

/**
 * `phase : P → Phase` — a pure derivation over {retired, superseded, landed,
 * dispatched}, never a stored field. Priority: retired ⇒ retired · superseded ⇒
 * superseded · landed ⇒ landed · dispatched ⇒ in-flight · else ⇒ proposed. An
 * explicit supersession declaration outranks the derived landed/in-flight readout.
 *
 * `retired` reads the RETIRING COMMIT, not a residence — which is why the readout
 * survives `retire` becoming a deletion, and why a plan whose deletion is merely
 * STAGED still reads `landed`: the fact's carrier is a commit, and it is not one yet.
 */
export function phase(ctx: PlanSetContext, plan: string): Phase {
  if (retired(ctx, plan)) {
    return 'retired';
  }
  if (superseded(ctx, plan)) {
    return 'superseded';
  }
  if (landing(ctx, plan) !== undefined) {
    return 'landed';
  }
  if (dispatched(ctx, plan)) {
    return 'in-flight';
  }
  return 'proposed';
}

// ── the SHARD-tier retirement relation — a SET DIFFERENCE over two sources ──
//
// `retirement(P)` above answers "when did THIS plan die", one plan at a time, by
// walking that plan's commits. The gate over dangling shard citations needs the
// dual: the WHOLE SET of designators no reader can follow any more, at once. Asking
// `retirement` about a designator is not merely slow, it is ill-typed — a shard is
// not a plan, and the retiring commit of the plan that HELD it is not a fact the
// citing source needs.
//
// The relation is a difference between two readouts, neither of them stored:
//
//   dead(D) ⇔ D ∈ ever(git)  ∧  D ∉ live(disk)
//
// "GIT HAS THE WRONG POLARITY" IS A REAL OBJECTION TO A DIFFERENT QUERY. History
// alone can only answer "did D ever exist", which is monotone and therefore useless
// as a liveness test. It is not being asked to. It supplies the HISTORICAL leg only;
// the worktree supplies the LIVE one, and dead is what the second removes from the
// first. That conjunction is why the empty plan set is the oracle's easy case rather
// than its blind spot: at `plans/ = ∅` the live leg is empty and EVERY historical
// designator reads dead, which is the correct answer. The historical leg is the one
// that cannot empty, and it is the one carrying the enumeration.
//
// THE LIVE LEG IS DELIBERATELY LIBERAL, and the asymmetry is the whole safety
// argument. `dead` is a difference, so a designator MISSED by the live leg becomes a
// false conviction against an author who did nothing wrong, while one wrongly
// admitted merely leaves a dangling citation uncaught for a commit or two. So the
// live leg reads the DISK directly — every `*.md` under any `plans/*/<state>/`,
// with no `PLAN.md` precondition and no consultation of the index. A shard authored
// but not yet committed is live; a plan dir mid-scaffold does not take its shards
// down with it.

/** A shard's DESIGNATOR — the basename of its task-file, extension dropped: what an
 *  author writes when citing the shard as a warrant. Derived from {@link PLAN_STATES}
 *  so a new state folder is covered without an edit here. The `.*` before the state
 *  segment admits the deeper layout the retired `plans/.retired/<plan>/<state>/`
 *  archive used, which git still holds and which named the same designators. */
const SHARD_PATH = new RegExp(
  `^${PLANS}/.*/(?:${PLAN_STATES.join('|')})/([^/]+)\\.md$`,
);

/** `designator : path ⇀ D` — the shard id a repo-relative path names, if it names one. */
export function designatorOf(path: string): string | undefined {
  return SHARD_PATH.exec(path)?.[1];
}

/**
 * `ever` — every designator git has seen under a state folder on trunk. Recomputed
 * from `git log --first-parent` each call, written NOWHERE.
 *
 * `--no-renames` is load-bearing, not defensive. Under rename detection a `git mv`
 * reports only the DESTINATION path, so a shard renamed rather than retired would
 * take its old designator out of history — the one designator a live source is most
 * likely to still be citing. Turning detection off reports a rename as a delete plus
 * an add, and both endpoints enter the set.
 */
export function everDesignated(
  ctx: PlanSetContext = defaultContext,
): Set<string> {
  const out = new Set<string>();
  let log: string;
  try {
    log = git(ctx, [
      'log',
      '--first-parent',
      '--no-renames',
      '--format=',
      '--name-only',
      '--',
      PLANS,
    ]);
  } catch {
    return out;
  }
  for (const path of log.split('\n')) {
    const d = designatorOf(path);
    if (d !== undefined) {
      out.add(d);
    }
  }
  return out;
}

/**
 * `live` — every designator the WORKING TREE holds. Read from disk, not the index:
 * an uncommitted shard is a shard, and the cost of missing one is a false conviction
 * (see the asymmetry argued above).
 */
export function liveDesignators(
  ctx: PlanSetContext = defaultContext,
): Set<string> {
  const out = new Set<string>();
  let plans: import('node:fs').Dirent[];
  try {
    plans = readdirSync(join(ctx.repoRoot, PLANS), { withFileTypes: true });
  } catch {
    return out; // `plans/ = ∅`, down to the directory itself — a legitimate state.
  }
  for (const plan of plans) {
    if (!plan.isDirectory() || plan.name.startsWith('.')) {
      continue;
    }
    for (const state of PLAN_STATES) {
      for (const file of tasksInState(ctx, plan.name, state)) {
        const d = designatorOf(`${PLANS}/${plan.name}/${state}/${file}`);
        if (d !== undefined) {
          out.add(d);
        }
      }
    }
  }
  return out;
}

/**
 * `retired = ever \ live` — the designators a citation can no longer reach, sorted.
 * The shard-tier twin of {@link retired}, and the same discipline: derived on demand
 * from git plus the disk, stored nowhere, maintained by nobody.
 */
export function retiredDesignators(
  ctx: PlanSetContext = defaultContext,
): string[] {
  const live = liveDesignators(ctx);
  return [...everDesignated(ctx)].filter((d) => !live.has(d)).sort();
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
 * `list = Plans` — plan dirs directly under `plans/` bearing a `PLAN.md`. With the
 * archive gone there is no second residence to filter against: what is on disk IS
 * the plan set, and retirement is a member leaving it.
 */
export function list(ctx: PlanSetContext = defaultContext): string[] {
  return plansUnder(join(ctx.repoRoot, PLANS));
}

// ── retirement — DELETE; git holds the bytes ──

/**
 * `retire : P ↦ ⊥` — DELETE `dir(P)`. Precondition `terminal(P)` (`landed(P) ∨
 * superseded(P)`); postcondition `P ∉ Plans`.
 *
 * The cell's full precondition is `terminal(P) ∧ drained(yield(P))`, and only the
 * first conjunct is machine-checkable — `drained` is a claim about whether every
 * intent the execution established was authored into its strongest seam, which no
 * predicate over the tree can decide. It is stated here rather than silently
 * dropped: the caller owes it.
 *
 * Nothing is archived, because there is nothing left to preserve: `drained` means
 * the yield is already in the corpus, and git holds every byte of the record
 * regardless. The deletion is STAGED (`git add -A -- plans/<plan>` after the rmdir,
 * which also sweeps untracked residue like `.bound`); the commit is gated, and that
 * commit is what makes `retirement(P)` — hence `phase(P) = retired` — readable.
 */
export function retire(ctx: PlanSetContext, plan: string): void {
  if (!terminal(ctx, plan)) {
    throw new Error(
      `retire: precondition terminal(${plan}) not met (a plan retires once its result LANDS or it is SUPERSEDED)`,
    );
  }
  // A LANDED plan carries no unfinished shard. This property used to be enforced
  // POST-HOC, by a gate that scanned the archive. Deletion left it with nothing to
  // scan — it did not become false, it became UNOBSERVABLE, which is how an invariant
  // decays without anyone noticing. `retire` still sees the pre-image, so the guard
  // belongs here, and here it is strictly stronger than the gate it replaces: the old
  // one convicted an archive AFTER the mistake was preserved; this one prevents it.
  //
  // SCOPED TO LANDED, and the scope is the finding. A SUPERSEDED plan legitimately
  // holds open shards — supersession means the work moved to the absorbing plan, so
  // its shards are not abandoned, they are somewhere else. Applying the guard to both
  // arms of `terminal` would forbid the one retirement path that exists precisely for
  // work that did not finish where it started.
  const open = superseded(ctx, plan)
    ? []
    : PLAN_STATES.filter((s) => s !== 'completed').flatMap((s) =>
        tasksInState(ctx, plan, s).map((t) => `${s}/${t}`),
      );
  if (open.length > 0) {
    throw new Error(
      `retire: ${plan} still carries ${open.length} unfinished shard(s) — each is work stopped without being dropped: ${open.join(', ')}`,
    );
  }
  const rel = `${PLANS}/${plan}`;
  rmSync(join(ctx.repoRoot, rel), { recursive: true, force: true });
  try {
    git(ctx, ['add', '-A', '--', rel]);
  } catch {
    // `git add` refuses a pathspec matching nothing in the index or the tree — the
    // case of a plan that was never committed. The disk is already correct.
  }
}
