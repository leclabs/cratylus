# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

Fresh plan (2026-06-18). Integrates the Operator's JSONL-portable-episodic design (relayed via Mav, formerly
parked). **Subsumes** the already-shipped `work-is-project-scoped` cell (`main` @ `6f1b722`): the redesign folds it
into the `memory` home as the scope axis. Constitution-leads — the model + schema-spec land first, machinery +
migration follow, fleet redeploy once.

## Frontier (ready)

- **redesign-memory-constitution** · `ready/redesign-memory-constitution.md` · **Nico** — the one-pass
  constitution rewrite: one `memory` home, two-axis routing, fold + thin + MECE satellites, 5 homes, JSONL
  schema-as-spec. No deps; the foundation everything else waits on.

## Backlog (pending)

- **jsonl-episodic-store** · **Mav** — EPISODIC.jsonl: ULID, append-open encode, `resolveFile(scope,path)`
  portability. _(dep: redesign-memory-constitution)_
- **dream-routing-engine** · **Mav** — the routing pass: voice→organ, scope→instance, split, drop, atomic compact.
  _(dep: jsonl-episodic-store)_
- **fleet-sync-organs** · **Mav** — one logical agent-global store synced across hosts; no absolute paths.
  _(dep: jsonl-episodic-store)_
- **vault-reference-home** · **Mav** — the Obsidian vault as the cold 5th home; MEMORY→vault graduation.
  _(dep: redesign-memory-constitution; lower priority)_
- **migrate-live-episodic** · **Mav** build + **Nico** verify — convert live agents' EPISODIC.md → jsonl, no loss.
  _(dep: jsonl-episodic-store, dream-routing-engine; consent-gated)_
- **fleet-redeploy** · **Nico** — redeploy the new `memory` constitution to all 6 hosts. _(dep:
  redesign-memory-constitution; consent-gated)_

## Completed

_(none yet.)_
