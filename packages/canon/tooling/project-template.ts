// REGISTER — this template's output lands in a CONSUMER's repo (`<target>/AGENTS.md`),
// where cratylus's own tree is NOT in context. It may NAME the upstream catalog
// (`canon` is meaningful provenance) but must never reference a path or document
// that exists only in cratylus: `packages/…`, VISION.md, MODEL.md, ENGINE.md,
// CANON.md all resolve to nothing there. Same seam as `genus/prime-principle.ts`
// (the intrinsic ρ=LLM carry); distinct from `rules/repo-preamble.ts`, which IS
// cratylus-local and may reference them freely. Pinned by `cratylism.test.ts`.
//
// project-template.ts — canon's project DOCTRINE, the corpus DATA injected
// into the doctrine-agnostic `scaffoldProject` ENGINE (`@cratylus/forge/deploy`).
// The engine declares the `ProjectTemplate` SHAPE (the project prose); THIS module
// supplies the canon substance. Injected by the canon scaffold path
// (`./scaffold-cli.ts`), never baked into the engine.

import type { ProjectTemplate } from '@cratylus/forge/deploy';

function projectAgentsMd(subject: string): string {
  return `# agent conventions

This is an **agent project** -- a working set of agents, not a pile of files. It was
scaffolded by projecting the canon catalog into this repository: the project
structure is laid down, and surviving canon artifacts are projected alongside it.

## Subject

${subject}


## How this project was scaffolded

- **Culture** -- every projected agent and skill is a *projection* of a canon
  catalog cell, not a hand-authored copy. Regenerate by re-projecting; do not
  hand-edit generated definitions.
- **Structure projected, not copied** -- the scaffold draws on the canon catalog's
  project structure. This project instantiates that structure.
`;
}

/**
 * The canon project template — canon's project doctrine, injected into
 * the engine's `scaffoldProject`.
 */
export const canonProjectTemplate: ProjectTemplate = {
  agentsMd: projectAgentsMd,
};
