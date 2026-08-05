# S7 · readme-reground

**Objective.** Bring `README.md` to the surviving pipeline. It currently advertises
`init → import → compile` as the headline flow — the documented product is the one being removed, and it
was already wrong before this plan: that path writes `~/.claude/` from a foreign harness config, which is
the inversion VISION exists to undo.

**Inputs (pinned, exist at authoring).**

- `README.md:33-35` — the `init → import → compile` headline
- `plans/install-parity/DESIGN.md` §7 and §7a — the two-pipeline census and the ownership boundary
- `packages/forge/src/cli/commands/project.ts:8` — the pipeline in its own words:
  "the consumer pipeline is finally closed: init → add → project → deploy"
- `plans/install-parity/PLAN.md` — the stage table and why `compile` is absent from it

**Constraints.**

- Reader is **human**; this is a `ρ=human` surface. Prose, not a σ\* formal block.
- Describe what the code **does**, not what an earlier design hoped it would. DESIGN §1's phase table
  posits `composed cells → harness-agnostic IR → harness artifacts`; the code does composed cells →
  harness artifacts **directly**, bypassing the IR entirely. Document the real path.
- No forward promises. Do not document `import → cells` as though it exists — it is an idea recorded in
  DESIGN §7a, not a feature.
- Independently verifiable **now**: the surviving pipeline is already live and already correct, so this
  shard does not wait on the excision.

**Dependencies.** None. Wave 0.

**Outputs.** A README whose headline flow is `init → add → compose → project → deploy`, whose install
story is the npm one, and which states the ownership boundary — npm delivers, the pipeline projects
locally, orchestration across hosts is the operator's.

**Completion criteria (falsifier).** `git grep -n "import\b.*compile" -- README.md` returns no headline
flow, control proven; a reader who knows nothing of this repo can follow the README to a working local
deploy without ever invoking `import` or `compile`. REJECTED if the README still bills the IR path as the
primary flow; if it documents the DESIGN §1 IR phase as though implemented; if it promises
`import → cells`; or if it is rewritten as a formal block rather than human prose.
