# Nothing checks that what is DEPLOYED matches what the corpus renders

> Found 2026-08-04 the expensive way: I argued a naming question for five hours from a
> **superseded axiom**, with full confidence, because the doctrine loaded into my own
> context was the pre-`a2205eb` projection. The operator caught it, not a gate.

## Symptom

`packages/canon/.render-ts/agents/nico.md` and `~/.claude/agents/nico.md` had
**diverged**, and nothing anywhere reported it:

| line                | rendered (source of truth)                                  | deployed (what actually ran)                                |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| the prime principle | `∀ authored-surface ⟨σ* ∨ ⊕σ* · prose ≡ identifier ≡ path⟩` | `∀ name ⟨anchor · dimension · skill · agent · file · dir⟩`  |
| apex block          | absent — SCOPE FLOOR forbids it riding                      | **present**, carrying a repo-local claim into every context |
| autonomy            | `mission-command ⟨escalate ⇔ fork(…)⟩`                      | **missing**                                                 |

Three defects in one artifact: a **superseded** clause, a clause the doctrine
explicitly says must **not** ride, and a live clause that never arrived.

## Why nothing caught it

`MODEL.md` has `deploy-valid ⇔ REGENERABLE`, and `REGENERABLE` says a Target is
deploy-owned, deterministic, and never hand-edited. Every one of those is a claim about
**how a Target is produced**. None is a claim about **what is on the host right now**.

The render oracle (`fe084dd1…`) hashes `.render-ts` — the corpus's own output. It was
green throughout. It proves the projector is deterministic; it says nothing about
whether anyone ran `deploy` afterwards. **The two trees can diverge silently and
indefinitely, and every gate in the suite stays green.**

That is the session's recurring shape once more: a correction landed in the source and
never reached the surface that actually gets read.

## The blast radius is the whole point

A stale deployment does not degrade gracefully. Every agent on the host runs the old
doctrine, in **every** session, including sessions doing canon work — so the corpus can
be edited by an agent operating under a superseded version of its own first principle.
That happened here: the axiom's reach was generalized from an enumeration to _every
authored surface_, and I spent a naming argument asserting the enumeration was still
binding, which inverted the conclusion.

## Shape of the fix (the cut is the executor's)

- A check that, for every deploy target, **deployed bytes ≡ rendered bytes**, reported
  per artifact rather than as a single hash — a single hash says "something moved" when
  what is needed is "which".
- It cannot live only in the suite. The suite runs in the repo; the drift lives on the
  host, and a contributor with no deployment has nothing to compare. Likely a `deploy
--check` mode plus a session-start advisory, on the precedent of the existing
  memory-consolidation nudge (advisory, never blocking).
- Deciding whether stale-deployment **blocks** or **warns** is a design call. Note the
  fidelity ladder: the floor is never silence.

## Acceptance

- Divergence between a rendered target and its deployed copy is reported, naming the
  artifact and the differing lines.
- A control proves it: mutate one deployed file, see it convicted, restore, see it green.
- The check is reachable without running the full suite, because the failure it catches
  is a property of the host and not of the repo.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** deploy-surface · **wave** 1
- **depends on** `t-kind-root-ignores-agent-ext` · `t-init-hardcodes-harness-dir`
- **writes** `packages/forge/src/cli/**` · `packages/forge/src/deploy/local.ts`
- **compiles against** `packages/forge/src/deploy/manifest.ts`
- **evidence** `packages/forge/src/deploy/manifest.ts` · `MODEL.md`
- **dispatchable** no ruling owed
