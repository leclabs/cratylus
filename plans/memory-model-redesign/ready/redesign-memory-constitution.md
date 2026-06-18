# redesign-memory-constitution

**Owner.** Nico. **Deps.** none — the foundation; every other task waits on the model + schema-spec.

**What.** One coherent authoring pass (one `memory` home, one commit) consolidating the memory-management
constitution and integrating the Operator's unified model.

- **One home.** Refocus `identity-memory-stack` → the single `memory` home: the store (layers) + the whole
  lifecycle stated **once** in the `render: verbatim` Protocol, authored substrate-neutral so it ships and runs now.
- **Two-axis routing.** type/voice picks the organ; scope picks the instance. Fold `work-is-project-scoped` in as
  the scope axis.
- **Fold (no unique idea left standalone):** `agent-know-thyself`, `episodic-encoding`, `work-is-project-scoped`
  → into `memory`.
- **Thin skills:** `/dream`, `/wake`, `/handoff` cite the Protocol; restate nothing.
- **MECE satellites:** `continuity-thread` (the SELF organ) + `right-to-forget` (requested-delete) — verified
  unique and cite-not-duplicate.
- **5 homes described (incl the new vault):** SELF · MEMORY · EPISODIC · AGENTS.md (directive) · vault (reference),
  each with its consumption mode.
- **Voice heuristic** as the placement diagnostic (1st-person identity→SELF · 1st-person knowledge→MEMORY ·
  2nd-person imperative→AGENTS.md · 3rd-person expository→vault).
- **Fleet-portability** as principle: the logical home is one; the physical path is derived per host; never
  absolute, never a stored `home`/`fid`.
- **JSONL schema as Mav's build-spec** (a non-verbatim section, not shipped into defs):
  `{id:ULID, scope, path?(scope-relative), body(open)}` + dream-written `routes`; with the rationale (ULID over
  UUIDv4; reject `home`/`fid`; single-valued `scope`; encode-open / route-at-dream).

**Exit criteria.**

- The wake sequence is stated **exactly once** (grep finds it in one cell, not three).
- `verify.py` PASS (schema + refs + fences + symbols + operative + round-trip + reconstruct); GLOSSARY regenerated.
- Blind-judge (fresh nico, CE ∧ ME + MECE) returns ACCEPT.
- Prettier clean; landed in one commit.
