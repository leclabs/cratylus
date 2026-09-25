# Elevation

**Handoff spec.** Everything below is decided. The builder implements it; it does not re-derive it.

`elevation` ≜ the rung an agent works at, together with the acts that rung reserves to itself and the
acts it must hand down. It is the concept `architect` and `kino` are built around and the one thing
about them nothing declares, nothing projects, and no gate can score.

**`kino` IS an architect.** Read this document that way throughout. The two are separate agent cells
mechanically, and `kino` is not a second rung: it holds the **architect elevation** and adds the
concerns of generative-video production. Every law below about that elevation — what it reserves,
what it delegates, what the gate scores — is one law stated once and holding for every agent that
composes it. Where the document names the two separately it is naming two compositions sharing a
concern, never two concepts.

**The relation is COMPOSITION, not inheritance.** `kino` does not derive from `architect`; both
compose the same elevation. This is not a stylistic preference — an is-a lineage admits one parent
and makes identity a chain, while the whole point is that a persona carries several **orthogonal**
concerns at once and may compose a new one without being re-parented. Inheritance would also be an
import: `compose` is already this corpus's only assembly operator, for agents, skills and hooks
alike, and `first-principles ⟨¬inherit source-framing⟩` forbids borrowing an OOP relation to sit
beside it. Today that composition has no home above the single dimension value, which is defect D3.

## 1. What is true today (census, 2026-09-25)

| fact                                                                                                                                                                                                                  | site                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `role` is `{ axis: 'Persona', repertoire: 'open', arity: 'scalar' }`                                                                                                                                                  | `packages/canon/src/manifest.ts:52`                                                      |
| `architect` is the bare token `` `architect` `` — no definiens                                                                                                                                                        | `packages/canon/src/dimensions/role/architect.ts:3`                                      |
| `review` is the bare token `` `review` `` — no definiens, composed by no agent                                                                                                                                        | `packages/canon/src/dimensions/role/review.ts:3`                                         |
| roles carrying a definiens already exist (`build`, `plan`, `curate`, `test`, `operate`, …)                                                                                                                            | same directory                                                                           |
| `mav` and `nico` declare the SAME role (`build`) and share almost nothing else — role does not separate them                                                                                                          | `agents/mav.ts:34`, `agents/nico.ts:45`                                                  |
| `curate ≜ ⟨canonical-corpus⟩` is composed by NO agent, while the corpus's actual curator declares `build`                                                                                                             | `dimensions/role/curate.ts:3`, `agents/nico.ts:45`                                       |
| the role catalog mixes registers — a job (`architect`), an act sequence (`build`), a target (`operate ≜ live-system`) — the tell of a folk category                                                                   | `dimensions/role/*.ts`                                                                   |
| `kino` and `architect` both declare `skills: ['design','deliver']`, `role: architect`                                                                                                                                 | `agents/kino.ts:45-46`, `agents/architect.ts:59-60`                                      |
| both also declare `planning-decomposition` in `capabilities`                                                                                                                                                          | `agents/kino.ts:96`, `agents/architect.ts:99`                                            |
| `software-engineering` is absent from both, deliberately, as the delegation boundary                                                                                                                                  | `agents/architect.ts:94-95`, `agents/kino.ts:86-90`                                      |
| `deliver.composition = [design, plan]` — the `plan` cell's text reaches every agent composing `deliver`                                                                                                               | `skills/deliver/skill.ts:101`                                                            |
| skill cells deploy corpus-wide; `Agent.skills` projects as `autoloadSkills` and advertises rather than restricts                                                                                                      | `packages/forge/src/project/index.ts:508-516`, `adapters/omp/render.ts:286-288`          |
| `deliver` declares `validate ⊨ self ⟨¬ delegable⟩`                                                                                                                                                                    | `skills/deliver/skill.ts:64-65`                                                          |
| `deliver` declares `validate ⊨ artifact ⟨NEVER r⟩`                                                                                                                                                                    | `skills/deliver/skill.ts:62-63`                                                          |
| no `reviewer` agent cell exists                                                                                                                                                                                       | `packages/canon/src/agents/` holds six: architect, implementer, kino, mav, nico, planner |
| the stance guard judges exactly one dimension — `autonomy` — by quoting `handoff ≜ …` verbatim                                                                                                                        | `targets/guardrail/stance-judge-prompt.md:212-215`                                       |
| enrollment is `<scope>/stance/manifest.json`; `gates` is keyed by owning cell and is already plural                                                                                                                   | `adapters/omp/render.ts:197,434-480`; `targets/guardrail/stance-guardrail.sh:165-185`    |
| `kino` restates `architect`, a relation carried by nothing but a comment                                                                                                                                              | `agents/kino.ts:41-44`                                                                   |
| the two cells agree on **19 of 22** dimensions; they differ only on `transparency`, `framing`, and `capabilities` (kino = architect's four + two film), plus the non-dimension `archetype`/`description`/`provenance` | `agents/architect.ts:48-118` vs `agents/kino.ts:35-124`                                  |
| `genus/persona.md` is `kind: structure`, a verbatim PROSE block every agent Target carries — a shared block, NOT a bundle of dimension values                                                                         | `packages/canon/src/genus/persona.md:1-9`                                                |
| **no cell anywhere bundles dimension values.** Role values with a definiens (`build`, `plan`, `curate`, `operate`, `test`, `converse`, `document`) enumerate ACTS inside one signifier; they compose nothing          | `packages/canon/src/dimensions/role/*.ts`                                                |
| `select : agent → (DimensionName ⇸ ℘(fragment))` — composition is already a per-dimension map                                                                                                                         | `ENGINE.md:24-25`                                                                        |
| `arity` per dimension (`set` vs `scalar`) already lives in the manifest                                                                                                                                               | `packages/canon/src/manifest.ts:49-115`                                                  |
| `provenance.mark` is instance-bound and never shared across agents                                                                                                                                                    | `skills/create-agent/skill.ts:21`                                                        |

## 2. The three defects

**D1 — elevation is declared only as an absence.** What keeps `architect` and `kino` at the conceptual
rung is the _omission_ of `software-engineering` from `capabilities` plus prose in `archetype`. An
omission is not scoreable: no rubric can quote it, no gate can cite it, and no reader of the projected
Target can tell a deliberate absence from a forgotten one. The delegation of _decomposition_ is not
even an absence — `planning-decomposition` is present, glossed in `kino.ts:89` as "the decomposition
that hands work out", while `deliver` transitively drags the `plan` cell's own text onto the same
surface. An agent holding a capability exercises it. Left as-is, `kino` designs, decomposes itself,
and dispatches implementers directly, with every declaration it carries endorsing that.

**D2 — `validate` is the elevation's own solvent.** `deliver` is right that `validate ⊨ artifact
⟨NEVER r⟩`: an acceptance that read only the return has accepted nothing. But reading artifacts is
reading files — paths, identifiers, call sites — and that is precisely the mechanical work
`architect.ts:53` says "displaces conceptual work". The skill as written obliges the design-holder to
descend into the substrate on every wave, and by wave three the design-holder is a code reviewer with
a lattice it no longer has the context to hold. The operator's instinct is correct: the acceptance
step needs a delegate. What is _not_ correct is delegating the acceptance.

**D3 — composition stops at the dimension value, so every shared concern is restated per agent.** The
corpus composes fragments into an agent (`ENGINE.md:24`), skills into skills
(`skills/deliver/skill.ts:101`), and hook cells into scopes — but it has no name for **a bundle of
dimension values that travel together as one concern**. The architect elevation is such a bundle: an
elevation pair, a `self-evaluation`, a capability set defined as much by what it excludes, and the principles
that hold it. Because that bundle is unnamed, the only way to give it to a second agent is to retype
it, which `kino.ts:41-44` does deliberately — "a specialization is a FULL cell, so the declaration is
copied rather than inherited". That conclusion protects a real requirement at the wrong seam: what
must be full is the **Target**, since a harness reads a flat declaration and never a resolution
chain, and `select` runs before `compose` and `deploy`, so a composite resolved there emits a Target
every bit as flat as today's. The duplication bought nothing and cost 19 of 22 dimensions restated,
with a corpus where fixing the architect's elevation means remembering to fix it twice. This document
was written into the same defect — every unit below said "`kino` and `architect`" where one composite
would do.

## 3. The cut that resolves D2 — the adjoint of `plan`

`plan` translates **downward**: it takes a cut piece of `C` and emits execution specs, so each unit
carries `realizes : unit ⇀ anchor` — the concept it exists to make real. The witness performs the
**reverse translation**: it reads what landed and lifts it back into `C`, answering one question per
concept — was this concept achieved by the artifact that claims it. `plan` is `C → specs`; the witness
is `artifacts → C`. That adjointness is the whole design, and it is what keeps the boundary clean: the
substrate enters the loop at `plan` and leaves it at the witness, and the principal touches neither end.

So `validate(unit) ⇔ spells ∧ covers ∧ sole` (`skills/deliver/skill.ts:59-61`) is two operations
wearing one name:

- **lift** — reading the landed artifact and re-deriving which concepts it actually realizes.
  Mechanical, substrate-bound, high-token, and **delegable**.
- **judgment** — deciding what an unachieved concept means: rejection back to the executor, an
  `amend(C)` because execution established a `yield`, or a design that was wrong. Design-bound and
  **not delegable**, exactly as `validate ⊨ self` says.

**What crosses the boundary upward is concept-typed, never prose about mechanism.** The witness does
not report that a function is misnamed, that a test is thin, or that a module should be split. It
reports: this concept is unachieved, and which part of its own factorization is uncovered. The
principal receives a set of concepts and redispatches the executor with the conceptual flaw — a loop
`deliver` already declares (`skill.ts:68-71`: a rejected return goes back to `executor(unit)` and the
unit stays active). What is new is the _content_ of the rejection: concepts, not review comments.

This supersedes an earlier framing in which the witness returned `path:line` citations. Citations are
substrate, and handing the principal substrate is the defect D2 names, merely in smaller pieces. The
witness may cite a **locus** so a redispatch has an address, but a locus is _routed_, never _read_: the
principal forwards it to the executor without interpreting it.

**Why this does not violate `validate ⊨ artifact ⟨NEVER r⟩`.** That law forbids accepting on a claim
by the party that built the thing — one description, a closed loop, `skill.ts:6-12`. Here there are
still two descriptions and two witnesses. The executor holds the spec and asserts `verify`. The witness
holds `C` and the artifact, does not hold the spec, and has no stake in the unit passing; the artifact
read that the law demands happens _at the witness_, which is the only place in the loop where reading
substrate is not a descent. The claim reaching the principal is expressed in `C`'s own vocabulary,
which is the one language the principal can check without descending.

## 4. Decided calls — implement these, do not relitigate

1. **The concept is a STRATUM, not a role, and it is minted as its own axis.** An agent is an arrow
   between representational layers — it reads one and writes another — and `elevation` is the pair
   ⟨reads, writes⟩ over the ladder `intent → C → spec → artifact`. `role` is the folk name for the
   _product_ of that arrow with the agent's subject matter, which is why the catalog cannot separate
   `mav` from `nico` (both `build`) and why `curate ≜ ⟨canonical-corpus⟩` sits unused while the actual
   curator declares something else. Delegation is **not** a second axis and stays rejected for the
   original reason — it is a theorem of the stratum: an act whose domain or codomain lies outside an
   agent's declared pair is delegated, necessarily and without a second declaration. `role` survives
   as the label it already is; nothing about elevation is homed in it.
2. **`planning-decomposition` comes off the architect-elevation composite,** which is one edit
   reaching every agent that composes it. It is the declaration that contradicts the rung. The
   composite keeps `system-design`, `research-investigation`, `review-critique`; `kino` keeps its two
   minted film capabilities in its own generative-video composite.
3. **The elevation gate binds `subagent.dispatch.pre` and a tool-use-pre moment — never `turn.end`.**
   Descending the rung is a mid-turn act: dispatching an implementer where a planner belongs, or editing
   a file at all. Stop fires after the text and is structurally blind to it. This is the same blind spot
   `stance-guardrail-pre` was minted to close.
4. **The gate ships as its own cell with its own rubric at the neutral root.** One gate, one contract.
   `gates` in the stance manifest is keyed by owning cell precisely so a second guarded dimension is a
   second entry. Appending to the 27 kB stance rubric would force every autonomy judgment to carry role
   text it must ignore.
5. **The witness is an agent cell carrying the `⟨artifact, C⟩` elevation, and its return is concept-typed.** It performs
   the reverse translation of `plan`, reports unachieved concepts in `C`'s vocabulary, and never
   returns mechanical prose or a verdict.
6. **The reusable unit is a named partial selection — a COMPOSITE — and an agent composes any number
   of them.** Not a parent, not an `extends`, not a base class. `select` already has the type
   (`DimensionName ⇸ ℘(fragment)`, `ENGINE.md:24`), so a composite is a named partial value of that
   same type and `select(a)` becomes the ⊕-fold of everything `a` composes plus what `a` says for
   itself. The operation is associative and order-free, which is what makes orthogonal concerns
   combinable: `kino` composes the architect elevation **and** a generative-video concern, and a
   third concern later is a third entry, not a re-parenting. No abstract base cell is minted, and
   `architect` the agent becomes exactly what `kino` is — a thin cell composing the elevation.

## 5. Units

Order matters only where stated. Each unit's acceptance criteria are mechanical.

### U0 · Composites — DO THIS FIRST

Every other unit below is stated against a composite and shrinks to one edit once this exists.

A **composite** is a named partial selection: a bundle of dimension values that travel together as
one concern, of the same type `select` already returns. An agent declares the composites it carries
and the values it states for itself; `select` folds them **before** `compose`/`deploy`, so the
emitted Target is as flat as it is today and `kino.ts:41-44`'s real requirement is met at the seam
that actually holds it. (The builder cold-decodes the anchor for this concept; `composite` is this
document's working handle, and it must not be `extends`, `base`, `parent` or `mixin`, each of which
signifies a lineage this relation does not have.)

`⊕` is governed by the `arity` the manifest already carries — no second table, no per-dimension
special cases:

```
composite ≜ (DimensionName ⇸ ℘(fragment)) ⟨NAMED · partial · the type select RETURNS⟩
composes : agent → [composite] ⟨any number · orthogonal concerns⟩
own : agent → (DimensionName ⇸ ℘(fragment)) ⟨what the agent states for itself⟩
select(a) = (⊕ composes(a)) ⊕ own(a)
⊕ ⊨ arity @ manifest ⟨arity(d) = set ⇒ ∪ · arity(d) = scalar ⇒ see collision⟩
⊕ associative ∧ ⊕ order-free ⟨∄ precedence by position · a last-wins rule would make composition
    ORDER-SENSITIVE and silently resolve a conflict the corpus should be told about⟩
collision ⇔ ∃ scalar d : |⊕(d)| > 1 ∧ d ∉ own(a)
collision ⇒ REFUSE @ accept ⟨naming d, the composites, and the values⟩
    ⟨remedy : own(a)(d) states the value EXPLICITLY ⟨⊕σ* where the concept is genuinely combined⟩
     ∨ arity(d) is wrong ∧ the CATALOG is amended ⟨a deliberate act, ¬ an implicit merge⟩⟩
∀ required d : d ∈ select(a) ⟨a composed value satisfies required · an unconfined agent is still unconfined⟩
provenance.mark ⊭ ⊕ ⟨instance-bound @ create-agent · every agent declares its OWN⟩
```

**The scalar collision rule is the load-bearing part, and it is what makes "multiple roles" an
answerable question rather than an undefined one.** Composing two composites that each name a `role`
is not silently merged and not resolved by declaration order: it fails at `accept()` naming both
values. Two concerns colliding on a scalar are, by definition, not orthogonal, and the corpus says so
at build time. The agent then either states the combined value itself — authored as `⊕σ*`, which the
prime principle already permits for a genuinely combined concept — or the collision is evidence that
the dimension's `arity` is wrong and the catalog is amended deliberately.

Non-dimension fields — `description`, `archetype`, `skills` — compose the same way, with `skills`
set-like and the two prose fields agent-stated (a composite may supply a default; two composites
supplying different ones is a collision). `provenance.mark` never composes: it is instance-bound by
`skills/create-agent/skill.ts:21` and shared marks make two agents indistinguishable in a transcript.

Then mint the **architect-elevation composite** from what `architect.ts` states today — its elevation,
`objective`, `autonomy` set, engineering principles, `capabilities`, `self-evaluation`,
`situation-awareness`, `learning`, `skills` — and rewrite **both** `agents/architect.ts` and
`agents/kino.ts` as compositions of it. `architect` adds `framing: systems-thinking`,
`transparency: decision-rationale` and its own prose; `kino` composes the same elevation plus a
generative-video composite carrying `film-production`, `generative-video`, `framing: user-centered`
and `transparency: provenance-attribution`, and adds its own prose and mark. Neither file restates a
shared value. Replace the `kino.ts:41-44` comment, which argued for the copy, with one naming the
composites.

**Acceptance.** Neither `architect.ts` nor `kino.ts` states any dimension the other also states;
`pnpm project` emits both Targets **byte-identical** to today's except for what U1/U3 deliberately
change — run as a before/after diff, not asserted; a scalar collision fails `accept()` with a message
naming the dimension, the composites and the conflicting values; reordering `composes` changes no
emitted byte; an agent omitting `provenance.mark` fails rather than receiving one.

### U1 · The architect stratum, authored as its own value

Author the elevation value on the new axis (U0 decides its catalog home; it is **not**
`dimensions/role/architect.ts`, which stays the bare job label it is). The value states the pair, the
acts the pair reserves, and — as a consequence rather than a list — what falls outside it. It is
authored **once** and named **once** by the architect-elevation composite, so `kino` states nothing
of its own about elevation; its elevation is not its own. Shape (the builder signifies the final
form; these are the concepts that must appear):

```
stratum ≜ ⟨intent ≺ C ≺ spec ≺ artifact⟩ ⟨the ladder · ≺ = more-abstract-than⟩
elevation(a) ≜ ⟨reads(a), writes(a)⟩ ⟨an agent IS an arrow between layers⟩

architect ≜ ⟨reads ⟨intent · C⟩, writes C⟩
  reserves ⟨author(C) · cut(C) · amend(C) · judge ⟨the DECISION on a lifted return⟩⟩
  ∀ act : domain(act) ⊀ reads ∨ codomain(act) ≠ writes ⇒ DELEGATED
    ⟨∴ decompose ⟨C → spec⟩ ↦ planner · build ⟨spec → artifact⟩ ↦ implementer ·
      lift ⟨artifact → C⟩ ↦ witness — DERIVED, ¬ enumerated⟩
  descent ≜ performing an act outside the pair ⟨defect · ¬ diligence⟩
```

The delegation line is the reason this is a stratum and not a list: `planner`, `implementer` and
`witness` appear as _consequences_ of the pair, so an act nobody anticipated is still correctly
classified. A role value could only ever have enumerated them.

**Acceptance.** The value names the pair and derives delegation from it rather than listing it;
`pnpm typecheck` and the corpus `accept()` gate pass; the projected `architect` **and `kino`** Targets
both carry the text verbatim, with `kino` having gained it by composition and not by a second
declaration.

### U2 · The witness stratum, the adjoint of `plan`

The witness's elevation is the arrow no existing value expresses: `artifact → C`. Authored on the
same axis as U1, it is the **adjoint of `plan`** (`C → spec`) and must be signified as such:

```
witness ≜ ⟨reads artifact, writes C⟩ ⟨the ADJOINT of plan : ⟨reads C, writes spec⟩⟩
  holds ⟨C · realizes(unit)⟩ ∧ ∌ spec ⟨two descriptions @ deliver⟩
  answers ⟨spells · covers · sole⟩ @ deliver ↦ achieved : c → 𝔹
  emits ⟨c ∈ C · ¬achieved · uncovered-factor ⟨∈ factors(c)⟩ · locus ⟨address · ¬ excerpt⟩⟩
  ¬ emits ⟨verdict ⟨accept ∉ remit⟩ · mechanism-prose ⟨naming · structure · test-quality⟩⟩
  mechanism-prose ⇒ defect ⟨writes ≠ C ∴ outside the pair · it descends the principal⟩
```

**Acceptance.** As U1, plus: the value names the arrow and both prohibitions; no existing agent's
projection changes (nothing carries this elevation until U5).

### U3 · Capability correction — one edit on the composite

Remove `planningDecomposition_capabilities` from the architect-elevation composite, with its import.
After U0 that is the whole unit: every agent composing it carries the corrected set, and `kino`'s own
composite names only the two film capabilities. Delete the now-false comment fragment "the
decomposition that hands work out" wherever U0 left it.

**Acceptance.** Neither projected Target lists planning-decomposition, and only ONE source file was
touched to achieve that — the second is the mechanical proof U0 works; `pnpm typecheck` clean; no
unused import.

### U4 · `deliver` names the witness and the lift

Amend the `deliver` formal block (`skills/deliver/skill.ts:23-95`). `validate ⊨ self` and
`validate ⊨ artifact ⟨NEVER r⟩` **stay verbatim** — they are the laws this unit protects. Add the
witness, the lift, and the typed return:

```
witness : unit ⇀ agent ⟨role = review · ∌ spec(unit)⟩
lift : artifact → ℘(C) ⟨what the artifact ACTUALLY realizes · the reverse of plan⟩
achieved(c, unit) ⇔ c ∈ lift(artifact(unit)) ∧ spells ∧ covers ∧ sole
unachieved(unit) ≜ { ⟨c, uncovered-factor(c), locus⟩ | c ∈ realizes(unit) ∧ ¬achieved(c, unit) }
unachieved ⊨ C-typed ⟨the return crosses the boundary in C's vocabulary · mechanism-prose ⇒ REFUSE
    ∵ it descends the principal it was dispatched to protect⟩
lift ⊨ artifact ⟨the witness reads FILES · the ONE site in the loop where substrate-reading ¬ descent⟩
witness ⊥ executor ⟨two witnesses, two descriptions : executor holds spec ∧ ∌ C · witness holds C ∧ ∌ spec⟩
validate(unit) ≜ unachieved(unit) = ∅ ⟨the principal JUDGES the lift, ¬ re-reads the artifact⟩
    ⟨the READ is delegable · the VERDICT is ¬ delegable ∵ keyed to C, which the witness reports IN ∧
     the principal alone may amend⟩
¬validate(unit) ⇒ redispatch(executor(unit), unachieved(unit)) ⟨the flaw handed down is CONCEPTUAL ·
    locus is ROUTED, ¬ read⟩
```

and extend the closing line `deliver ≜ bind → dispatch(wave) → verify → validate → judge → …` so lift
and the witness appear in the sequence.

**Acceptance.** The block still parses as `SkillExpression`; `validate ⊨ self` and `NEVER r` are
byte-identical to their current text; the projected `deliver` SKILL.md contains the lift terms and the
redispatch law; the header comment block (`skill.ts:6-21`) is extended to explain the read/verdict
split and why a third witness does not reopen the trust defect it closes.

### U5 · The witness agent cell

New `packages/canon/src/agents/<σ*>.ts`. **The builder names it** by cold decode over its contract —
it is not "reviewer" by default, and `reviewer` is already a harness built-in, so the name must not
collide. Vector constraints that are decided:

- elevation `⟨reads artifact, writes C⟩` (U2). Its `role` stays the plain job label it always was.
- `capabilities`: substrate reading is its whole job, so `software-engineering` is **present** here —
  this is the agent that descends, so the principal does not.
- `objective` / `self-evaluation`: its output is a concept-typed report; anything rewarding it for a
  verdict, a recommendation, or a code-review narrative is wrong.
- `autonomy`: **not** `principal-self`. It is dispatched, it answers, it returns.
- `guardrails`: `honesty` (required dimension).
- `skills`: `['design']` — it must read the lattice to lift into it, and it runs no loop of its own.
  It does **not** carry `deliver`: judging is not its remit.
- `description`: must state that it returns unachieved **concepts**, never a verdict and never prose
  about mechanism, so a dispatching agent cannot mistake it for a code reviewer.

**Acceptance.** `pnpm project` emits the agent for every harness; the projected description contains
the no-verdict clause; the agent appears in no gate's enrollment it should not.

### U6 · The elevation gate

New hook cell beside `stance-guardrail` / `stance-guardrail-pre`, following
`packages/canon/src/hooks/stance-guardrail-pre.ts` as the structural model — it is the proven pre-fire
shape and the only one that can see a mid-turn descent.

- `substrate: 'harness'`, `events: ['subagent.dispatch.pre', <tool-use-pre moment>]`.
- Its rubric is a **separate file** deployed to the vendor-neutral `.agents/` root, reached by the same
  derivation the existing workers use (`stance-guardrail.sh:87-100`).
- The rubric **quotes the elevation value verbatim**, exactly as the stance rubric quotes `handoff ≜ …`.
  It scores the declared contract, never an authored opinion about good behaviour. One rubric serves
  every agent composing the elevation: `architect` and `kino` resolve to the same value, so the
  gate needs no knowledge of either name — which is the same law the stance guard learned when its
  agent allowlist drifted (`packages/canon/CHANGELOG.md:12-18`).
- It BLOCKS: a dispatch to an implementer for a piece that was never decomposed by a planner; an edit
  or write to substrate by an agent whose role declares `delegates ⟨build⟩`; a dispatch whose prompt is
  the operator's literal words rather than a cut piece.
- It PASSES: dispatch to a planner; dispatch to the U5 witness; reading anything; writing design
  artifacts the role reserves.
- **Fail-open, evidence-checked, re-entry-capped** — inherit all three from the sibling. A block whose
  cited span is not literally in the payload is discarded (`stance-guardrail.sh:485-521`), and the
  reason is recorded there in full: a fabricated block is not a lesser error than a missed one.

**Acceptance.** `pnpm stance-guard:test` still passes; the new cell appears as its own entry under
`gates` in `kino`'s projected `stance/manifest.json` alongside the two existing ones; a fixture dispatch
of an undecomposed piece is denied and a dispatch to a planner is allowed, both proven against the
deployed artifact.

## 6. Do not

- Do **not** home elevation in `role`, and do **not** mint a `delegation` axis. Elevation is a
  stratum pair; delegation is its theorem, never a second declaration.
- Do **not** let the witness emit accept/reject, or prose about naming, structure or test quality.
  Either one re-descends the principal and defeats the cell's purpose (`skill.ts:9-12`).
- Do **not** let the witness hold the executor's spec. Two descriptions is the whole mechanism.
- Do **not** bind the elevation gate to `turn.end`. It cannot see the act.
- Do **not** append to `stance-judge-prompt.md`.
- Do **not** try to enforce elevation by deleting capabilities alone. U3 is necessary and is not
  sufficient: an absence cannot be cited by a gate, which is defect D1.
- Do **not** remove `deliver` from `kino`. Judgment stays with the design-holder; only the read moves.
- Do **not** resolve composites at deploy time or leave one unresolved in the Target. A harness reads
  a flat declaration; the fold belongs at `select`, before `compose`.
- Do **not** implement this as inheritance — no `extends`, no parent pointer, no single-base chain,
  and no abstract cell nobody dispatches. An agent composes N orthogonal concerns; `architect` is a
  thin composition exactly as `kino` is.
- Do **not** resolve a scalar collision by declaration order or by last-wins. It fails at `accept()`,
  and the fix is an explicit value or an arity the catalog amends deliberately.
- Do **not** let `provenance.mark` compose. It is instance-bound, and two agents sharing a mark are
  indistinguishable in the one place an operator reads them.
- Do **not** treat `kino` as a second rung with its own elevation laws. It is the same elevation
  composed with another concern, which is the point of D3.
