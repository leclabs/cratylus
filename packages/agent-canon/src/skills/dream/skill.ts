import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { exemplify } from '../exemplify/skill.js';
import { materialize } from '../materialize/skill.js';

export const dream: Skill = {
  name: 'dream',
  description: `use this skill to consolidate an agent's memory — fold the raw EPISODIC stream (the tool computes each record's capture node from its cwd — provenance, not what the record is about), then route by type: agent-intrinsic identity/facts to SEMANTIC, generalized cross-project wisdom to PROCEDURAL (only what no projection already carries), a fleet/system/mechanism truth promoted into the projected+gated canon (or emitted as a canon-candidate task) rather than parked in private memory, forward next-steps to EPISODIC, the rest dropped; consumed raw is drained; SOUL is never written.`,
  formalBlock:
    `memory              ≜ agent dimension-home ⟨SEMANTIC · PROCEDURAL · EPISODIC⟩ ∪ the memory-tool runtime
EPISODIC            ≜ raw time-ordered event stream ∪ forward next-steps
SEMANTIC            ≜ identity facts ∪ durable agent-intrinsic knowledge ⟨hot index⟩
PROCEDURAL          ≜ generalized cross-project wisdom no projection already carries
SOUL                ≜ the archetype ; commons-authored ; ∉ dream outputs
lock                ≜ dream.lock ⟨O_EXCL ; stale ⇔ age > 2h⟩ guarding the {SEMANTIC · PROCEDURAL} partition ⟨shared by all same-host sessions of one agent ; ¬ project-scoped⟩ ; \`scripts/memory.mjs lock (acquire|release|status) --name <agent>\`
node                : cwd × host → provenance ⟨WHERE-captured ; nearest boundary-marker ancestor ; markerless ↦ self ; cwd-less ∨ vanished-cwd ↦ legacy⟩
scope(i)            ≜ what i is ABOUT ⟨read from text(i) ; ¬ node(i) : provenance ≠ scope⟩
project-referential ≜ scope(i) ↾ one particular project ⟨text(i) names a repo-key ∨ workspace-path ∨ plan-path ∨ branch-ref ∨ issue-ref ; gate detects exactly these⟩
read                : home × session → records ⟨own ∪ completed ; live-sibling ∉⟩ ; \`scripts/memory.mjs read --name <agent> --for-session <self>\`
fold                : home → { id ↦ node ∪ legacy } ; \`scripts/memory.mjs fold --name <agent>\`
drain               : home → ∅ ↾ completed-sessions ⟨--completed-only retains a live sibling ; --for-session adds self at handoff⟩ ; \`scripts/memory.mjs drain --name <agent> --completed-only\`
route               : record → { SEMANTIC · PROCEDURAL · CANON-PROMOTION · EPISODIC · drop }
land                : route-manifest → { SEMANTIC · PROCEDURAL } ⟨the routing is MINE ; the write is the tool's⟩ ; \`scripts/memory.mjs apply --name <agent> --routes -\`
resident            : store → text ⟨read the whole prose home ; ¬ open its path⟩ ; \`scripts/memory.mjs get --name <agent> --store (SEMANTIC|PROCEDURAL)\`
rollover            ≜ land ⊕ drain ⊕ re-encode(residue) ATOMIC under one lock ⟨residue between drain ∧ re-encode lives ONLY in my context ∴ a gap loses it⟩ ; \`scripts/memory.mjs rollover --name <agent> --routes - --residue '<json>'\`
gate                : home → findings × pressure ⟨dream's exit condition⟩ ; \`scripts/memory.mjs audit --name <agent>\`
ceiling             ≜ per-store byte watermark ⟨SEMANTIC ∪ PROCEDURAL load WHOLE every wake ∴ bytes are a per-session context cost⟩
pressure            ≜ { s ∈ { SEMANTIC · PROCEDURAL } | bytes(s) > ceiling } ⟨gate MEASURES it ; depalimpsest's only trigger⟩
dfp(i)              ≜ densest-faithful-point(i)
depalimpsest        ≜ reconcile the resident set to current ground-truth ⟨¬only-drop-stale⟩ ; supersede the whole file, ¬ append : \`scripts/memory.mjs replace --name <agent> --store (SEMANTIC|PROCEDURAL) --body -\`
promotion-is-move   ≜ a promoted item ∉ its raw source ⟨an obligation discharged AT the promotion, ¬ a later drain's finding⟩
canon-truth(i)      ⇔ i binds ≥1 agent-type ∨ the fleet ∨ is a mechanism/governance-fact ⟨¬ this-agent-only⟩
CANON-PROMOTION(i)  ≜ author i into its strongest seam ⟨gate ≻ cell ≻ governing-doc⟩ ; ¬canon-remit ⇒ emit a canon-candidate task to the curator ; then projection-carries(i) ⇒ drop ⟨PROCEDURAL⟩

dream ≜ read ⟨EPISODIC⟩ ↦ exemplify ↦ materialize
lock-precondition ≜ acquire(lock) before any write to {SEMANTIC · PROCEDURAL} ∨ any drain ; held-by-live-other ⇒ skip consolidation this wake ⟨raw preserved ; encode always-legal⟩
∀ i ∈ read(home, session) : i = dfp(i)
instances-governing-exemplar(i) ⇒ i ↦ pointer
project-referential(i) ⇒ i ∉ SEMANTIC ∧ i ∉ PROCEDURAL ⟨generalize past the instance ∨ drop ; node(i) binds NOTHING here⟩
identity(i) ∨ agent-intrinsic-durable(i) ⇒ i ↦ SEMANTIC
generalized-wisdom(i) ∧ ¬projection-carries(i) ∧ canon-truth(i)  ⇒ i ↦ CANON-PROMOTION
generalized-wisdom(i) ∧ ¬projection-carries(i) ∧ ¬canon-truth(i) ⇒ i ↦ PROCEDURAL
projection-carries(i) ⇒ i ↦ drop
next-step(i) ⇒ i ↦ EPISODIC ⟨own-node⟩
else ⇒ i ↦ drop
drain ≜ .bak archive before clear ; forward-residue re-encoded after drain ; release(lock) last
land ⊕ drain ⊕ re-encode ⇒ rollover ⟨¬ three invocations : the gap is where residue dies⟩
consumed ↦ ∅ ∴ ¬unbounded-growth(EPISODIC)
EPISODIC ──dream──→ { SEMANTIC · PROCEDURAL · EPISODIC }
land(i)         ⇔ bytes(store ∪ i) ≤ ceiling ⟨¬land(i) ⇒ ⊥ : the tool refuses, naming store · ceiling · overage⟩
depalimpsest(b) ⇔ bytes(b) ≤ ceiling ∨ bytes(b) < bytes(store) ⟨STRICT shrink accepted EVEN over ceiling ∴ over-ceiling ⇒ frozen-to-shrink, ¬ bricked⟩
¬land(i)        ⇒ depalimpsest ≺ re-land(i) ⟨the refusal IS the eviction summons ; distil to the named target ; ¬ retry-unchanged ; ¬ hand-edit the store⟩
∀ s ∈ pressure : s ──depalimpsest──→ { SEMANTIC · PROCEDURAL } ⟨THAT an eviction is owed is measured ; WHAT to evict is MY judgement⟩
    generalized-wisdom(i) ∧ ¬projection-carries(i) ⇒ i ↦ CANON-PROMOTION ↾ canon-truth(i) ; else PROCEDURAL   ( projection-carries(i) ⇒ ∅ )
    superseded(i)                                  ⇒ ∅
    stale(i)                                       ⇒ ∅
acceptance ≜ wake-read biases next-action ⟨reboot-seed ; round-trip ≽⟩
¬graspable-in-one-glance(i) ⇒ distill-further(i) ∨ drop(i)
SOUL ∉ dream-outputs
verb-over-prose ≜ ∀ step declaring an invocation : invoke it ⟨the tool owns the write · I own only the routing⟩ ; hand-editing a store the tool can write is the defect` as SkillExpression,
  runtime: { capability: 'memory' },
  composition: () => [exemplify, materialize],
};
