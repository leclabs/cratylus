# `AgentPlugin` binds two concepts — the question is a cut, not an owner

> **Depends on [`t-runtime-capability-vocabulary`](../ready/t-runtime-capability-vocabulary.md).**
> Both shards write `packages/schema/src/index.ts` and both retire an entry from the same
> architecture ratchet, so they cannot share a wave. Disjoint outputs is the concurrency
> precondition; these are not disjoint.

## Intent

Settle `AgentPlugin`'s home. PLAN.md poses it as a binary — _schema **shape** or forge **resolver
contract**_ — and a census on 2026-08-05 says the binary is the wrong question.

## What the census established

`forge/src/resolve/plugin.ts` declares `AgentPlugin` with seven fields, and they fall into two
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
The last property-2 breach — `canon/src/index.ts:23` importing `defineAgentPlugin` from
`@cratylus/forge/resolve` — is that palimpsest's cost: canon's ROOT must reach the projector to
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

- `packages/forge/src/resolve/plugin.ts`, `packages/schema/src/index.ts`,
  `packages/canon/src/index.ts` — per the ruling.
- `packages/canon/test/architecture.test.ts` — the property-2 root pin retired, not re-pinned.
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
4. Render oracle `f60e936a172d6f37a5120cd9dd0e282c19727f58`, or a deliberate re-baseline argued in
   the commit message.
5. Each minted sign carries a forward argmin, a **blind reverse decode**, and an **occupancy check
   against this repo**. Never mint on forward legs alone, however many agree.

## The refusal clause

If the cut cannot be made without changing `ARCHITECTURE.md`'s properties themselves, or if an
acceptance number above contradicts the ground: **STOP and report.** A workaround here is a design
decision and that is not yours on this task. The last three high-value findings on this plan came
from delegates refusing an instruction rather than satisfying it.

---

## Resolution — landed 2026-08-05

**Property 2 now holds with no exceptions.** `canon/src/index.ts → forge` is gone.

### The cut, and a ⊥

The census was right that `AgentPlugin` bound two groups. The ruling splits them unevenly, and the
uneven part is the finding.

**Concept A got a name: `Layout`** — the four package-relative dirs (`fragments`, `agents`, `skills`,
`hooks`). Pure discovery mechanics: it answers _where do I look_, which is mapping, which is the
projector's to own. `AgentPlugin extends Layout`, so the concept is named and independently
referenceable while the authoring surface stays flat and no call site churns.

**Concept B returned ⊥, and was NOT named.** A blind decode proposed `Constitution`/`Charter` and
then argued against its own proposal, supplying the test that settles it: `preamble` and `manifest`
are one concept only if the preamble is the informal face of the vocabulary the manifest formalizes.

Inspection settles it — `foundingDoctrine` is the **cratylism naming axiom** and says nothing about
which dimensions exist. So the only thing the two fields share is that both must **travel** with the
plugin. That is a lifecycle property, not a concept, and grouping by it produces non-concepts
(`payload`, `carried`, `bundle`). The group would also have been defined **negatively** — "the fields
that aren't paths" — which is precisely how the retired `anatomy` sign became a palimpsest over four
concepts. The same defect was available one generation later and was declined.

`name` stays on the wrapper: uniqueness is a registry-level property no single plugin can enforce,
and a corpus with the same doctrine under a different label is the same corpus. The label is not
constitutive.

### Why the move was free

`AgentPlugin` imported exactly one thing — `DimensionManifest` from `@cratylus/schema` — and
`defineAgentPlugin` is `(plugin) => plugin`. **Zero forge dependency.** It lived in the projector by
history, not by need, and "the shapes a corpus authors against" is the schema's charter. There was no
ownership question to settle; there was a file in the wrong package.

`forge/src/resolve/plugin.ts` now re-exports from the schema rather than redeclaring — one
definition, one alias — so forge's own resolver still addresses the contract through `resolve/`,
where a reader of that package looks for it.

### Acceptance

1. [x] Exact-count leg reads canon→forge **root = 0** (was 1), **cells still 0**, **build scripts
       still 4** — licensed, and must never be 0 or canon could not build itself.
2. [x] Neither `schema → runtime` nor the root entry remains on the ratchet; suite green, so both
       retired by repair rather than exemption. The ratchet is **26 → 1**.
3. [x] `pnpm test --force` green — 14 tasks, 706 tests, none cached.
4. [x] Render oracle **unmoved** at `0ac8e09fbbd40077f246d4774da60789cc8b3dbd`. No re-baseline: the
       move changed no projected byte, which is the proof it was structural.
5. [x] `Layout` carries a forward argmin, a blind reverse decode, and an occupancy check. Concept B
       carries the same three legs and returned `⊥` — recorded as a result, not as a gap.

The one surviving ratchet entry is property 1's pinned breach, which is the only one that cannot be
repaired by refactoring: `bin-name-single-home.test.ts` REQUIRES the import, so amending that
counter-gate is a design decision owed before the repair.
