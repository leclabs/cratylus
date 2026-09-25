// project-template.ts — the SHAPE of the project scaffold `scaffoldProject` lays
// down, and the engine's DOCTRINE-AGNOSTIC DEFAULT of it. `scaffoldProject`
// (`./init.ts`) is a pure structure-emitter: it copies the render tree and writes
// AGENTS.md — but WHAT that document SAYS (the project prose) is corpus DOCTRINE,
// injected as a `ProjectTemplate`. The engine declares the SHAPE; a corpus
// supplies the DATA (mirror of the validate `Policy` cut — algorithm in the
// engine, policy injected).
//
// Forge ships `DEFAULT_PROJECT_TEMPLATE` so the engine scaffolds a valid project
// STANDALONE, with generic prose. A corpus with its own project doctrine (e.g.
// canon) supplies its own `ProjectTemplate` and injects it through its own
// scaffold path.

/**
 * The project doctrine `scaffoldProject` emits, injected by the corpus.
 * `agentsMd` renders the project AGENTS.md (the subject woven in).
 */
export interface ProjectTemplate {
  /** The project AGENTS.md body — the marker that makes the target a project. */
  agentsMd(subject: string): string;
}

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

Work is planned with the \`plan\` skill.
`;
}

/**
 * The engine's doctrine-agnostic default. Generic project prose — NO corpus
 * doctrine. Lets the engine scaffold a valid project standalone; a
 * doctrine-bearing corpus injects its own template instead.
 */
export const DEFAULT_PROJECT_TEMPLATE: ProjectTemplate = {
  agentsMd: defaultAgentsMd,
};
