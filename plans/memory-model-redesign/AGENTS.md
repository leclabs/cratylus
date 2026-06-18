# memory-model-redesign

**Goal.** Collapse the fragmented memory-management constitution into a single `memory` home, and integrate the
Operator's JSONL-portable-episodic design — so the lifecycle (`encode → dream → memory → wake`) is stated **once**,
memory routes by two orthogonal axes (**type/voice picks the organ, scope picks the instance**), and one agent is
**one person** across the fleet / user / project scopes.

**Scope.** `packages/mind/ideas/**` (the memory cells) · `packages/mind/references/**` (notation) ·
`packages/mind/toolkit/**` where the projector needs support · the agent sidecar runtime (EPISODIC store, dream
routing, fleet sync, vault) · the fleet (redeploy).

**Leads.**

- **Nico** — the model/constitution: the memory cells, the unified two-axis model, the JSONL schema-as-spec.
- **Mav** — the machinery runtime: JSONL EPISODIC, ULID, `resolveFile`, the dream-routing engine, fleet sync, vault.

Coordination is **this plan** — assign → delegate → Nico re-verifies the objective gate himself → mark done. No
side-channel doc (COORDINATION.md is retired).

**Strategy.** Constitution-leads: the model + schema-spec land first (one coherent pass), Mav's machinery + the
migration follow, fleet redeploy once. The `render: verbatim` Protocol is authored substrate-neutral, so it ships
and runs now and needs no second deploy when JSONL lands.

**Exit criteria.**

- The memory-management lifecycle is stated in **one** home (`memory`); no cell restates the wake sequence
  (currently stated in 3).
- Routing is the two-axis model — type/voice picks the organ, scope picks the instance — with
  `work-is-project-scoped` folded in as the scope axis.
- The 5 homes are MECE (SELF · MEMORY · EPISODIC · AGENTS.md · vault); satellites (`continuity-thread`,
  `right-to-forget`) cite, never duplicate.
- EPISODIC is a portable JSONL event log (ULID id, scope-relative path, open body, dream-written `routes`); no
  absolute-path storage, no `home`/`fid` fields.
- One logical agent-global store synced across the fleet — an agent is one person on every host.
- Constitution round-trips (`verify.py` PASS) and blind-judge ACCEPTs; deployed fleet-wide on consent.
