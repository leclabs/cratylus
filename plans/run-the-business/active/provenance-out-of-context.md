# Rehome build-provenance out of the injected SOUL body

**Lane** Nico (design) + Mav (projection) · **Status** pending.

## Finding (still live — confirmed 2026-06-30)

Deployed SOULs still inject the `<!-- GENERATED … -->` provenance comment (source-path, profile,
content-hash) into every agent's context — only YAML frontmatter is stripped; the comment sits in the body.
This is build/drift metadata the running agent never consumes.

## Scope

Move both purposes out of the injected body:

1. The "generated, don't hand-edit" note — for a human editor, useless to the running agent. Keep where a
   human sees it but the LLM doesn't (harness-stripped frontmatter), or drop it (the file is regenerated).
2. The content-hash / source-path / profile — for `agent-forge deploy`'s drift read-back. Move into
   harness-stripped frontmatter or a sidecar (still greppable for drift).

## Acceptance

- Zero `<!-- GENERATED -->` / content-hash text in any deployed agent's injected context.
- `agent-forge deploy` drift read-back still resolves the content-hash from its new home.
- Whether the harness strips unknown frontmatter keys from context is **verified**, not assumed.
