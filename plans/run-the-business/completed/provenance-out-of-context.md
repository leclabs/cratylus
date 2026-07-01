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

## Outcome (done 2026-06-30)

**Dropped** the banner from both injected artifacts (claude `frameClaudeMd` + codex
`agentToCodexTomlObject`) rather than relocating it — commit `d8bd8a5`. Verified: re-projected
11 agents + 16 skills, `grep GENERATED|content-hash|profile:` across `.render-ts/` = **zero**;
build + typecheck + 227 tests green.

**Scope revision vs §2** (relocate the hash to a greppable deployed home): overridden on verified
grounds. Zero-trust recon found the premise false — no code reads the content-hash back (the deploy
clobber-guard is `seeds.ts` seed-if-absent by file _presence_, not hash), and the hash is
`bodyHash(agentBody)`, **deterministically recomputable** from the TS source. A future drift reader
recomputes vs a re-projection; a stored anchor in the deployed artifact would have no reader. So §2's
purpose is met by keeping `bodyHash`/`provenanceHeader` exported as primitives, not by a sidecar.

**§3** (verify, don't assume the harness strips the chosen home): rendered **moot** — nothing is placed
in frontmatter, so §1 holds by construction with no dependence on strip semantics. (Guide + own-context
confirmed whole-block strip for _known_ keys; unknown-key strip stayed undocumented — which is exactly
why the drop, not the relocate, was chosen.)
