# P6 — founding-CLI restructure (`found`→`init`-via-defaults) + absorb vocab Stream-B identifiers

**static (censused):** `packages/agent-forge/src/cli/commands/found.ts` (`runFound`; "found a mind-society") ·
`packages/agent-anatomy/src/toolkit/found-cli.ts` (`foundPolis` · `polisFoundingTemplate` import) ·
`packages/agent-anatomy/src/toolkit/founding-template.ts` (`FoundingTemplate` shape · the polis founding DOCTRINE) ·
`packages/agent-forge/src/deploy/init.ts` (`initSociety`) · `plans/plugin-cli/NORTH-STAR.md` §2·§7 ·
`plans/vocab-depalimpsest/` Stream-B (the deferred API identifiers this shard absorbs) · **dep-fed:** P4 (`init`).

**scope:** rebuild the founding path as `init`-via-defaults-package and fold in the vocab Stream-B identifier
rename (one coherent pass — renaming-then-restructuring would be double-work, DESIGN-BRIEF Q7):

- `npx agent-forge init` with no config = the agent-anatomy plugin through the normal `resolve()` with empty
  `patches` (defaults-are-a-package, never special-cased — NORTH-STAR §2).
- rename the API identifiers to concrete vocab: the `found` verb → `init`; `runFound`/`foundPolis`/
  `polisFoundingTemplate`/`FoundingTemplate`/`initSociety` → concrete (`init`/`scaffold`/`project`/template); the
  `polis`/`mind-society`/`society`/`founder` narrative in founding prose + help + comments → concrete.
- **EXCLUDE** the accept-gate palimpsest-token guard (it ENFORCES the retirement — it stays) and any `stance-*`
  identifiers (a different concept).

**accept (falsifier):** `git grep -nwE "polis|mind-society|founder|found"` over `packages/` returns only the
excluded guard + git-historical plan records — no live `found`-as-verb / `polis` API identifier; `npx agent-forge
init` (no config) scaffolds a project via the anatomy default through `resolve()`; `pnpm -C packages/agent-forge
typecheck` + `pnpm -C packages/agent-anatomy typecheck` + suites green; a cold Ω\* read of the init path decodes
"scaffold a project from the default plugin." **dep:** P4 (wave 3).
