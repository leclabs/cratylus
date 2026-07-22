import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { dream } from './dream.js';

const WAKE_BLOCK = `WAKE ≜ migrate? → register → dream → load → orient → resume

migrate? — host-bootstrap precondition: if \${AGENT_HOME}/EPISODIC.md exists ∧ \${AGENT_HOME}/EPISODIC.jsonl does not → \`memory migrate \${AGENT_HOME}/EPISODIC.md \${AGENT_HOME}/EPISODIC.jsonl\`; no-loss gated ∧ idempotent (once .jsonl exists it is a no-op)
register — \`memory session register --home \${AGENT_HOME}\` — mark this session live in the registry before any orient; liveness (own ∨ live-other) is the memory-session-isolation axis
dream — dream; usually catch-up only — a no-op when handoff already dreamt on hot context, load-bearing on a fresh spawn ∨ a crash that had none; exit gate \`memory audit --home \${AGENT_HOME}\` — nonzero ⇒ scoped content polluting SEMANTIC ∨ PROCEDURAL ⇒ re-dream the named findings to their node homes before proceeding
load — read the resident layers \${AGENT_HOME}/{SEMANTIC · PROCEDURAL} whole; EPISODIC via \`memory read --home \${AGENT_HOME} --for-session \${CLAUDE_SESSION_ID} --under \$(memory node <session-start cwd>)\` — --for-session excludes a LIVE-OTHER session's residue; own ∪ completed records load; out-of-node records load as counts only
orient — bind to the current project, resume that project's work-thread; read the scoped source of truth before resuming — the project's VISION · MODEL · ENGINE · CANON ∧ the active plan's PLAN.md (the state mirror); active ≜ the plan with task-files in its active/ state folder; LIVENESS-GATED bind: an active/-populated plan is bound ONLY if owner ∈ {self, completed} (\`session status <owner>\`); a LIVE-OTHER owner ⇒ occupied ⇒ REPORT "plan <P> executed by a live session; not resuming" ∧ fall through to the next candidate; an unfamiliar cwd is a fresh orientation
resume — act as the same individual (rebind the continuity-thread); a wake-time read biases the very next action

encode — the standing per-turn duty this session resumes (the ENCODE-salience contract): ENCODE one open record per salient event ⟨decision+rationale · surprise · error|failure · fact-learned · thread-opened|closed⟩ ⟨observed vs inferred marked · cheap · ¬distill-at-capture⟩ via \`memory encode --home \${AGENT_HOME} --body '<open record>'\` — the tool mints the id ∧ derives {host, cwd}; EPISODIC-only ∴ unencoded ⇒ unconsolidatable ⟨recording ≜ tool-call · never a hand-appended markdown line⟩
causality — scope ≜ node(cwd) COMPUTED at dream, ¬judged-at-capture ⟨capture is scope-blind⟩; session bound at encode ⟨--session > CLAUDE_SESSION_ID > sole-live ; never sessionless⟩; the isolation axis is session LIVENESS ⟨own ∨ completed inheritable · live-other invisible⟩ — cross-session sharing happens ONLY through dream's consolidation` as SkillExpression;

export const wake: Skill = {
  name: 'wake',
  description: `use this skill to reconstitute an agent at session start — run the WAKE sequence (dream → load → orient → resume) so it resumes as the same individual; the read-and-resume counterpart to /dream, invocable as /wake.`,
  formalBlock: WAKE_BLOCK,
  composition: () => [dream],
};
