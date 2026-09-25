# Elevation

**Handoff spec.** Everything below is decided. The builder implements it; it does not re-derive it.

`elevation` ≜ the rung an agent works at, together with the acts that rung reserves to itself and the
acts it must hand down. It is the concept `architect` and `kino` are built around and the one thing
about them nothing declares, nothing projects, and no gate can score.

**`kino` IS an architect — literally, not by analogy.** A **role is a bundle of expected aspects**:
in the world, naming someone an architect tells you how they reason, what they are accountable for,
what they may decide, what they must delegate, and what they are never asked to do. That is the
standard sociological account — a role is the set of expectations attached to a position (Linton), a
person holds a **role-set** rather than one role (Merton), and incompatible demands between two held
roles are **role conflict**, a named phenomenon rather than an undefined
state. This document adopts that account unreservedly, because it is what the word already means and
because a corpus whose roles mean what roles mean needs no second vocabulary.

It follows that `kino` and `architect` share a vast commonality **by construction**: anyone acting as
an architect carries the architect bundle. `kino` holds that bundle and a second one — the
generative-video production domain. `mav` and `nico` collide on `build` today for the same reason in
reverse: `build` is a _label_, not a bundle, so it cannot separate two agents whose real expectations
differ completely.

**One agent holds exactly ONE role.** A person's role-set is real and situational — the same
practitioner is an architect on one project and an implementer on another, and switches hats within a
day. In this system that situational switch is modelled by **dispatch**, not by a multi-role agent:
the situation selects which agent runs, and each agent is legible as one position. That is not only
simpler, it is what makes collaboration decidable. A role is the **contract a peer relies on** — when
the architect dispatches to the planner it reasons about the planner's role to know what comes back
— and a union of several roles is a contract no dispatcher can reason about. Singular arity also
deletes role conflict outright: two roles can never demand different values of one aspect inside one
agent, because there is only ever one role.

**The relation is COMPOSITION, not inheritance.** `kino` does not derive from `architect`; both hold
the architect role, and what differs is what `kino` **declares for itself** over that role. A role is
a **base, not a cap**: an agent may extend a set-valued aspect, override a default the role supplied,
and introduce dimensions the role never touched. The self-declaration is not required to be small,
and a specialized agent's may be substantial — `kino` adds a whole domain. Domain expertise is
nonetheless not a second role: a structural engineer and a production designer both hold the
architect position and differ in what they know. An is-a lineage would make identity a chain and
force the film domain to become a subclass; holding a role and declaring over it does not. Today a
role in this corpus is a bare scalar token, which is defect D3.

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

**D3 — a role here is a label, not a bundle, so every shared expectation is restated per agent.**
`role` is `arity: 'scalar'` and its values are single tokens (`architect`, `build`, `review`), so the
corpus can _name_ a role and cannot _state_ one. Everything the name is supposed to carry — how the
holder reasons, what it is accountable for, what it may decide, what it must delegate — has to be
retyped on every agent that holds the role. `kino.ts:41-44` does exactly that, deliberately: "a
specialization is a FULL cell, so the declaration is copied rather than inherited". That conclusion
protects a real requirement at the wrong seam. What must be full is the **Target**, since a harness
reads a flat declaration and never a resolution chain, and `select` runs before `compose` and
`deploy`, so a role resolved there emits a Target every bit as flat as today's. The duplication
bought nothing and cost 19 of 22 dimensions restated, with a corpus where fixing what it means to be
an architect means remembering to fix it twice. The anemia is also why the catalog is incoherent:
with no bundle to hold them, the tokens drifted into different registers — a job (`architect`), an
act sequence (`build`), a target (`operate ≜ live-system`) — and `curate` ended up composed by
nobody while the actual curator declares `build`.

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

1. **A role is a BUNDLE of expected aspects, and `role` stops being a scalar dimension.** It is
   promoted out of the dimension catalog entirely: a role is a named partial vector _over_ dimensions,
   one level above them. `elevation` — the pair ⟨reads, writes⟩ over the ladder
   `intent → C → spec → artifact` — becomes one **dimension inside** the architect bundle, alongside
   how the holder reasons, what it is accountable for, and what it may decide. It is the aspect the
   gate scores, and it earns that position because delegation is its theorem: an act whose domain or
   codomain falls outside an agent's declared pair is delegated, necessarily and without a second
   declaration. `delegation` therefore stays rejected as an axis, now for a sharper reason than
   before.
2. **`planning-decomposition` comes off the architect role,** which is one edit reaching every agent
   that holds it. It is the declaration that contradicts the rung. The role keeps `system-design`,
   `research-investigation`, `review-critique`; `kino` declares its two film capabilities for itself.
3. **The elevation gate binds `subagent.dispatch.pre` and a tool-use-pre moment — never `turn.end`.**
   Descending the rung is a mid-turn act: dispatching an implementer where a planner belongs, or editing
   a file at all. Stop fires after the text and is structurally blind to it. This is the same blind spot
   `stance-guardrail-pre` was minted to close.
4. **The gate ships as its own cell with its own rubric at the neutral root.** One gate, one contract.
   `gates` in the stance manifest is keyed by owning cell precisely so a second guarded dimension is a
   second entry. Appending to the 27 kB stance rubric would force every autonomy judgment to carry role
   text it must ignore.
5. **The witness is an agent holding a witness role whose elevation is `⟨artifact, C⟩`,** and its
   return is concept-typed. It performs the reverse translation of `plan`, reports unachieved
   concepts in `C`'s vocabulary, and never returns mechanical prose or a verdict.
6. **An agent holds exactly ONE role and declares its own values over it: `select(a) = role(a) ⊕
own(a)`.** No new primitive is minted and no `composite`/`extends`/`base` anchor is coined: the
   word for a bundle of expected aspects is **role**, and the corpus already has it — anemically. The
   reusable unit was never missing, only never written down. (`own` is this document's handle for the
   agent's self-declaration; the builder cold-decodes the final anchor, and it must **not** be
   `residue`, which `HookCell.residue` already holds with an unrelated meaning.) The role is a base,
   not a cap — `own` may extend, override or introduce. Role aspects are marked **constitutive** or
   **default**: `own` may override a default and may never override a constitutive one, so the
   position keeps the guarantees a peer dispatches against.

## 5. Units

Order matters only where stated. Each unit's acceptance criteria are mechanical.

### U0 · Roles as bundles — DO THIS FIRST

Every other unit below is stated against a role and shrinks to one edit once this exists.

Promote `role` out of `MANIFEST` — it is not a dimension, it is a structure over dimensions. A role
is a named partial vector: the aspects expected of anyone holding the position, each marked
**constitutive** (what makes the holder that thing) or **default** (typical, and the holder may
differ). An agent declares one role and its own values; `select` folds the two **before**
`compose`/`deploy`, so the emitted Target is as flat as it is today and `kino.ts:41-44`'s real
requirement is met at the seam that actually holds it.

The fold has exactly two operands and a defined precedence, so it needs no ordering rule and no
conflict resolution — set-arity aspects union, scalar aspects take the agent's value when it states
one:

```
role ≜ (DimensionName ⇸ ℘(fragment)) × (DimensionName → {constitutive, default})
       ⟨NAMED · partial · the EXPECTATIONS of anyone holding the position⟩
       ⟨∉ MANIFEST : a role is made OF dimension values ∴ ¬ one of them⟩
role : agent → role ⟨SINGULAR · the contract a PEER dispatches against⟩
own : agent → (DimensionName ⇸ ℘(fragment)) ⟨what the AGENT declares · ¬ bounded in size⟩
select(a) = role(a) ⊕ own(a)
⊕ ⊨ arity @ manifest ⟨set ⇒ role ∪ own ⟨EXTEND⟩ · scalar ⇒ own if stated ⟨OVERRIDE⟩, else role⟩
d ∉ role(a) ∧ d ∈ own(a) ⇒ INTRODUCE ⟨a dimension the position never spoke to · legitimate⟩
constitutive(role(a), d) ∧ d ∈ own(a) ⇒ REFUSE @ accept
    ⟨naming d, the role, and both values · a holder that may override what CONSTITUTES the position
     does not hold it, and every peer reasoning from the role has been misled⟩
∀ required d : d ∈ select(a) ⟨a role-supplied value satisfies required⟩
provenance.mark ⊭ ⊕ ⟨instance-bound @ create-agent · the HOLDER, ¬ the position⟩
```

**Constitutive-versus-default is the load-bearing distinction, and it is what makes singular arity
safe rather than merely simple.** If `own` could override anything, the role would guarantee
nothing: `kino` could quietly restate its elevation and stop being an architect while still declaring
the role, and the gate in U6 — which scores the role's elevation — would be scoring a claim the agent
had already escaped. So `elevation` is constitutive on every role that has one. `framing` and
`transparency` are defaults, which is exactly why `kino` may differ on both without ceasing to be an
architect.

Non-dimension fields — `description`, `archetype`, `skills` — fold the same way, with `skills`
set-like and the prose fields agent-stated over a role-supplied default. `provenance.mark` never
folds: it belongs to the holder, not the position, and shared marks make two agents indistinguishable
in a transcript.

Then write the **architect role** out in full from what `architect.ts` states today — its elevation
(constitutive), `objective`, `autonomy` set, engineering principles, `capabilities`,
`self-evaluation`, `situation-awareness`, `learning`, `skills` — and rewrite **both**
`agents/architect.ts` and `agents/kino.ts` as holders of it. `architect` becomes near-bare: the role,
`framing: systems-thinking`, `transparency: decision-rationale` and its own prose. `kino` holds the
same role and declares `film-production`, `generative-video`, `framing: user-centered`,
`transparency: provenance-attribution`, its own prose and its mark. Neither file restates a shared
expectation. Replace the `kino.ts:41-44` comment, which argued for the copy, with one naming the role
and what `kino` declares over it.

**Acceptance.** Neither `architect.ts` nor `kino.ts` restates a value the role already supplies
unchanged — an override or an introduction is expected, a copy is the defect being removed;
`pnpm project` emits both Targets **byte-identical** to today's except for what U1/U3 deliberately
change — run as a before/after diff, not asserted; an agent overriding a constitutive aspect fails
`accept()` with a message naming the dimension, the role and both values; an agent omitting
`provenance.mark` fails rather than receiving one; no agent declares more than one role.

### U1 · The architect role's elevation aspect

Author the `elevation` dimension value that the architect role carries. It states the pair, the acts
the pair reserves, and — as a consequence rather than a list — what falls outside it. Authored
**once** and named **once**, by the architect role, so `kino` states nothing
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

### U2 · The witness role's elevation aspect — the adjoint of `plan`

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

### U3 · Capability correction — one edit on the role

Remove `planningDecomposition_capabilities` from the architect role, with its import.
After U0 that is the whole unit: every agent holding it carries the corrected set, and `kino` declares
only the two film capabilities for itself. Delete the now-false comment fragment "the
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
- Do **not** resolve a role at deploy time or leave one unresolved in the Target. A harness reads
  a flat declaration; the fold belongs at `select`, before `compose`.
- Do **not** implement this as inheritance — no `extends`, no parent pointer, no single-base chain,
  and no abstract cell nobody dispatches. An agent holds one role and declares over it; `architect`
  is a thin holder exactly as `kino` is.
- Do **not** give an agent a second role to carry domain expertise. Domain is declared by the agent;
  a situational second position is a second AGENT, selected by dispatch.
- Do **not** treat the role as a cap on what an agent may declare. It is a base: extending a set,
  overriding a default, and introducing an untouched dimension are all legitimate.
- Do **not** let an agent override a constitutive aspect. It fails at `accept()`, and the fix is
  either a different role or a role whose author marked that aspect a default.
- Do **not** let `provenance.mark` compose. It is instance-bound, and two agents sharing a mark are
  indistinguishable in the one place an operator reads them.
- Do **not** treat `kino` as a second rung with its own elevation laws. It is the same elevation
  composed with another concern, which is the point of D3.
