// project-template.ts — the SHAPE of the project scaffold `scaffoldProject` lays
// down, and the engine's DOCTRINE-AGNOSTIC DEFAULT of it. `scaffoldProject`
// (`./init.ts`) is a pure structure-emitter: it copies the render tree, writes
// AGENTS.md, and lays the plans scaffold — but WHAT those documents SAY (the
// project prose) and the plan-layout state folders it materializes are corpus
// DOCTRINE, injected as a `ProjectTemplate`. The engine declares the SHAPE; a
// corpus supplies the DATA (mirror of the validate `Policy` cut — algorithm in the
// engine, policy injected).
//
// Forge ships `DEFAULT_PROJECT_TEMPLATE` so the engine scaffolds a valid project
// STANDALONE, with generic prose. A corpus with its own project doctrine (e.g.
// agent-anatomy) supplies its own `ProjectTemplate` and injects it through its own
// scaffold path.

/**
 * The project doctrine `scaffoldProject` emits, injected by the corpus.
 * `agentsMd`/`planMd` render the two project documents (the subject woven in);
 * `planStates` names the sharded-plan-layout state folders laid under
 * `plans/<plan>/`.
 */
export interface ProjectTemplate {
  /** The project AGENTS.md body — the marker that makes the target a project. */
  agentsMd(subject: string): string;
  /** The project plan's PLAN.md body — the initial backlog + state mirror. */
  planMd(subject: string): string;
  /** The plan-layout state folders (order = the task-file lifecycle). */
  readonly planStates: readonly string[];
}

/** The generic plan-layout states the default project template materializes. */
const DEFAULT_PLAN_STATES = [
  'pending',
  'ready',
  'active',
  'completed',
] as const;

function defaultAgentsMd(subject: string): string {
  return `# agent conventions

This is an **agent project** -- its culture (agents + skills under \`.claude/\`) was
projected in, and its project structure is laid down.

## Subject

${subject}

## How this project was scaffolded

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
  return `# project -- PLAN

The initial backlog of this project. \`PLAN.md\` mirrors the state folders; task
files move \`${DEFAULT_PLAN_STATES.join(' -> ')}\` as deps clear.

**Subject:** ${subject}

## Backlog (pending)

- **F1 -- state the subject** -- replace the placeholder in \`AGENTS.md\` and above
  with this project's real subject (what this project is for).
- **F2 -- adopt on a host** -- deploy the agents to a running client so they wake
  with their identity-memory sidecars seeded.
`;
}

/**
 * The engine's doctrine-agnostic default. Generic project prose + the generic
 * plan-layout states — NO corpus doctrine. Lets the engine scaffold a valid
 * project standalone; a doctrine-bearing corpus injects its own template instead.
 */
export const DEFAULT_PROJECT_TEMPLATE: ProjectTemplate = {
  agentsMd: defaultAgentsMd,
  planMd: defaultPlanMd,
  planStates: DEFAULT_PLAN_STATES,
};
