import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { exemplify } from '../exemplify/skill.js';
import { materialize } from '../materialize/skill.js';

export const dream: Skill = {
  name: 'dream',
  description: `use this skill to consolidate an agent's memory — fold the raw EPISODIC stream (the tool computes each record's scope node from its cwd), then route by type: agent-intrinsic identity/facts to SEMANTIC, generalized cross-project wisdom to PROCEDURAL (only what no projection already carries), a fleet/system/mechanism truth promoted into the projected+gated canon (or emitted as a canon-candidate task) rather than parked in private memory, forward next-steps to EPISODIC, the rest dropped; consumed raw is drained; SOUL is never written.`,
  formalBlock:
    `memory              ≜ agent dimension-home ⟨SEMANTIC · PROCEDURAL · EPISODIC⟩ ∪ the memory-tool runtime
EPISODIC            ≜ raw time-ordered event stream ∪ forward next-steps
SEMANTIC            ≜ identity facts ∪ durable agent-intrinsic knowledge ⟨hot index⟩
PROCEDURAL          ≜ generalized cross-project wisdom no projection already carries
SOUL                ≜ the archetype ; commons-authored ; ∉ dream outputs
lock                ≜ dream.lock ⟨O_EXCL ; stale ⇔ age > 2h⟩ guarding the {SEMANTIC · PROCEDURAL} partition ⟨shared by all same-host sessions of one agent ; ¬ project-scoped⟩
node                : cwd × host → scope ⟨nearest boundary-marker ancestor ; markerless ↦ self ; cwd-less ↦ legacy⟩
scope(i)            ≜ node(cwd(i)) COMPUTED at fold ⟨capture is scope-blind ; ¬judged-at-capture⟩
read                : home × session → records ⟨own ∪ completed ; live-sibling ∉⟩
fold                : home → { id ↦ node ∪ legacy }
drain               : home → ∅ ↾ completed-sessions ⟨--completed-only retains a live sibling ; --for-session adds self at handoff⟩
route               : record → { SEMANTIC · PROCEDURAL · CANON-PROMOTION · EPISODIC · drop }
dfp(i)              ≜ densest-faithful-point(i)
depalimpsest        ≜ reconcile the resident set to current ground-truth ⟨¬only-drop-stale⟩
promotion-is-move   ≜ a promoted item ∉ its raw source
canon-truth(i)      ⇔ i binds ≥1 agent-type ∨ the fleet ∨ is a mechanism/governance-fact ⟨¬ this-agent-only⟩
CANON-PROMOTION(i)  ≜ author i into its strongest seam ⟨gate ≻ cell ≻ governing-doc⟩ ; ¬canon-remit ⇒ emit a canon-candidate task to the curator ; then projection-carries(i) ⇒ drop ⟨PROCEDURAL⟩

dream ≜ read ⟨EPISODIC⟩ ↦ exemplify ↦ materialize
lock-precondition ≜ acquire(lock) before any write to {SEMANTIC · PROCEDURAL} ∨ any drain ; held-by-live-other ⇒ skip consolidation this wake ⟨raw preserved ; encode always-legal⟩
∀ i ∈ read(home, session) : i = dfp(i)
instances-governing-exemplar(i) ⇒ i ↦ pointer
node(i) ∉ { HOME · legacy } ⇒ i ∉ SEMANTIC ∧ i ∉ PROCEDURAL
identity(i) ∨ agent-intrinsic-durable(i) ⇒ i ↦ SEMANTIC
generalized-wisdom(i) ∧ ¬projection-carries(i) ∧ canon-truth(i)  ⇒ i ↦ CANON-PROMOTION
generalized-wisdom(i) ∧ ¬projection-carries(i) ∧ ¬canon-truth(i) ⇒ i ↦ PROCEDURAL
projection-carries(i) ⇒ i ↦ drop
next-step(i) ⇒ i ↦ EPISODIC ⟨own-node⟩
else ⇒ i ↦ drop
drain ≜ .bak archive before clear ; forward-residue re-encoded after drain ; release(lock) last
consumed ↦ ∅ ∴ ¬unbounded-growth(EPISODIC)
EPISODIC ──dream──→ { SEMANTIC · PROCEDURAL · EPISODIC }
periodic : SEMANTIC ──depalimpsest──→ { SEMANTIC · PROCEDURAL }
    generalized-wisdom(i) ∧ ¬projection-carries(i) ⇒ i ↦ CANON-PROMOTION ↾ canon-truth(i) ; else PROCEDURAL   ( projection-carries(i) ⇒ ∅ )
    superseded(i)                                  ⇒ ∅
    stale(i)                                       ⇒ ∅
acceptance ≜ wake-read biases next-action ⟨reboot-seed ; round-trip ≽⟩
¬graspable-in-one-glance(i) ⇒ distill-further(i) ∨ drop(i)
SOUL ∉ dream-outputs` as SkillExpression,
  composition: () => [exemplify, materialize],
};
