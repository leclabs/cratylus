import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { dream } from '../dream/skill.js';
import { praxis } from '../praxis/skill.js';

const FORMAL_BLOCK = `handoff        ≜ praxis-sync → dream → release
self           ≜ session⟨CLAUDE_SESSION_ID⟩
agent          ≜ this agent's name
praxis-sync    ≜ sync @ praxis
dream          ≜ drain⟨EPISODIC⟩ @ dream
release        ≜ \`memory session release --name <agent>\` ∴ released(self)
registered, released, stale : session → 𝔹
live           : session → 𝔹

order          : praxis-sync ≺ dream ≺ release
registered, released, stale @ memory-session-registry
live(s)        ⇔ registered(s) ∧ ¬ released(s) ∧ ¬ stale(s)
live(self)     ⇒ self.{forward-residue, owned-plan} occupied
¬ live(self)   ⇒ self.{forward-residue, owned-plan} inheritable
scope          = persist-only` as SkillExpression;

export const handoff: Skill = {
  name: 'handoff',
  description: `use this skill to prepare a session for handoff before /clear — bring the plan's record up to date (praxis sync) and consolidate memory (dream) while context is still hot; the persist half of the session boundary, invocable as /handoff.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [praxis, dream],
};
