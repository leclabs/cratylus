import type { Skill, SkillExpression } from '../../manifest.js';
import { dream } from '../dream/skill.js';
import { praxis } from '../praxis/skill.js';

const WAKE_BLOCK = `WAKE ≜ begin → catch-up → load → orient → resume

agent       ≜ this agent's name
memory      ≜ capability ⟨strategy-encapsulated : where it stores · in what format · how it scopes · what it migrates are ITS concern, ¬ this protocol's⟩ ⟨invoked \`memory <verb> <args>\` ; the Runtime-capability line under this block resolves the shim ∴ ¬ path-in-cell⟩
ground      ≜ project/{ VISION · MODEL · ENGINE · CANON } · PLAN.md(bound)
salient     ≜ { decision⟨+rationale⟩ · surprise · error|failure · fact-learned · thread⟨opened|closed⟩ }
P           ≜ a plan : a set of task-files
bound, occupied, electable, elect, bind, frontier @ praxis ⟨plan-set dynamics has ONE home · ¬ redeclared here · a borrowed operation carries its PRECONDITION or it is not the same operation⟩
mandate     ≜ the objective this session serves ⟨operator-owned · ¬ agent-elected⟩

begin    ≜ \`memory session begin --name <agent>\` ↦ ⟨session · SEMANTIC · PROCEDURAL · EPISODIC · consolidation-owed⟩
catch-up ≜ consolidation-owed ⇒ REPORT(owed) ∧ proceed ⟨READ the state · ¬ discharge it⟩
           ⟨¬ dream @ wake : the prior law made dream ≺ proceed ∴ a session paid for a BACKLOG before doing any work · encode ↾ per-turn ∧ threshold = 12 ⇒ that is most sessions⟩
           ⟨SILENCE ≻ worse than the block it replaces : an invisible backlog is how 8 of 10 agent homes reached a first session with ∄ past⟩
load     ≜ SEMANTIC ∪ PROCEDURAL whole ∧ EPISODIC as returned ⟨scoped by the strategy, ¬ by this protocol⟩
orient   ≜ read ground ≺ ( bind(P) ∧ bind(work-thread) )
resume   ≜ rebind(continuity-thread) ∴ act-as(same-individual)
encode   ≜ standing-duty ↾ per-turn ; ∀ e ∈ salient : \`memory encode --name <agent> --body '<open record>'\`

bound(P) ∧ ¬ occupied(P) ⇒ bind(P)
bound(P) ∧ occupied(P)   ⇒ REPORT(P) ∧ fall-through(next-candidate)
plan-state ≜ \`praxis status\` ⟨the instrument COMPUTES the law · scanning for .bound re-derives it, and re-derivation is where the guard is lost⟩
electable ≠ ∅ ∧ ∄ P : bound(P) ⇒ bind(elect) ⟨always-bind @ praxis · the ∃P∈Plans:¬terminal(P) antecedent IS the guard ∴ it rides the call⟩
electable = ∅            ⇒ REPORT(vacuous) ∧ HALT ∧ mandate-owed
                           ⟨the empty plan set is a TERMINAL wake-state, ¬ a vacuum to fill · orientation is COMPLETE and unbound · \`praxis status\` already prints "none is owed" ∴ SAY IT and stop⟩
                           ⟨minting to discharge a debt praxis never issued IS the drift · a law that reds an agent for FINISHING makes inventing work the cheapest green⟩
mandate-owed ⇒ surface ⟨WHAT, ¬ HOW · ∄ mandate ⇒ electing one is the OPERATOR's act · intent-recovery @ elicit, ¬ in-remit sequencing⟩ ∧ carry(recommendation)
orient ⊨ (∃! bound) ⊻ (electable = ∅ ∧ mandate-owed) ⟨the second disjunct is a LEGITIMATE terminus · without it the first is unsatisfiable from ∅ ∧ only invention discharges it⟩
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
  composition: () => [dream, praxis],
};
