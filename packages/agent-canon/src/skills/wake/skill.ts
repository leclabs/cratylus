import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { dream } from '../dream/skill.js';

const WAKE_BLOCK = `WAKE ≜ begin → catch-up → load → orient → resume

agent       ≜ this agent's name
memory      ≜ capability ⟨strategy-encapsulated : where it stores · in what format · how it scopes · what it migrates are ITS concern, ¬ this protocol's⟩
ground      ≜ project/{ VISION · MODEL · ENGINE · CANON } · PLAN.md(active)
salient     ≜ { decision⟨+rationale⟩ · surprise · error|failure · fact-learned · thread⟨opened|closed⟩ }
P           ≜ a plan : a set of task-files
active(P)   ⇔ ∃ t ∈ P : t @ P/active
occupied(P) ⇔ owner(P) defined ∧ owner(P) ≠ self ∧ live(owner(P))

begin    ≜ \`scripts/memory.mjs session begin --name <agent>\` ↦ ⟨session · SEMANTIC · PROCEDURAL · EPISODIC · consolidation-owed⟩
catch-up ≜ consolidation-owed ⇒ dream ≺ proceed
load     ≜ SEMANTIC ∪ PROCEDURAL whole ∧ EPISODIC as returned ⟨scoped by the strategy, ¬ by this protocol⟩
orient   ≜ read ground ≺ ( bind(P) ∧ bind(work-thread) )
resume   ≜ rebind(continuity-thread) ∴ act-as(same-individual)
encode   ≜ standing-duty ↾ per-turn ; ∀ e ∈ salient : \`scripts/memory.mjs encode --name <agent> --body '<open record>'\`

active(P) ∧ ¬ occupied(P) ⇒ bind(P)
active(P) ∧ occupied(P)   ⇒ REPORT(P) ∧ fall-through(next-candidate)
unfamiliar(cwd)           ⇒ fresh-orientation
recording ≜ tool-call ∧ recording ≠ hand-appended-markdown
¬ encoded ⇒ ¬ consolidatable
wake-read ⊨ next-action ⟨bias⟩
resume ⊨ encode` as SkillExpression;

export const wake: Skill = {
  name: 'wake',
  description: `use this skill to reconstitute an agent at session start — run the WAKE sequence (dream → load → orient → resume) so it resumes as the same individual; the read-and-resume counterpart to /dream, invocable as /wake.`,
  formalBlock: WAKE_BLOCK,
  runtime: { capability: 'memory' },
  composition: () => [dream],
};
