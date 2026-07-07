import type { SkillCell } from '../toolkit/skill-cell.js';

const WAKE_BLOCK = `WAKE ≜ register → dream → load → orient → resume

register — \`node ~/.claude/skills/memory/episodic.mjs session register --home \${AGENT_HOME}\` — mark this session live in the registry before any orient; liveness (own ∨ live-other) is the memory-session-isolation axis
dream — dream; usually catch-up only — a no-op when handoff already dreamt on hot context, load-bearing on a fresh spawn ∨ a crash that had none; exit gate \`node ~/.claude/skills/memory/episodic.mjs audit --home \${AGENT_HOME}\` — nonzero ⇒ scoped content polluting SEMANTIC ∨ PROCEDURAL ⇒ re-dream the named findings to their node homes before proceeding
load — read the resident layers \${AGENT_HOME}/{SEMANTIC · PROCEDURAL} whole; EPISODIC via \`node ~/.claude/skills/memory/episodic.mjs read --home \${AGENT_HOME} --for-session \${CLAUDE_SESSION_ID} --under \$(node ~/.claude/skills/memory/episodic.mjs node <session-start cwd>)\` — --for-session excludes a LIVE-OTHER session's residue; own ∪ completed records load; out-of-node records load as counts only
orient — bind to the current project, resume that project's work-thread; read the scoped semantic stores before resuming — the project's AGENTS.md ∧ the active plan's plans/<plan>/AGENTS.md (the plan-scope memory sink — may not exist until a dream first writes it; PLAN.md is the state mirror); active ≜ the plan with task-files in its active/ state folder (memory, not just docs); LIVENESS-GATED bind: an active/-populated plan is bound ONLY if owner ∈ {self, completed} (\`session status <owner>\`); a LIVE-OTHER owner ⇒ occupied ⇒ REPORT "plan <P> executed by a live session; not resuming" ∧ fall through to the next candidate; an unfamiliar cwd is a fresh orientation
resume — act as the same individual (rebind the continuity-thread); a wake-time read biases the very next action`;

export const wake: SkillCell = {
  name: 'wake',
  description: `WAKE ≜ register → dream → load → orient → resume · session-start-reconstitution ↦ same-individual · counterpart(dream)`,
  formalBlock: WAKE_BLOCK,
  composition: ['dream'],
  body: `

# Wake Skill

wake ≜ invokes dream · the read-and-resume half of the session boundary

The session-start reconstitution. dream is the up-and-out write of the agent's memory store; \`/wake\` reads it back and resumes the **continuity-thread** — the single individuated identity that persists across the /clear gap — so the agent resumes as the _same individual_, not a fresh instance.

Absorbed declarations (this skill stands alone — no external concept refs):

- **continuity-thread** ≜ the unbroken first-person identity carried across session boundaries; what makes the post-wake agent the same person as the pre-/clear agent. Wake's job is to rebind it.
- **memory store** ≜ the agent's self-authored stores on disk: \`SEMANTIC\` (identity facts + durable agent-intrinsic knowledge), \`PROCEDURAL\` (generalized cross-project wisdom), \`EPISODIC\` (the raw event stream; each record carries its \`cwd\`, scope = the tool-computed \`node(cwd)\`). \`SOUL\` is constitutional and already in-prompt — never read from disk, never written. The store's runtime is the bundled \`episodic.mjs\` tool (verbs \`migrate\`, \`read\`, \`node\`, \`audit\`), invoked below.

Resolve from context:

- \`\${AGENT_HOME}\` — the agent's absolute sidecar home; the stores live at \`\${AGENT_HOME}/{SEMANTIC.md, PROCEDURAL.md, EPISODIC.jsonl}\`. \`SOUL\` is already in-prompt.

## Sequence

**0. Migrate if needed (host-bootstrap precondition).** Wake is the first ritual to touch the store on a new host, so it is the trigger site for the runtime's \`migrate\` verb. Before loading the layers: if \`\${AGENT_HOME}/EPISODIC.md\` exists and \`\${AGENT_HOME}/EPISODIC.jsonl\` does not, convert via the bundled runtime — \`node ~/.claude/skills/memory/episodic.mjs migrate \${AGENT_HOME}/EPISODIC.md \${AGENT_HOME}/EPISODIC.jsonl\`. No-loss gated and idempotent: once \`.jsonl\` exists it is a no-op and wake proceeds.

Then run the WAKE sequence:

\`\`\`text
${WAKE_BLOCK}
\`\`\`

**Session isolation (memory-session-isolation).** Raw working residue — EPISODIC forward-threads and a plan's \`active/\` ownership — is **session-owned while LIVE**: a live OTHER session's residue is INVISIBLE (no collision), while a COMPLETED session's residue is INHERITABLE (this is what makes cross-\`/clear\` resume work). The isolation axis is session **liveness**, not node alone; \`register\` publishes this session, \`--for-session\` filters the read, and the \`owner\`/\`occupied\` gate protects plan-binding. Cross-session sharing happens only through consolidation (dream drain of completed sessions), never by reading a live sibling's raw stream.

Fired by **wake** / \`/wake\`; absent direction, default on the first turn after spawn.

## See also

- dream — the write-motion counterpart; also step 1 of the sequence.
- handoff — the persist half on the near side of /clear; wake is the read half on the far side.
- carry-on — the in-session re-dispatch word; distinct from wake (which crosses the /clear gap).
`,
};
