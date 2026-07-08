import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { dream } from './dream.js';
import { praxis } from './praxis.js';

export const handoff: Skill = {
  name: 'handoff',
  description: `use this skill to prepare a session for handoff before /clear — bring the plan's record up to date (praxis sync) and consolidate memory (dream) while context is still hot; the persist half of the session boundary, invocable as /handoff.`,
  formalBlock: `DECLARATIONS
handoff        ≜ praxis-sync ∘ dream ∘ release            — the persist half of the session boundary (pre-/clear)
work           — the plan record: task placement + the PLAN.md mirror
self           — the agent's persistence home: the EPISODIC event stream ∪ the resident layers ⟨SEMANTIC · PROCEDURAL⟩
doc-mirrors-runtime-truth — the live runtime state is the source; a status doc (PLAN.md · the resident layers) is a mirror kept current, never the authority
memory         — append-only EPISODIC, encoded cheap-and-raw per turn (best-effort, lossy); dream drains it up-and-out (consolidate, move-not-copy) into the resident layers
praxis-sync    — reconcile work to reality: task-file placement ∧ PLAN.md
dream          — drain EPISODIC on hot context → the resident layers, capturing whole-session events per-turn encoding missed
release        ≜ \`node ~/.claude/skills/memory/episodic.mjs session release --home \${AGENT_HOME}\` — flip this session → completed in the memory registry

LAWS
order          : praxis-sync ≺ dream ≺ release            — dream runs on hot context (before /clear destroys the session events) ; release marks completed last
diverge(runtime, doc) ⇒ runtime wins                     -- doc-mirrors-runtime-truth: sync the mirror as work lands
release ⇒ this-session.{forward-residue, owned-plan} ↦ inheritable   -- by the next wake ; a crash skipping handoff still completes via the 2h stale window
¬release ⇒ a live sibling treats this session's residue ∧ plan-ownership as occupied
scope          = persist-only                            -- /clear · wake · carry-on proceed OUTSIDE this skill; handoff does not clear, reconstitute, or re-dispatch` as SkillExpression,
  composition: () => [praxis, dream],
};
