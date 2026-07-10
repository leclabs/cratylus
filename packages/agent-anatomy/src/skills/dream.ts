import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { exemplify } from './exemplify.js';
import { materialize } from './materialize.js';

export const dream: Skill = {
  name: 'dream',
  description: `use this skill to consolidate an agent's memory — fold the raw EPISODIC stream (the tool computes each record's scope node from its cwd), then route by type: agent-intrinsic identity/facts to SEMANTIC, generalized cross-project wisdom to PROCEDURAL (only what no projection already carries), forward next-steps to EPISODIC, the rest dropped; consumed raw is drained; SOUL is never written.`,
  formalBlock: `DECLARATIONS
memory              — agent organ-home ⟨SEMANTIC · PROCEDURAL · EPISODIC⟩ ∪ the memory-tool runtime
EPISODIC            — raw time-ordered event stream ∪ forward next-steps
SEMANTIC            — identity facts ∪ durable agent-intrinsic knowledge ⟨hot index⟩
PROCEDURAL          — generalized cross-project wisdom no projection already carries
SOUL                — the archetype ; commons-authored ; ∉ dream outputs
lock                — dream.lock ⟨O_EXCL ; stale ⇔ age > 2h⟩ guarding the shared {SEMANTIC · PROCEDURAL} partition — same-host sessions of one agent share it regardless of project
node                : cwd × host → scope ⟨nearest boundary-marker ancestor ; markerless ↦ self ; cwd-less ↦ legacy⟩
scope(i)            ≜ node(cwd(i)) COMPUTED at fold ⟨capture is scope-blind ; ¬judged-at-capture⟩ — the record carries {host, cwd}, never a scope tag
read                : home × session → records ⟨own ∪ completed ; live-sibling ∉⟩
fold                : home → { id ↦ node ∪ legacy }
drain               : home → ∅ ↾ completed-sessions ⟨--completed-only retains a live sibling ; --for-session adds self at handoff⟩
route               : record → { SEMANTIC · PROCEDURAL · EPISODIC · drop }
distill(i)          ≜ densest-faithful-point(i)
depalimpsest        — reconcile the resident set to current ground-truth ⟨¬only-drop-stale⟩
promotion-is-move   — a promoted item ∉ its raw source

LAWS
dream ≜ read ⟨EPISODIC⟩ ↦ exemplify ↦ materialize
lock-precondition ≜ acquire(lock) before any write to {SEMANTIC · PROCEDURAL} ∨ any drain ; held-by-live-other ⇒ skip consolidation this wake ⟨raw preserved ; encode always-legal⟩
∀ i ∈ read(home, session) : i = distill(i)
instances-governing-exemplar(i) ⇒ i ↦ pointer            -- cite, don't copy
node(i) ∉ { HOME · legacy } ⇒ i ∉ SEMANTIC ∧ i ∉ PROCEDURAL   -- a node-scoped non-derivable gotcha ↦ code-site comment (outside dream's route) ; else drop
identity(i) ∨ agent-intrinsic-durable(i) ⇒ i ↦ SEMANTIC
generalized-wisdom(i) ∧ ¬projection-carries(i) ⇒ i ↦ PROCEDURAL
projection-carries(i) ⇒ i ↦ drop
next-step(i) ⇒ i ↦ EPISODIC                              -- own-node forward residue only
drain ≜ .bak archive before clear ; forward-residue re-encoded after drain ; release(lock) last
consumed ↦ ∅ ∴ ¬unbounded-growth(EPISODIC)
EPISODIC ──dream──→ { SEMANTIC · PROCEDURAL · EPISODIC }   -- the fold+route cascade
periodic : SEMANTIC ──dream──→ { SEMANTIC · PROCEDURAL }   -- depalimpsest the resident set vs current ground-truth
    generalized-wisdom(i) ∧ ¬projection-carries(i) ⇒ i ↦ PROCEDURAL   ( projection-carries(i) ⇒ ∅ )
    superseded(i)                                  ⇒ ∅                -- palimpsest: a newer resident fact overturned i, ¬merely stale
    stale(i)                                       ⇒ ∅
acceptance ≜ wake-read biases next-action ⟨reboot-seed ; round-trip ≽⟩
¬graspable-in-one-glance(i) ⇒ distill-further(i) ∨ drop(i)
SOUL ∉ dream-outputs` as SkillExpression,
  composition: () => [exemplify, materialize],
};
