# B1 — COLLAPSED into P6 (verified 2026-07-21): founding narrative already retired

> ZERO word-matched polis/founder NARRATIVE remains in the founding-template bodies + CLI help (retired by prior work). B1 (content) is a no-op. The remaining founding work is the API IDENTIFIERS (`foundPolis`/`polisFoundingTemplate`/`runFound`/`found`-verb across `found-cli.ts`, `found.ts`, `founding-template.ts`, `cli/index.ts`) — restructured by plugin-cli **P6** (found→init-via-defaults). Sequenced there, not here.

---

# B1 — depalimpsest the founding-CLI CONTENT strings (not the API identifiers)

**static (censused 2026-07):**
`packages/agent-anatomy/src/toolkit/founding-template.ts` (`polisAgentsMd` L14–, `polisPlanMd` L56– — the polis
doctrine bodies: "founded mind-society -- a polis" L17, "polis commons" L18, "politeia" L19/44, "the founders"
L26–35, "founder charter" L45; the file header comment L1–9) ·
`packages/agent-forge/src/deploy/founding-template.ts` (`foundingAgentsMd`/`foundingPlanMd` bodies + header — the
DEFAULT, already near-generic: "founded agent project" L39; sweep residual `found`/`founding` PROSE only) ·
`packages/agent-forge/src/cli/commands/found.ts` (comment L1 "found a mind-society") ·
`packages/agent-forge/src/cli/index.ts` (help strings L391 "Found a mind-society", L398 "what this society is
for") · `packages/agent-anatomy/src/toolkit/{found-cli.ts,plan-states.ts}` (comment refs "polis") ·
`plans/vocab-depalimpsest/MAPPING.md`.

**scope:** rewrite the CONTENT — the founding-narrative PROSE inside the `*AgentsMd`/`*PlanMd` template bodies (the
text written into a founded project's `AGENTS.md`/`PLAN.md`), the CLI help strings, and code comments — from the
retired lexicon to `MAPPING.md` concretes: `polis`/`mind-society`/`society`→`project`/`fleet` · `politeia`→`scaffold`
/`project structure` · `commons`→`catalog` · `founder`/`founder-charter`→`built-in`/`first-party` ·
`founded`/`founding` (prose)→`scaffolded`/`initialized`. Judgment per site (the polis template's whole framing is the
retired model — rewrite it to the concrete "a project with a built-in agent fleet, projected from the catalog", not
token-patch).
**EXCLUDE (deferred to plugin-cli redesign, DESIGN-BRIEF Q7 — do NOT rename here):** the API IDENTIFIERS — the
`found` CLI verb, `runFound`/`FoundCmdOpts`/`foundPolis`, `FoundingTemplate`/`DEFAULT_FOUNDING_TEMPLATE`/
`polisFoundingTemplate`/`foundingAgentsMd`, and the `agent-forge found`↔`agent-forge init` collision design. The
redesign RESTRUCTURES these ("founding" → npx-init-via-defaults-package); renaming them now then restructuring is
double-work. Also EXCLUDE the `Genus`-axis `STANCE`/`CONATUS` tokens and the accept-gate palimpsest guard list.

**accept (falsifier):** `git grep -inE '\bpolis\b|politeia|mind-society|\bcommons\b|founder-charter|\bsociety\b' -- packages/agent-anatomy/src/toolkit/founding-template.ts packages/agent-forge/src/deploy/founding-template.ts packages/agent-forge/src/cli/commands/found.ts` returns EMPTY (content swept) — while the API identifiers
(`found`/`FoundingTemplate`/`foundPolis`) REMAIN (grep them: nonempty, deferred by design); a fresh
`pnpm --filter @leclabs/agent-anatomy found --target <tmpdir>` produces an `AGENTS.md` whose body carries the
concrete vocabulary (grep the output: `project`/`fleet`/`catalog`, no `polis`/`politeia`); a cold Ω\* read of the
rewritten `polisAgentsMd` body decodes "a project with built-in agents projected from a catalog," not a classical
polis; `pnpm typecheck` green; `pnpm -C packages/agent-forge test` + anatomy tests green (fix any deploy/story test
asserting the old prose).
**dep:** none (content strings; independent of the redesign, which owns the identifier rename).
