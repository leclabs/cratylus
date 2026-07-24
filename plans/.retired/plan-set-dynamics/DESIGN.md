# plan-set-dynamics — DESIGN (t1)

Reader = LLM. This is the t1 deliverable: the concept lattice, the cold-verified anchors, the four
sub-models, the exact praxis.ts notation to splice (t3), the t2 mechanism approach, and the placement
ruling. Authority for the notation is the block in §5; §1–4 justify it.

## 0. Placement ruling (deliverable d)

- **A plan is a `praxis`-skill construct, NOT a MODEL `Kind`.** `Kind ≜ {fragment, agent, rule, skill,
hook}` (MODEL.md L10, cold-verified). A plan is none of these — it is the work-tracking unit the
  `praxis` skill already models (`P ≜ a plan : a set of task-files`). The tier **adds no Kind**; it
  enriches the `praxis` skill's formal block plus its toolkit. (Acceptance 6.)
- **ENGINE is untouched.** The engine (`agent-forge/deploy`) declares the `ProjectTemplate` shape and
  materializes a plan's _internal_ task-state folders from `planStates` (= `PLAN_STATES`). The
  plan-level tier introduces (i) plan-phase as a **derivation** (no folders the engine lays down) and
  (ii) one new `plans/`-level container `plans/.retired/`, created **lazily** by the `retire` op
  (`mkdir -p`), never scaffolded. `PLAN_STATES` and the engine's scaffold path stay as-is.
- **Home:** the notation lives in `packages/agent-canon/src/skills/praxis.ts` (`FORMAL_BLOCK`); the
  mechanism lives in `packages/agent-canon/src/toolkit/` (a `plan-set.ts` sibling to `plan-states.ts`).
  This is nico's canon remit (design/notation); t2 realizes the mechanism, t3 lands the notation.

## 1. Cold-verified anchors (deliverable a — discovered, not assumed)

Each name is discovered by cold-decode against LLM priors + corpus, reuse-over-mint. `fires` = the
priors the sign fires; `beats` = why it dominates the alternative.

| anchor      | concept                                                         | fires                                                                               | beats                                                                                                                                                                              |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proposed`  | phase-1: authored, sharded, frontier-ready, undispatched        | "put forward, awaiting go/adoption"                                                 | `in-development` (a sharded frontier-ready plan is _done_ developing); corpus-attested (this PLAN.md status line)                                                                  |
| `in-flight` | phase-2: dispatched, owner live, frontier advancing, not landed | "departed, executing, en route, not yet down"                                       | `active` — which **collides** with the task-state `active` (one-name-one-concept violation across levels); `in-flight → landed` is a coherent flight pair                          |
| `landed`    | phase-3: all tasks completed ∧ result merged to trunk           | "delivered, arrived on the mainline"                                                | corpus-saturated ("land notation", "result lands", "landing-commit", "N landed plans") — dominant, no contender                                                                    |
| `retired`   | phase-4: removed from the working set, preserved                | "out of active service, kept not destroyed"                                         | `archived` names the _mechanism/location_; `retired` names the _lifecycle status_ (corpus-attested: "retire N landed plans")                                                       |
| `landing`   | the plan↔commit relation (the touch-down event)                 | "the commit where the result came down"                                             | nominalizes the corpus verb `land`; distinct from `merge` (plan-merge, already taken)                                                                                              |
| `.retired/` | on-disk container for retired plans                             | folder-as-state: residence ⇒ state `retired`; dot ⇒ meta, auto-excluded from `list` | `.archive/` (names mechanism not state — breaks folder=state parallel with `completed/`); a bare `retired/` (loses the dot-exclusion the `.owner` sidecar convention already uses) |
| `retire`    | the phase-3 → phase-4 operation (move, not delete)              | "take out of service, preserve"                                                     | delete (loses the plan); archival semantics carried by the preservation law, not a separate `archive` symbol                                                                       |

Deviation from the task-file's tentative candidates (`in-development → active`): both are refused on
cold-verification — `in-development` over-claims (development is finished), `active` collides with the
task-state glyph. Discovered replacements: `proposed`, `in-flight`.

## 2. Concept lattice

```
primitives (undefined bases)
  commit                      a VCS commit
  Plans                       the set of plans on disk
  archived : P → 𝔹            dir(P) under plans/.retired/     (folder-as-state, on-disk)
  lands : commit × P → 𝔹      the trunk merge of P's result    (VCS predicate)

derived from task-level machine (fold over state : P → States)
  dispatched(P)  ⇔ ∃ t : state(t) ∈ {active, completed}
  done(P)        ⇔ ∀ t : state(t) = completed          (all-tasks-completed ⇒ eligible-to-land)

derived from VCS (on demand, never stored)
  landing : P ⇀ commit        landing(P) = c ⇔ lands(c, P)

composites
  landed(P)   ⇔ landing(P) defined ∧ ¬archived(P)      (phase-3 test / retirement trigger)
  inscope(P)  ⇔ ¬archived(P)                            (membership test)
  phase : P → Phase           priority fold over {archived, landed, dispatched}
  Phase       = { proposed, in-flight, landed, retired }
```

## 3. The four sub-models

### (1) plan-level state machine — parallel to, distinct from, the task machine

`Phase ≜ {proposed, in-flight, landed, retired}` is the plan-as-whole lifecycle, distinct from the
task-level `States ≜ {pending, ready, active, completed}`. **`phase` is a pure derivation** (like the
existing `truth : P → States`), not a stored field and not a folder the plan sits in — except its
terminal value `retired`, read off the `.retired/` container. The machine is a **readout of ground
truth**, so its edges are _emergent_ from task-state / landing / archive changes, not applied by a
separate command:

- `phase` derivation (total, priority-ordered, mutually exclusive guards):
  `archived(P) ⇒ retired` · `landed(P) ⇒ landed` · `dispatched(P) ∧ ¬landed(P) ∧ ¬archived(P) ⇒
in-flight` · `¬dispatched(P) ∧ ¬archived(P) ⇒ proposed`.
- succession map `nextPhase ≜ {proposed ↦ in-flight, in-flight ↦ landed, landed ↦ retired, retired ↦
retired}` (the abstract state machine; mirrors `next`).
- edge triggers: `dispatch` (proposed → in-flight) · `landing(P)` becoming defined (in-flight →
  landed) · `retire` (landed → retired).
- **plan↔task coupling:** `done(P)` (all tasks completed) is the _eligibility_ for landing; landing is
  a distinct VCS event, so `done(P) ∧ ¬landing(P) defined` remains `in-flight`.

### (2) plan-set membership — a function of on-disk state, no stored field

`Plans` = every plan dir on disk. Partition by container residence:
`inscope(P) ⇔ ¬archived(P)` (dir directly under `plans/`) vs `archived(P)` (dir under `plans/.retired/`).
`list = { P ∈ Plans | inscope(P) }` — enumerate dirs directly under `plans/` bearing a `PLAN.md`
(`.retired/` is dot-prefixed and holds no top-level `PLAN.md`, so it is naturally skipped). Churn:
**birth** on `start` (`start ⇒ P ∈ Plans ∧ phase(P) = proposed`); **exit** on `retire` (moves P from
in-scope to archived). Membership is thus the folder location, never a stored membership flag.

### (3) landing relation — derived on demand, never stored

`landing : P ⇀ commit`, partial, defined iff P's result has merged. Derivation: `landing(P) = c ⇔
lands(c, P)`, with `lands` unique per plan (`lands(c,P) ∧ lands(c',P) ⇒ c = c'`). It is **never
persisted**: `∀ P : stored(P) = ∅` (no plan records any commit ref in content, sidecar, or PLAN.md).
Result-landing (`landing(P)` becoming defined ⇒ `landed(P)`) is the **retirement trigger**: `retire`
is enabled exactly at `landed`.

### (4) retirement / archival — preserve, don't delete

`retire(P)` relocates `dir(P)` under `plans/.retired/`, preserving content and git history (a move,
not a delete). Archive semantics are carried by two laws — `content(retire(P)) = content(P)` (no loss)
and `retire(P) ∈ Plans` (still a member) — which a `rm -rf` would violate (`content = ∅`, `∉ Plans`).
This replaces the informal `chore: retire N landed plans` dir-delete with `git mv` +
`chore(plans): retire <plan> (landed)`.

## 4. Residue formalized

The residual `-- plan-retirement: a plan retires once its result lands; commit association is derived
on demand, never stored.` (praxis.ts L54) decomposes into formal laws with **no prose gloss**:

- "retires once its result lands" → `retire(P) defined ⇔ landed(P)` (trigger) + `retire(P) ⇒
phase(P) = retired`.
- "derived on demand" → `landing(P) = c ⇔ lands(c, P)` (a computed function of the VCS predicate).
- "never stored" → `∀ P : stored(P) = ∅`.

t3 deletes L54 and splices §5, then removes `'praxis'` from the self-sufficiency `ALLOW_LIST` (drives
it → ∅; praxis now scans to 0 findings).

## 5. Exact praxis.ts notation to add (deliverable b — spec block, NOT yet applied)

Splice into the existing `FORMAL_BLOCK` sections; **delete L54** (the `-- plan-retirement …` line).
Every added law/derived-set/operation line is **marker-free** (no `--`/`—`), so the self-sufficiency
gate inspects none of them; declaration lines carry only admissible `—` signature / by-value glosses.
Glyphs used are all in `operator-lexicon.ts`; names avoid the task-state atoms (no reuse of `active`).

```
-- add to ── declarations: entities ──
Phase    ≜ { proposed, in-flight, landed, retired }          — a plan's lifecycle phase (plan-level; distinct from States)
Plans    ≜ { P | P a plan on disk }                          — the plan-set : in-scope ∪ archived
commit   ≜ a VCS commit
commits  : P → ℘(commit)                                     — the commits in P's VCS history
lands    : commit × P → 𝔹                                    — c is the trunk merge of P's result
landing  : P ⇀ commit                                        — P's landing-commit, computed from VCS on demand
stored   : P → ℘(commit)                                     — commit refs P persists on disk (sidecar · PLAN.md · content)
archived : P → 𝔹                                             — P's dir resides under plans/.retired/ (folder-as-state)
phase    : P → Phase                                         — runtime plan-phase, derived (no stored field)

-- add to ── declarations: derived sets ──
dispatched(P) ⇔ ∃ t ∈ P : state(t) ∈ { active, completed }
done(P)       ⇔ ∀ t ∈ P : state(t) = completed
landed(P)     ⇔ landing(P) defined ∧ ¬ archived(P)
inscope(P)    ⇔ ¬ archived(P)
nextPhase     ≜ { proposed ↦ in-flight, in-flight ↦ landed, landed ↦ retired, retired ↦ retired }

-- add to ── laws ── (replaces deleted L54)
archived(P)                              ⇒ phase(P) = retired
landed(P)                                ⇒ phase(P) = landed
dispatched(P) ∧ ¬ landed(P) ∧ ¬ archived(P) ⇒ phase(P) = in-flight
¬ dispatched(P) ∧ ¬ archived(P)          ⇒ phase(P) = proposed
landing(P) = c ⇔ lands(c, P)
∀ c, c' : lands(c, P) ∧ lands(c', P) ⇒ c = c'
∀ P : stored(P) = ∅
list = { P ∈ Plans | inscope(P) }
retire(P) defined ⇔ landed(P)
∀ P : content(retire(P)) = content(P)
∀ P : retire(P) ∈ Plans

-- add to ── operations ──
retire    : P ↦ P' ≜ relocate dir(P) under plans/.retired/ ; pre landed(P) ; post phase(P) = retired ∧ content(P') = content(P)
landingOf : P ↦ landing(P)                                   — recompute from VCS each call ; write nothing
```

Gate check per line (why 0 findings): the `—` glosses sit on declaration carriers — signatures
(`x : …`) and by-value `≜`-sets (`Phase`, `Plans`) — which `classifyCarrier` rules admissible; every
law / derived-set / operation line carries no `--`/`—` marker, so `scanFormalBlock` never inspects it.
`retire`/`landingOf` operation bodies use `≜`/`↦` with no marker (same shape as the existing
`start`/`dispatch` lines).

## 6. Mechanism approach for t2 (deliverable c)

- **Home:** `packages/agent-canon/src/toolkit/plan-set.ts` (sibling to `plan-states.ts`), surfaced
  through the praxis skill's affordances / CLI. Add a constant `RETIRED_DIR = '.retired'`.
  `PLAN_STATES` unchanged; ENGINE unchanged.
- **plan-phase (`phase`)** — a readout, no stored field: fold task-folder occupancy →
  `dispatched`/`done`; test `landing` defined; test dir under `.retired/`. Expose `praxis phase <plan>`.
- **membership (`list`)** — dirs directly under `plans/` that contain a `PLAN.md`, `.retired/` skipped
  by dot-prefix. Add `list --retired` to enumerate the archive.
- **landing (`landing` / `landingOf`)** — computed from git each call, never written. t2 selects the
  exact query; recommended: the first trunk commit at which every task-file of P is present under
  `completed/` and P's deliverables have merged (`git log` over `plans/<plan>/`), returned as a sha.
  No cache, no sidecar, no PLAN.md field (enforced by `stored(P) = ∅`).
- **retirement (`retire`)** — precondition `landed(P)`; `git mv plans/<plan> plans/.retired/<plan>`;
  commit `chore(plans): retire <plan> (landed)`. History + content preserved (move, not delete).
  Replaces the `chore: retire N landed plans` dir-delete.

```

```
