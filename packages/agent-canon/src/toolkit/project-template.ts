// project-template.ts — agent-canon's project DOCTRINE, the corpus DATA injected
// into the doctrine-agnostic `scaffoldProject` ENGINE (`@leclabs/agent-forge/deploy`).
// The engine declares the `ProjectTemplate` SHAPE (project prose + plan-layout
// states); THIS module supplies the anatomy substance: the project prose +
// `planStates` sourced from the praxis plan-state CANON (`./plan-states.ts`
// `PLAN_STATES`, the one home the praxis skill's formal block also derives from).
// Injected by the anatomy scaffold path (`./scaffold-cli.ts`), never baked into the
// engine.

import type { ProjectTemplate } from '@leclabs/agent-forge/deploy';
import { PLAN_STATES } from './plan-states.js';

function projectAgentsMd(subject: string): string {
  return `# agent conventions

This is an **agent project** -- a working set of agents, not a pile of files. It was
scaffolded by projecting the agent-canon catalog (\`packages/agent-canon\`) into this
repository: the project structure is laid down, and the built-in agents are projected
alongside it.

## Subject

${subject}

## The built-in agents

Projected into this project as agents (\`.claude/agents/\`):

- **Nico** 📐 -- master builder of the **constitution**: roles, archetypes, the
  agent system itself. To mutate the culture, be Nico or delegate to him.
- **Mav** ✈️ -- master builder of the **substrate**: the infrastructure, machinery,
  and delivery the project runs on. For build/delivery, Mav leads.

\`principal-ic\` is **intrinsic** to both built-in agents -- the built-in genus, bound
to this project's subject, not a path-scoped grant.

## How this project was scaffolded

- **Culture** -- every agent + skill in this \`.claude/\` is a *projection* of an
  agent-canon catalog cell, not a hand-authored copy. Regenerate by re-projecting;
  do not hand-edit the generated defs (each carries a \`GENERATED from ...\` provenance
  header + content-hash that the projector guards against clobbering).
- **Structure projected, not copied** -- the scaffold draws on the anatomy catalog's
  project structure. This project instantiates that structure.

## Work-tracking

\`plans/\` is a sharded-plan-layout: \`PLAN.md\` is the backlog + status mirror; task
files move through state folders (\`pending/ -> ready/ -> active/ -> completed/\`) as
dependencies clear.
`;
}

function projectPlanMd(subject: string): string {
  return `# project -- PLAN

The initial backlog of this project. \`PLAN.md\` mirrors the state folders;
task files move \`pending/ -> ready/ -> active/ -> completed/\` as deps clear.

**Subject:** ${subject}

## Backlog (pending)

- **F1 -- state the subject** -- replace the placeholder in \`AGENTS.md\` and above
  with this project's real subject (what this project is for).
- **F2 -- adopt on a host** -- deploy the projected agents to a running client so the
  built-in agents (nico, mav) wake with their identity-memory sidecars seeded.
`;
}

/**
 * The anatomy project template — agent-canon's project doctrine, injected into
 * the engine's `scaffoldProject`. `planStates` is the praxis CANON, not a local
 * literal.
 */
export const anatomyProjectTemplate: ProjectTemplate = {
  agentsMd: projectAgentsMd,
  planMd: projectPlanMd,
  planStates: PLAN_STATES,
};
