// founding-template.ts — the SHAPE of the founding doctrine `init` lays down, and
// the engine's DOCTRINE-AGNOSTIC DEFAULT of it. `init` (`./init.ts`) is a pure
// structure-emitter: it copies the render tree, writes AGENTS.md, and lays the
// plans scaffold — but WHAT those documents SAY (the founding prose) and the
// plan-layout state folders it materializes are corpus DOCTRINE, injected as a
// `FoundingTemplate`. The engine declares the SHAPE; a corpus supplies the DATA
// (mirror of the validate `Policy` cut — algorithm in the engine, policy injected).
//
// Forge ships `DEFAULT_FOUNDING_TEMPLATE` so `agent-forge found <target>` works
// STANDALONE, producing a valid founded project with generic prose. A corpus with
// its own founding doctrine (e.g. agent-anatomy's polis) supplies its own
// `FoundingTemplate` and injects it through its own founding path.

/**
 * The founding doctrine `init` emits, injected by the corpus. `agentsMd`/`planMd`
 * render the two founding documents (the subject woven in); `planStates` names the
 * sharded-plan-layout state folders laid under `plans/<plan>/`.
 */
export interface FoundingTemplate {
  /** The founding AGENTS.md body — the marker that makes the target a project. */
  agentsMd(subject: string): string;
  /** The founding plan's PLAN.md body — the initial backlog + state mirror. */
  planMd(subject: string): string;
  /** The plan-layout state folders (order = the task-file lifecycle). */
  readonly planStates: readonly string[];
}

/** The generic plan-layout states the default founding template materializes. */
const DEFAULT_PLAN_STATES = [
  'pending',
  'ready',
  'active',
  'completed',
] as const;

function defaultAgentsMd(subject: string): string {
  return `# agent conventions

This project is a **founded agent project** -- its culture (agents + skills under
\`.claude/\`) was projected in, and its foundational structure is laid down.

## Subject

${subject}

## How this project was founded

- **Culture** -- every agent + skill in this \`.claude/\` is a *projection* of a
  source cell, not a hand-authored copy. Regenerate by re-projecting; do not
  hand-edit the generated defs (each carries a \`GENERATED from ...\` provenance
  header + content-hash that the projector guards against clobbering).

## Work-tracking

\`plans/\` is a sharded-plan-layout: \`PLAN.md\` is the backlog + status mirror; task
files move through state folders (\`${DEFAULT_PLAN_STATES.join(' -> ')}\`) as
dependencies clear.
`;
}

function defaultPlanMd(subject: string): string {
  return `# founding -- PLAN

The founding backlog of this project. \`PLAN.md\` mirrors the state folders; task
files move \`${DEFAULT_PLAN_STATES.join(' -> ')}\` as deps clear.

**Subject:** ${subject}

## Backlog (pending)

- **F1 -- state the subject** -- replace the placeholder in \`AGENTS.md\` and above
  with this project's real subject (what this project is for).
- **F2 -- adopt on a host** -- deploy the founded agents to a running client so the
  founders wake with their identity-memory sidecars seeded.
`;
}

/**
 * The engine's doctrine-agnostic default. Generic founding prose + the generic
 * plan-layout states — NO corpus doctrine. Lets `agent-forge found` found a valid
 * project standalone; a doctrine-bearing corpus injects its own template instead.
 */
export const DEFAULT_FOUNDING_TEMPLATE: FoundingTemplate = {
  agentsMd: defaultAgentsMd,
  planMd: defaultPlanMd,
  planStates: DEFAULT_PLAN_STATES,
};
