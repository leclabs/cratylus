# scoped-memory — execution spec (decision-grade)

Author: Nico, 2026-07-02. Status: **awaiting Operator approval** — approval releases the shards in
`pending/` into execution. Every design call below is asserted with rationale; D2 is the one departure
from the seed's sketch, flagged inline.

## 1. Scope model

```
scope lattice   user ⊃ project ⊃ plan          (3 tiers; task is NOT a scope — praxis
                                                completion records already carry task history)
scope(m)        the NARROWEST scope containing every context memory m is relevant to (least-scope)
promotion       narrow by default; widening demands evidence of cross-scope relevance
resolution      at encode: the agent reasons the tag from its working context (cwd repo → project;
                task-file/plan work → plan); tool validates grammar, never sniffs cwd (D3)
tag grammar     user | project:<key> | plan:<key>/<plan>     key = repo basename (host-portable)
```

- **D1 — no task scope.** A task's residue is its completed task-file (praxis); a 4th memory tier would
  duplicate praxis records for near-zero dwell time.
- **CoALA mapping** — type ⊥ scope: episodic = the stream · semantic = `MEMORY`/`AGENTS.md` · identity =
  `SELF` · procedural = skills. MemGPT core/archival ≙ agent files (core: persona-only, task-free) vs
  scoped `AGENTS.md` (archival at scope). `AGENTS.md` at project/plan scope **is** the semantic organ at
  that scope — part of the memory system, reconciled like `MEMORY`.

## 2. Per-scope homes ((type × scope) → path)

| scope   | episodic (raw)                        | semantic (durable)        | identity  | nature         |
| ------- | ------------------------------------- | ------------------------- | --------- | -------------- |
| user    | `~/.claude/agents/<n>/EPISODIC.jsonl` | `MEMORY.md` (+ vault ptr) | `SELF.md` | LOCAL-PER-HOST |
| project | — (single-store, D2)                  | `<repo>/AGENTS.md`        | —         | git, shared    |
| plan    | — (single-store, D2)                  | `plans/<plan>/AGENTS.md`  | —         | git, shared    |

- **D2 — single-store capture, scope-tagged (departs from the seed's per-scope streams; the landed
  `episodic.mjs` design is kept).** Every encode appends to the agent's own home log; `scope` is a
  routing TAG, never a raw-store selector. Rationale: a raw stream in a working tree is VCS churn +
  multi-agent collision + leaks one agent's stream into a shared repo (the bug the landed design already
  ruled out); one time-ordered stream preserves session narrative for dream; the seed's requirement —
  scope captured at write time — is satisfied by the tag (where the record physically sits is accident,
  not substance). Reversible later by teaching `resolveFile` a raw-store map; nothing else changes.
- The two natures reconcile at DRAIN: agent-tier homes are never synced; project/plan `AGENTS.md` are
  ordinary versioned files — dream edits them like any repo edit, committed by the working agent
  (continuity hook already nudges).

## 3. Encode routing

`episodic.mjs encode --home <agent-home> --scope <tag> --body …`

- Tool: validate tag against the grammar (reject unknown shapes loudly); store as today. `plan:` tag
  NEW in grammar. No cwd inference in the tool (**D3** — the agent is the context oracle; the protocol
  teaches "tag = narrowest active scope", the tool stays dumb and portable).
- Memory Protocol kernel (SOUL): the encode line's `--scope user` becomes `--scope <narrowest active
scope: user | project:<key> | plan:<key>/<plan>>` — one clause, kernel stays lean.

## 4. Dream routing (the algorithm)

For each raw item, two orthogonal axes — **type/voice picks the organ, scope picks the instance**:

```
route(item):
  scope=plan     → plans/<plan>/AGENTS.md          (semantic + open-threads/next-steps: the thread
                                                    lives with the plan — the mav hand-fix, systematized)
  scope=project  → <repo>/AGENTS.md                (directive/durable) · <repo>/docs/ (voluminous, vault rule)
  scope=user     → identity → SELF · durable → MEMORY · next-steps → stay EPISODIC · else drop
  INVARIANT      → a project:/plan:-tagged item NEVER lands in SELF or MEMORY (hard rule; a cross-
                   project lesson extracted FROM project work is re-tagged user by the dream reasoning —
                   the generalized law rises, the project fact stays at scope)
```

- **`AGENTS.md` reconciliation = consolidation**: dedup · net-current (no scar) · move-not-copy — the
  same laws as `MEMORY`, applied mechanically on every dream write.
- Post-dream invariant extends: SELF + MEMORY load whole **and audit clean (§6)**.

## 5. Surface edits (one home each)

| artifact                             | edit                                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `ideas/memory.md ## Protocol`        | encode clause: scope tag = narrowest active scope (one line)                                                     |
| `ideas/memory.md ## EPISODIC schema` | tag grammar + `plan:` routing target                                                                             |
| `skills/dream`                       | the §4 routing table + reconciliation law + the SELF/MEMORY hard rule                                            |
| `skills/wake`                        | orient: read project `AGENTS.md` + active plan's `AGENTS.md` (scoped stores) before resuming; post-dream `audit` |
| `skills/memory` (SKILL.md)           | `--scope` grammar incl. `plan:` + the `audit` verb                                                               |
| `skills/praxis`                      | law: a plan's `AGENTS.md` is a first-class memory sink (dream writes it; open threads home there)                |

## 6. Enforcement — the pollution-free falsifier

- **`episodic.mjs audit --home <h>`** (new verb, agent-memory pkg): deterministic detector over
  SELF/MEMORY for scope markers — workspace paths (`~/workspaces/<x>`, `plans/<x>/`), branch/PR/issue
  refs, repo keys from `.agent-factory.config` + an optional per-host keylist. Exit 1 + line-numbered
  findings on any hit; `--allow` pins reviewed exceptions (shrink-only, the ratchet pattern).
- Fires: wake step 1.5 (post-dream, blocking-advisory) + on demand. A repo CI test CANNOT see host-local
  stores — the wake-time gate is the enforcement site; the agent-memory unit suite proves the detector
  itself (seeded fixtures: polluted → exit 1, clean → 0).
- Codify ⇒ lint ⇒ conform, one change: the dream law (§4), the detector, and the migration (§7) land in
  the same initiative.

## 7. Migration — one-time de-pollution (per host, move-not-copy)

1. Per agent-home: run the NEW dream over `MEMORY.md`/`SELF.md` content itself (not just EPISODIC):
   classify each entry by §4; move project/plan-scoped entries to their scoped `AGENTS.md`; leave a
   one-line pointer only where the hot-index rule (vault law) warrants.
2. Known targets: **mav@upmav** `MEMORY.md` ≈27 KB → `web-platform` project/plan `AGENTS.md`;
   **nico@fire** `MEMORY.md` 13.9 KB (Homes/Corpus-doctrine/Ops = agent-factory-scoped → polis
   `AGENTS.md`/`docs/`); every other fleet home audited (expected near-clean).
3. Verify: `audit` exits 0 per home; moved content grep-verified at destination; `.bak` archives kept.

## 8. Decisions index

| id  | call                                       | over                   | why (load-bearing)                            |
| --- | ------------------------------------------ | ---------------------- | --------------------------------------------- |
| D1  | 3-tier lattice, no task scope              | user⊃project⊃plan⊃task | praxis records already carry task residue     |
| D2  | single-store capture + scope tags          | per-scope raw streams  | VCS/collision/leak; substance = the tag       |
| D3  | agent reasons the tag; tool validates only | cwd-sniffing encode    | LLM is the context oracle; tool stays dumb    |
| D4  | wake-time audit gate (host-side)           | repo CI gate           | stores are LOCAL-PER-HOST; CI cannot see them |
| D5  | plan-scoped next-steps → plan `AGENTS.md`  | stay in EPISODIC       | the thread lives with the plan (mav hand-fix) |

Adjacent, NOT absorbed (per task): the execution-organ question — resolved separately 2026-07-01
(facet of `autonomy`; no organ coined).
