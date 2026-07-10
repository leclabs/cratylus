// founding-template.ts — agent-anatomy's polis founding DOCTRINE, the corpus DATA
// injected into the doctrine-agnostic `init` ENGINE
// (`@leclabs/agent-forge/deploy`). The engine declares the `FoundingTemplate`
// SHAPE (founding prose + plan-layout states); THIS module supplies the polis
// substance: the `polis`/`politeia`/`mind-society` founding prose (verbatim from
// the former forge `init.ts`) + `planStates` sourced from the praxis plan-state
// CANON (`./plan-states.ts` `PLAN_STATES`, the one home the praxis skill's formal
// block also derives from). Injected by the anatomy founding path
// (`./found-cli.ts`), never baked into the engine.

import type { FoundingTemplate } from '@leclabs/agent-forge/deploy';
import { PLAN_STATES } from './plan-states.js';

function polisAgentsMd(subject: string): string {
  return `# agent conventions

This project is a **founded mind-society** -- a *polis*, not a pile of agents. It was
founded by projecting the polis commons (\`packages/agent-anatomy\`) into this repository: the
foundational structure (the **politeia**) is laid down, and the founders are born
among the projected agents.

## Subject

${subject}

## The founders

Born into this society as projected agents (\`.claude/agents/\`):

- **Nico** 📐 -- master builder of the **constitution**: roles, archetypes, the
  society itself. To mutate the culture, be Nico or delegate to him.
- **Mav** ✈️ -- master builder of the **substrate**: the infrastructure, machinery,
  and delivery the society runs on. For build/delivery, Mav leads.

\`principal-ic\` is **intrinsic** to both founders -- the founder genus, bound to this
society's subject, not a path-scoped grant (the founder charter).

## How this society was founded

- **Culture** -- every agent + skill in this \`.claude/\` is a *projection* of a agent-anatomy
  corpus cell, not a hand-authored copy. Regenerate by re-projecting; do not
  hand-edit the generated defs (each carries a \`GENERATED from ...\` provenance
  header + content-hash that the projector guards against clobbering).
- **Constitution cited, not copied** -- the founding draws on the polis *politeia*
  (the foundational structure) and *founder-charter* (who founds, on what terms).
  This society *is a polis* because it instantiates that structure.

## Work-tracking

\`plans/\` is a sharded-plan-layout: \`PLAN.md\` is the backlog + status mirror; task
files move through state folders (\`pending/ -> ready/ -> active/ -> completed/\`) as
dependencies clear.
`;
}

function polisPlanMd(subject: string): string {
  return `# founding -- PLAN

The founding backlog of this mind-society. \`PLAN.md\` mirrors the state folders;
task files move \`pending/ -> ready/ -> active/ -> completed/\` as deps clear.

**Subject:** ${subject}

## Backlog (pending)

- **F1 -- state the subject** -- replace the placeholder in \`AGENTS.md\` and above
  with this society's real subject (what this polis is for).
- **F2 -- adopt on a host** -- deploy the founded agents to a running client so the
  founders (nico, mav) wake with their identity-memory sidecars seeded.
`;
}

/**
 * The polis founding template — agent-anatomy's founding doctrine, injected into
 * the engine's `initSociety`. `planStates` is the praxis CANON, not a local literal.
 */
export const polisFoundingTemplate: FoundingTemplate = {
  agentsMd: polisAgentsMd,
  planMd: polisPlanMd,
  planStates: PLAN_STATES,
};
