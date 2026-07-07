import type { SkillCell } from '../toolkit/skill-cell.js';

export const handoff: SkillCell = {
  name: 'handoff',
  description: `persist session-boundary pre-clear · praxis-sync(plan-record) ∧ dream(drain EPISODIC) · hot-context`,
  formalBlock: ``,
  composition: ['praxis', 'dream'],
  body: `

# handoff

handoff ≜ invokes praxis · dream ; the persist half of the session boundary.

One act reconciles two durable substrates to reality: **work** via praxis **sync** (task placement + PLAN.md), **self** via dream (drain EPISODIC up the memory home).

Two truths it stands on (declared here — handoff owns no external def):

- **doc mirrors runtime truth.** The live runtime state is the source; a written status doc (PLAN.md, the EPISODIC stream's resident layers) is a **mirror kept current, never the authority**. Sync the mirror as work lands; when they diverge, the runtime wins.
- **memory.** The agent's persistence home: an append-only **EPISODIC** event stream, encoded **cheap and raw per turn**, that dream drains **up-and-out** (consolidate, move-not-copy) into the durable resident layers. Per-turn encoding is best-effort and lossy; whole-session events survive only if drained before context dies.

Laws:

- **Order.** praxis sync, **then** dream, **then** \`session release\` — dream runs on hot context so it captures the session events that per-turn encoding missed, before /clear destroys them; release marks this session **completed** last.
- **Release closes the session.** \`node ~/.claude/skills/memory/episodic.mjs session release --home \${AGENT_HOME}\` is the final persist act: it flips this session to completed in the memory registry, so its forward residue and any plan it owned become **inheritable** by the next wake (a crash that skips handoff still completes via the 2h stale window). Until release, a live sibling correctly treats this session's residue and plan-ownership as occupied.
- **Scope: persist-only.** The boundary proceeds **outside** this skill: \`/clear\` then wake then carry-on. handoff does not clear, reconstitute, or re-dispatch.
`,
};
