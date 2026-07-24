# plan-set-dynamics

**Status: COMPLETE — all shards landed; full agent-canon suite green (119 pass/1 skip); corpus self-sufficient (ALLOW_LIST → ∅).** Owner: session `555c4985` (mav).
Design `DESIGN.md`; notation in praxis.ts (commit `62043c1`); mechanism `toolkit/plan-set.ts` (commit `a3ca226`). The plan-retirement residue is now formal — the last residual of the formal-block-self-sufficiency workstream is closed.
This file mirrors runtime state (task-files in state folders); the folders are authority.

## Intent

Design + realize the **plan-level lifecycle tier** praxis lacks. Today praxis fully models **tasks inside
one plan** (`States={pending,ready,active,completed}`, `next`, dispatch/judge/advance, waves) but has **no**
model of a **plan as a member of a changing set of plans over time**. That gap is why
`-- plan-retirement: a plan retires once its result lands; commit association is derived on demand, never
stored.` sits in praxis.ts as residual admissible boundary-prose (nico-ratified; the concept it names is
unbuilt). Build the tier so that residue formalizes into notation.

The four unmodeled dynamics:

- **plan-level state machine** — states `in-development → active → landed → retired/archived`, parallel to
  but distinct from the task-level machine.
- **plan-set membership** — how `list`'s `℘(P)` partitions into in-scope vs retired/archived, and how a
  plan moves between (birth on `start`, exit on retirement).
- **landing relation** — `plan ↔ landing-commit`, **derived on demand, never stored**; result-landing (a
  VCS merge/commit event) is the retirement trigger.
- **retirement/archival** — retiring a landed plan without losing it (archive, not the current informal
  `chore: retire N landed plans` dir-delete).

## Ground truth (census, 2026-07-22)

- Plans are a **praxis-skill construct, NOT a MODEL `Kind`** (`Kind ≜ {fragment,agent,rule,skill,hook}`,
  MODEL.md L10). ⇒ the tier lives in the praxis skill (+ its tooling), never as a new Kind.
- Current plan mechanics: `plans/<plan>/` = `PLAN.md` mirror + task-files in state folders + `.owner`
  sidecar; `list : ↦ ℘(P)` enumerates in-scope plans; `owner`/`occupied`/`live` resolve via the memory
  session-registry (`~/.claude/skills/memory/episodic.mjs session`). Retirement today is a manual
  `chore(plans): retire N landed plans` dir-delete (git history) — no formal state, no archive.
- `dream.ts` retired the `AGENTS.md@node` memory-sink route (freeing the plan dir of a memory role).
- `layPlansScaffold()` / `planner.ts` surfaced by graphify as related scaffolding.

## Slices (MECE, vertical concern)

- **t1 — design the tier** (`ready`): conceptualize + signify + formalize the plan-level model whole; emit
  the exact praxis.ts notation (formalizing the plan-retirement residue) + the mechanism approach + the
  placement ruling. The keystone.
- **t2 — realize the mechanism** (`pending`, dep t1): implement plan-level state + membership churn +
  retirement/archival + derive-landing-commit-on-demand in the plan-dir layout + praxis tooling.
- **t3 — land notation + reconcile docs + resolve residue** (`pending`, dep t1): apply the notation to
  praxis.ts (plan-retirement residue → formal), reconcile ENGINE/skill docs, drive the self-sufficiency
  gate to praxis-clean (`ALLOW_LIST → ∅`).

## Dependencies & waves

R = { (t2, t1), (t3, t1) }. wave(0) = { t1 }. wave(1) = { t2, t3 }.

Note: `|frontier|=1` at wave 0 is the design-root, not a mis-cut — a coherent model must settle before its
notation (t3) and mechanism (t2) can be realized in parallel. Fan-out is wave 1.

## Not in scope

- Adding a MODEL `Kind` for plans (Kinds are fixed; cold-verified).
- Storing the landing commit (the relation is derived-on-demand by contract).
