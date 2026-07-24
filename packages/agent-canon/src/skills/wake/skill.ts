import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { dream } from '../dream/skill.js';

const WAKE_BLOCK =
  `WAKE ≜ resolve → migrate? → register → dream → load → orient → resume

agent               ≜ this agent's name
self                ≜ session⟨CLAUDE_SESSION_ID⟩
AGENT_HOME          : path
P                   ≜ a plan : a set of task-files
dir                 : P → path
owner               : P ⇀ session
node                : cwd → scope
registered, released, stale : session → 𝔹
live                : session → 𝔹
ground              ≜ project/{ VISION · MODEL · ENGINE · CANON } · PLAN.md(active)
salient             ≜ { decision⟨+rationale⟩ · surprise · error|failure · fact-learned · thread⟨opened|closed⟩ }
record              ≜ ⟨id · body · observed|inferred · host · cwd · session⟩ ⟨cheap · ¬ distill-at-capture⟩

live(s)             ⇔ registered(s) ∧ ¬ released(s) ∧ ¬ stale(s)
occupied(P)         ⇔ owner(P) defined ∧ owner(P) ≠ self ∧ live(owner(P))
active(P)           ⇔ ∃ t ∈ P : t @ dir(P)/active
registered, released, stale @ memory-session-registry
AGENT_HOME @ $AGENT_HOME ⟨deployment-override⟩ ∨ ~/.agents/<agent> ⟨default · harness-agnostic · portable⟩
AGENT_HOME ≠ ~/.claude/agents/<agent>.md ⟨harness-declaration⟩ ∧ AGENT_HOME ≠ ~/.claude/agents/<agent>/ ⟨pre-migration-drift⟩
PLAN.md(active) ≜ state-mirror
read⟨EPISODIC⟩ : own ∪ completed ↦ full · out-of-node ↦ counts · live-other ∉ ⟨--for-session⟩
active(P) ∧ ¬ occupied(P) ⇒ bind(P)
active(P) ∧ occupied(P)   ⇒ REPORT(P) ∧ fall-through(next-candidate)
unfamiliar(cwd)           ⇒ fresh-orientation
isolation-axis ≜ liveness ⟨own ∨ completed inheritable · live-other invisible⟩
scope ≜ node(cwd) ⟨computed-at-dream · capture scope-blind · ¬ judged-at-capture⟩
session-of(record) ≜ --session ≻ CLAUDE_SESSION_ID ≻ sole-live ⟨bound-at encode · never sessionless⟩
cross-session-share ⇔ dream-consolidation
recording ≜ tool-call ∧ recording ≠ hand-appended-markdown
EPISODIC-only ∴ ¬ encoded ⇒ ¬ consolidatable
wake-read ⊨ next-action ⟨bias⟩
resume ⊨ encode

resolve   ≜ \`AGENT_HOME=\$(scripts/memory.mjs home --name <agent>)\`
migrate?  ≜ (\${AGENT_HOME}/EPISODIC.md exists ∧ ¬ \${AGENT_HOME}/EPISODIC.jsonl exists) ⇒ \`scripts/memory.mjs migrate \${AGENT_HOME}/EPISODIC.md \${AGENT_HOME}/EPISODIC.jsonl\` ⟨no-loss · idempotent⟩
register  ≜ \`scripts/memory.mjs session register --home \${AGENT_HOME}\` ∴ registered(self)
dream     ≜ catch-up ⟨handoff-dreamt ⇒ no-op ; fresh-spawn ∨ crashed-undreamt ⇒ load-bearing⟩ ; \`scripts/memory.mjs audit --home \${AGENT_HOME}\` ≠ 0 ⇒ scoped-content @ { SEMANTIC · PROCEDURAL } ∴ dream(findings) ≺ proceed
load      ≜ read⟨SEMANTIC · PROCEDURAL⟩ whole ∧ read⟨EPISODIC⟩ := \`scripts/memory.mjs read --home \${AGENT_HOME} --for-session \${CLAUDE_SESSION_ID} --under \$(scripts/memory.mjs node <session-start-cwd>)\`
orient    ≜ read ground ≺ ( bind(P) ∧ bind(work-thread) )
resume    ≜ rebind(continuity-thread) ∴ act-as(same-individual)
encode    ≜ standing-duty ↾ per-turn ; ∀ e ∈ salient : \`scripts/memory.mjs encode --home \${AGENT_HOME} --body '<open record>'\` ; tool ↦ ⟨id · host · cwd⟩` as SkillExpression;

export const wake: Skill = {
  name: 'wake',
  description: `use this skill to reconstitute an agent at session start — run the WAKE sequence (dream → load → orient → resume) so it resumes as the same individual; the read-and-resume counterpart to /dream, invocable as /wake.`,
  formalBlock: WAKE_BLOCK,
  runtime: { capability: 'memory' },
  composition: () => [dream],
};
