import type { Skill, SkillExpression } from '../../manifest.js';
// The plan vocabulary this cell PROJECTS onto the capability's command line. It is
// canon's, sourced from its one home — the runtime depends on nothing and holds no
// plan layout, so the names travel as configuration on the invocation rather than
// as a second copy inside `@cratylus/runtime` (ARCHITECTURE property 4).
import {
  PLAN_FRONTIER,
  PLAN_MARKERS,
  PLAN_STATES,
} from '../../toolkit/plan-states.js';
import { praxis } from '../praxis/skill.js';

/** The terminal state — the last of the lifecycle, never a second literal. */
const COMPLETED = PLAN_STATES[PLAN_STATES.length - 1];

/** The projected configuration, verbatim as `elevate` takes it. */
const LAYOUT =
  `--plan-root <plans/> --states ${PLAN_STATES.join(',')} --completed ${COMPLETED} ` +
  `--frontier ${PLAN_FRONTIER.join(',')} --bound-marker ${PLAN_MARKERS.bound} ` +
  `--ruling-owed-marker ${PLAN_MARKERS.rulingOwed}`;

const carryOnNotation: SkillExpression =
  `carry-on ≜ re-dispatch-word ↦ elevate · persist · revert
re-dispatch-word ≜ weitermachen ∨ carry-on ∨ proceed
verb      ∈ { elevate · revert · terminus · status } ⟨runtime-bound ; each reached as \`scripts/carryOn.mjs <verb>\`⟩
loop-position ∈ { on-the-loop, out-of-the-loop }   ⟨live session state, ¬ a static value⟩
resting   ≜ loop-position = on-the-loop   ⟨a session opens in orientation · intent is the operator's to set⟩
P         ≜ the bound praxis ⟨∨ the standing intent, absent one⟩
bound, done, sharded, frontier, dir, triage, file, defect, impedes @ praxis
target, target₀, foreign, attached ⟨the same hook-config artifact, gated here rather than tapped⟩ @ event-tap
layout    ≜ ${LAYOUT}
            ⟨canon's plan vocabulary, projected onto the command line · the runtime knows no plan⟩
ruling-owed(P) ⇔ ${PLAN_MARKERS.rulingOwed} @ dir(P) ⟨the carrier of fork⊥ · content = the fork as put to the operator · stored ∵ ¬ derivable, exactly as ${PLAN_MARKERS.bound} is⟩
fork⊥     ≜ fork(irreversible · value · competence) the principal cannot resolve
terminus  ⇔ ¬∃P: bound(P) ∨ ruling-owed(P) ∨ done(P) ∨ (sharded(P) ∧ ¬ done(P) ∧ frontier(P) = ∅)
regression ≜ defect d : impedes(d, t) for the shard t in hand
elevate   ≜ \`scripts/carryOn.mjs elevate --event turn.end <layout>\` ∴ attached(target) ∧ loop-position := out-of-the-loop ∧ bind(P)
            ⟨attached ⇒ the harness runs \`scripts/carryOn.mjs terminus\` at every turn-end and refuses the close while ¬ terminus⟩
revert    ≜ \`scripts/carryOn.mjs revert\` ∴ ¬ attached(target) ∧ loop-position := resting
status    ≜ \`scripts/carryOn.mjs status\` ↦ ⟨attached(target), terminus⟩

check-in-close ∧ re-dispatch-word ⇒ elevate
elevate ⇒ standing-intent unchanged ∧ ¬fresh-dispatch ∧ ¬permission-grant
elevate ⇒ resume execution ⟨own judgment · reversible-in-domain decided · no fresh permission owed⟩
elevate defined ⇔ ¬ terminus ⟨at a terminus there is nothing to stay out of the loop FOR⟩
elevate ⊨ attached(target) read back @ target ; ¬ attached ⇒ ⊥ ⟨loud ∧ ¬ elevation reported : text is advisory, a mechanism is not⟩
attached(target) ∧ ¬ terminus ⇒ turn ¬ end ⟨the mechanism refuses ; the assertion never could⟩
bind(P) ∧ ¬ terminus ⇒ persist ⟨∀ turn · ¬ per-turn-decay⟩
terminus ⇒ revert ∴ loop-position = resting
revert ∘ elevate ⊨ target ≡ target₀ ∧ foreign preserved ⟨zero residue⟩
elevate ⊨ revert owed ⟨an un-reverted elevation outlives the plan it was bound to⟩
terminus ≜ derived @ disk ⟨∴ a fresh process reads the same truth · ∄ read(transcript ∨ message) ∴ ∄ misfire on mid-turn narration⟩
fork⊥ ⇒ write ${PLAN_MARKERS.rulingOwed} @ dir(P) ∧ surface the fork ∧ re-enter on-the-loop ⟨a fork surfaced without its carrier is unreadable at turn-end⟩
sharded(P) ∧ ¬ done(P) ∧ frontier(P) = ∅ ⇒ terminus ∧ SURFACE ⟨R ill-formed ⟨cycle ∨ unsatisfiable dep⟩ · else the mis-cut wedges the session⟩
regression ⇒ fix ∧ ¬check-in ⟨repair in the path is execution, ¬ a new fork⟩
defect ∧ ¬regression ⇒ file ∧ ¬fix ⟨out-of-path defects are recorded, ¬ chased⟩
verb ∉ { elevate · revert · terminus · status } ⇒ ⊥ ⟨loud⟩
` as SkillExpression;

export const carryOn: Skill = {
  name: 'carry-on',
  description: `use this skill when the Operator utters the re-dispatch word (weitermachen · carry on · proceed) — closing a check-in and returning you to autonomous execution under re-affirmed authority; elevate installs the turn-end gate that holds the elevation (an assertion in prose is advisory, a gate is not), the elevation persists across turns bound to the bound praxis, and it lifts only at a terminus read from plan state on disk — the plan is done, a ruling is owed, or the cut is ill-formed — whereupon revert removes the gate with zero residue.`,
  formalBlock: carryOnNotation,
  runtime: { capability: 'carryOn' },
  composition: () => [praxis],
};
