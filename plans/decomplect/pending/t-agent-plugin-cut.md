# `AgentPlugin` binds two concepts — the question is a cut, not an owner

> **Depends on [`t-runtime-capability-vocabulary`](../ready/t-runtime-capability-vocabulary.md).**
> Both shards write `packages/agent-schema/src/index.ts` and both retire an entry from the same
> architecture ratchet, so they cannot share a wave. Disjoint outputs is the concurrency
> precondition; these are not disjoint.

## Intent

Settle `AgentPlugin`'s home. PLAN.md poses it as a binary — _schema **shape** or forge **resolver
contract**_ — and a census on 2026-08-05 says the binary is the wrong question.

## What the census established

`agent-forge/src/resolve/plugin.ts` declares `AgentPlugin` with seven fields, and they fall into two
disjoint groups:

| field                                 | what it is                                   | whose concern   |
| ------------------------------------- | -------------------------------------------- | --------------- |
| `fragments` `agents` `skills` `hooks` | package-relative **dirs the resolver scans** | forge — MAPPING |
| `preamble` `manifest`                 | doctrine, and **which dimensions exist**     | canon — MEANING |
| `name`                                | namespace segment, reporting + uniqueness    | either          |

The second group is **constitutive**. ARCHITECTURE is explicit: _"Canon owns the **catalog** — which
dimensions exist — because a dimension is constitutive: declaring one makes it part of that corpus's
agent design."_ `manifest` is that catalog's instance. `preamble` is doctrine that must travel with
the plugin, and the field's own comment says why: _a consumer projecting an extended plugin has no
access to the plugin's own repo._

The first group is pure discovery mechanics — **where to look**, which is exactly the mapping forge
is allowed to own and nothing else.

**So `AgentPlugin` is a palimpsest of the same species as `anatomy`**: one sign over two concepts,
and the reason the ownership question has no answer is that it is posed about a sign, not a concept.
The last property-2 breach — `agent-canon/src/index.ts:23` importing `defineAgentPlugin` from
`@leclabs/agent-forge/resolve` — is that palimpsest's cost: canon's ROOT must reach the projector to
declare things that are canon's own.

## Constraints

- Signify **both** concepts and take the argmin, on C1's precedent. Do not name one and let the other
  keep the old sign by default — that is how `anatomy` became a palimpsest in the first place.
- `⊥ IS A RESULT`. If a concept does not survive the existence check, say so; a cut is not owed a
  name on both sides.
- Occupancy runs against this repo, not the model: `plugin`, `resolve`, and `manifest` are all
  already bound here — `manifest` was settled this plan and **does not move**.
- Whatever lands must keep the property the comments defend: an extended plugin stays projectable by
  a consumer who has no access to the authoring repo.
- `ARCHITECTURE.md`'s property 2 says nothing depends on projection, and canon reaches forge **only**
  as a build tool for canon's own scripts, never from a cell — `src/index.ts` is canon's ROOT, and
  the plan already measured it at exactly **1**.

## Outputs

- `packages/agent-forge/src/resolve/plugin.ts`, `packages/agent-schema/src/index.ts`,
  `packages/agent-canon/src/index.ts` — per the ruling.
- `packages/agent-canon/test/architecture.test.ts` — the property-2 root pin retired, not re-pinned.
- `ARCHITECTURE.md` — the divergence row for the root import removed **in the same act** as the
  repair, never before it and never after.
- `plans/decomplect/CRATYLISM-SWEEP.md` — both signification runs, rejects included.

## Acceptance

1. `architecture.test.ts`'s exact-count leg reads canon→forge **root = 0** (pre-state: **1**; the
   control fails today), with **cells still 0** and **build scripts still 6** — 6 is licensed by
   ARCHITECTURE and must never be 0, because 0 means canon cannot build itself.
2. No `schema → runtime` entry and no root entry on the ratchet, suite green — both retired by
   repair, not by exemption.
3. `pnpm test --force` green, 9 tasks, none cached.
4. Render oracle `fe084dd1d531948979dc386713c3f688c96088ab`, or a deliberate re-baseline argued in
   the commit message.
5. Each minted sign carries a forward argmin, a **blind reverse decode**, and an **occupancy check
   against this repo**. Never mint on forward legs alone, however many agree.

## The refusal clause

If the cut cannot be made without changing `ARCHITECTURE.md`'s properties themselves, or if an
acceptance number above contradicts the ground: **STOP and report.** A workaround here is a design
decision and that is not yours on this task. The last three high-value findings on this plan came
from delegates refusing an instruction rather than satisfying it.
