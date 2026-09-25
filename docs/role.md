# Role

**Disposition of the handoff spec.** This file was the spec the role work was judged against. The
work landed; three of its instructions were rectified rather than implemented, and one unit was not
built. Each rectification is recorded below with the reason it was rectified, because a spec that is
silently reinterpreted teaches nothing the next time.

The authoritative statement of the mechanism that landed is the header comment of
`packages/canon/src/roles/hold.ts`. This document does not restate it.

## The rectifications

### `role` was NOT promoted out of `MANIFEST`

U0 required the promotion, and U0's own acceptance required the projected Targets to be
byte-identical. Those two are inconsistent: `role` is a dimension, `agentBody` emits one `##`
section per dimension, so removing it removes the `## Role` section from every projected Target.
Promotion would have failed the criterion that was written to prove the fold safe.

What landed instead gives the doc what it actually wanted. `role` stays exactly as it was —
`{ axis: 'Persona', repertoire: 'open', arity: 'scalar' }` at `packages/canon/src/manifest.ts:52` —
and its VALUES changed. Each is now a multi-line contract rather than a bare token: the arrow the
position is over the ladder `intent ≺ C ≺ spec ≺ artifact`, in the form
`architect ≜ reads⟨intent · C⟩ → writes⟨C⟩`, with the acts the arrow reserves and the defect it
names. The bundle is a separate structure (`RoleCell` in `roles/hold.ts`) that is made of dimension
values and carries the `role` value as its `sign`. A role can now be STATED, not merely named, which
was D3's complaint, and the projected section survives.

### No `elevation` dimension was minted

The sign was already occupied twice in this corpus, and both uses are load-bearing. The stance
guardrail and the `carry-on` skill use `elevation` for an authority grant the operator utters and
that persists until they redirect (`hooks/stance-guardrail.ts:347,398-404`,
`skills/carry-on/skill.ts:52`); `packages/forge/src/core/exemplify/vector.ts:2` uses it for raising
a step-1 agent into a typed selection vector. A third sense would have been a palimpsest on a sign
two mechanisms already read.

The decisive reason is not the collision. A dimension functionally determined 1:1 by another
dimension is not a dimension: every role value determines its arrow, and every arrow in the corpus
determines its role. So the arrow is stated INSIDE the role value, where it is one fact rather than
two that can disagree — and where it is quotable verbatim by a rubric, which was U1's whole purpose
(D1: "an omission is not scoreable").

### No constitutive/default marking was built

U0 made constitutive-versus-default the thing that "makes singular arity safe", with `accept()`
refusing a holder that overrides a constitutive aspect. With the contract folded into the role's own
value, the marking has no live subject. `Declared` omits the `role` key (`roles/hold.ts:81`), so a
holder has no field in which to override its contract: inviolability is structural, not a marking,
and there is no rule to enforce or to get wrong. Every other aspect a role supplies is a default — a
scalar the holder overrides, a set the holder extends — and a role-supplied set member survives
every holder because union already guarantees it. A mechanism with no live subject is structure
carrying no load.

### The witness became `assay` / `assayer`

The name was cold-decoded over the contract, as U2 and U5 instructed. `witness` was rejected:
`packages/forge/src/validate/accept.ts` already uses "witness" throughout for a check that returns a
`LegVerdict` (`canonical`, `signified`, `partitioned`, `parsimonious`, `regenerable`, `enforced`,
all declared under the comment "the five per-cell / partition witnesses"). A verdict is the precise
thing this party is forbidden to emit, so the sign would have asserted the opposite of the cell.

## Unit disposition

### U0 · Roles as bundles — LANDED, rectified

`packages/canon/src/roles/` holds one `RoleCell` per position: its `sign` (the `role` value), its
optional `skills`, and a partial dimension `vector`. `holds(role, declared)` folds the two at
authoring time, before `compose`, so the emitted Target is exactly as flat as when every value was
retyped by hand. `⊕` reads the manifest's own `arity`: a set is unioned with role members first, a
scalar is the holder's when the key is PRESENT (present-with-`null` is an explicit suppression) and
the role's otherwise. `provenance.mark` never folds — `holds` copies `declared.provenance` and the
role vector has no such field, so a holder cannot inherit a mark, and the key is required on the
identity, so it cannot be dropped by accident. No agent can declare two roles: `holds` takes one
`RoleCell` and `Declared` omits `role`. Five roles exist; seven agents hold one each.

Two acceptance criteria were not met as written. The promotion out of `MANIFEST` was rectified
above. Byte-identical Targets were not achieved either, and the reason is the union rule: role
members are emitted first, so `kino`'s capabilities and `nico`'s capabilities, engineering
principles and guardrails now project in a different order than the hand-written vectors did.
Nothing was dropped by the reordering, but the diff is real and is recorded in the changelog as a
cost rather than hidden.

`agents/architect.ts` and `agents/kino.ts` were rewritten as holders. `architect` declares nothing
but its identity; `kino` declares two capabilities, two scalar overrides and its own prose. Neither
restates a value the role supplies unchanged.

### U1 · The architect role's elevation aspect — LANDED, as a role value

`dimensions/role/architect.ts` states the pair, the acts it reserves, the ladder, and delegation as
a theorem: `∀ act ⟨dom(act) ∉ reads ∨ cod(act) ≠ writes⟩ ⇒ DELEGATED`, with
`⟨C → spec⟩ ↦ plan · ⟨spec → artifact⟩ ↦ implement · ⟨artifact → C⟩ ↦ assay` as the derived
consequence rather than the declaration. `descent` is named as the defect. `architect`, `kino` and
`nico` all carry it verbatim by holding the role, and no `delegation` axis was minted.

### U2 · The witness role's elevation aspect — LANDED, as `assay`

`assay ≜ reads⟨C · artifact⟩ → writes⟨C⟩`, declared the adjoint of `plan`, with both prohibitions
(`¬emits ⟨verdict · mechanism-prose⟩`), the two-descriptions clause (`spec ∉ assay`), and the one
exemption that makes the cell work: `reads⟨artifact⟩ ≠ descent`.

### U3 · Capability correction — LANDED, and it removed two

`planning-decomposition` is gone from the architect role, and so is `review-critique`. The written
contract convicted both: the contract says `⟨C → spec⟩ ↦ plan` while the capability was glossed in
`kino.ts` as the decomposition that hands work out, and
`review-critique ≜ ⟨adversarial threat-modeling severity-triage⟩` is a substrate act under a name
that sounded conceptual, where the critique this position performs is `judge`, which the contract
reserves by name. One edit on the role corrected `architect`, `kino` and `nico` at once.

### U4 · `deliver` names the witness and the lift — LANDED, under the rectified names

`skills/deliver/skill.ts` gained `assay`, `assayer`, `achieved`, `unachieved`, the C-typed and
routed-locus laws, the `assayer ⊥ executor` clause, and the redispatch law.
`validate ⊨ artifact ⟨NEVER r⟩` and `validate ⊨ self` are unchanged, because they are the laws the
unit protects. The closing sequence now reads
`… → verify ⟨executor⟩ → assay ⟨assayer, on artifact⟩ → validate ⟨self, on the assay⟩ → judge → …`,
and the header comment explains the read/verdict split.

### U5 · The witness agent cell — LANDED as `assayer`

`agents/assayer.ts` holds the `assay` role. `software-engineering` is present in that role and
absent one rung up, which is the same decision twice. Its autonomy is `mission-command` and
`handoff` and not `principal-self`; its skills are `['design']` and not `deliver`; its guardrail is
`honesty`; its output format is `structured-data` and its objective `thoroughness`, both chosen
against the one failure mode of turning into a code reviewer. The description states the no-verdict
clause out loud. No gate enrollment was touched.

### U6 · The elevation gate — NOT BUILT

This is the outstanding unit, and it was left out deliberately rather than missed. It is enforcement
where every other unit is declaration, and D1's stated defect — an omission is not scoreable — is
closed by the declaration itself: the contract is now a quotable artifact in every holder's Target,
which the absence of `software-engineering` never was. Building the gate as well would have added
mechanism before anything had read the declaration.

What it would now have to quote is the `## Role` section of a holder's projected Target, verbatim,
exactly as the stance rubric quotes `handoff ≜ …` (`targets/guardrail/stance-judge-prompt.md:215`).
The rest of U6's design stands as written: a pre-fire hook beside `stance-guardrail-pre`, its own
rubric file at the vendor-neutral `.agents/` root rather than an append to the stance prompt, its
own entry under `gates`, and fail-open, evidence-checked and re-entry-capped inherited from the
sibling.

## What became of the prohibitions

The §6 list survived except where a rectification voided it. One role per agent, no inheritance, no
fold at deploy time, no folded `provenance.mark`, no `delegation` axis, no verdict or
mechanism-prose from the assayer, and no executor's spec in its hands are all held structurally by
`holds` and by the role values. "Do not let an agent override a constitutive aspect" is void: there
are no constitutive aspects, only a contract with no field to state it in. And the instruction not
to enforce the elevation by deleting capabilities alone still stands as the open half of U6.
