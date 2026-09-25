# Role

**Handoff spec for the cratylus builder.** Everything here is decided. Implement it; do not re-derive
it. Where a name is left open it says so explicitly and says how to find it.

## 0. The claim this rests on

**A role is a bundle of expected aspects.** In the world, naming someone an architect tells you how
they reason, what they are accountable for, what they may decide, what they must delegate, and what
they are never asked to do. This is the standard account: a role is the set of expectations attached
to a position (Linton); a person holds a role-set rather than a single role (Merton); incompatible
demands between two held roles are role conflict, a named phenomenon rather than an undefined state.
The corpus adopts that account, because it is what the word already means and a corpus whose roles
mean what roles mean needs no second vocabulary for it.

Two consequences run through everything below.

**`kino` IS an architect — literally, not by analogy.** Anyone acting as an architect carries the
architect bundle, so `kino` and `architect` share a vast commonality by construction rather than by
copying. `kino` holds that role and declares a generative-video domain over it.

**An agent holds exactly ONE role.** A person's role-set is real and situational — the same
practitioner is an architect on one project and an implementer on another — but in this system the
situational switch is modelled by **dispatch**: the situation selects which agent runs, and each
agent is legible as one position. This is not merely simpler. A role is the **contract a peer
dispatches against**: when the architect hands a cut piece to the planner it reasons about the
planner's role to know what comes back. A union of roles is a contract no dispatcher can reason
about. Singular arity also deletes role conflict outright, since two roles can never make
incompatible demands inside one agent.

A role is a **base, not a cap**. Over it an agent may **extend** a set-valued aspect, **override** a
default, or **introduce** a dimension the role never touched. The self-declaration is unbounded in
size — `kino` adds an entire domain. The one limit is the constitutive marking in §2.

## 1. What is true today (census, 2026-09-25)

| fact                                                                                                                                         | site                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `role` is `{ axis: 'Persona', repertoire: 'open', arity: 'scalar' }` — a single token                                                        | `packages/canon/src/manifest.ts:52`                                                   |
| `architect` is the bare token `` `architect` ``; `review` likewise, composed by no agent                                                     | `dimensions/role/architect.ts:3`, `dimensions/role/review.ts:3`                       |
| 7 of 13 role values carry a definiens, in mixed registers — a job (`architect`), an act sequence (`build`), a target (`operate`)             | `dimensions/role/*.ts`                                                                |
| `mav` and `nico` declare the SAME role (`build`) and share almost nothing else                                                               | `agents/mav.ts:34`, `agents/nico.ts:45`                                               |
| `curate ≜ ⟨canonical-corpus⟩` is composed by NO agent, while the actual curator declares `build`                                             | `dimensions/role/curate.ts:3`, `agents/nico.ts:45`                                    |
| `kino` and `architect` agree on **19 of 22** dimensions — differing only on `transparency`, `framing`, `capabilities`, plus the prose fields | `agents/architect.ts:48-118`, `agents/kino.ts:35-124`                                 |
| `kino` states the specialization in a comment and copies the declaration deliberately                                                        | `agents/kino.ts:41-44`                                                                |
| both declare `planning-decomposition` in `capabilities`                                                                                      | `agents/kino.ts:96`, `agents/architect.ts:99`                                         |
| `software-engineering` is absent from both, deliberately, as the delegation boundary                                                         | `agents/architect.ts:94-95`, `agents/kino.ts:86-90`                                   |
| **nothing in the corpus bundles dimension values.** `genus/persona.md` is `kind: structure`, a verbatim prose block — not a bundle           | `packages/canon/src/genus/persona.md:1-9`                                             |
| `select : agent → (DimensionName ⇸ ℘(fragment))` runs before `compose` and `deploy`                                                          | `ENGINE.md:24-25,30`                                                                  |
| per-dimension `arity` (`set` vs `scalar`) already lives in the manifest                                                                      | `packages/canon/src/manifest.ts:49-115`                                               |
| `provenance.mark` is instance-bound and never shared across agents                                                                           | `skills/create-agent/skill.ts:21`                                                     |
| the word `residue` is already taken, with an unrelated meaning                                                                               | `HookCell.residue`, e.g. `hooks/stance-guardrail.ts:13-14`                            |
| `deliver.composition = [design, plan]` — the `plan` cell's text reaches every agent composing `deliver`                                      | `skills/deliver/skill.ts:101`                                                         |
| skill cells deploy corpus-wide; `Agent.skills` projects as `autoloadSkills`, advertising rather than restricting                             | `packages/forge/src/project/index.ts:508-516`, `adapters/omp/render.ts:286-288`       |
| `deliver` declares `validate ⊨ self ⟨¬ delegable⟩` and `validate ⊨ artifact ⟨NEVER r⟩`                                                       | `skills/deliver/skill.ts:62-65`                                                       |
| `deliver` already rejects a return back to `executor(unit)` with the unit still active                                                       | `skills/deliver/skill.ts:68-71`                                                       |
| no witness/reviewer agent cell exists — the corpus holds six agents                                                                          | `packages/canon/src/agents/`                                                          |
| the stance guard judges exactly one dimension, `autonomy`, by quoting `handoff ≜ …` verbatim                                                 | `targets/guardrail/stance-judge-prompt.md:212-215`                                    |
| enrollment is `<scope>/stance/manifest.json`; `gates` is keyed by owning cell and is already plural                                          | `adapters/omp/render.ts:197,434-480`; `targets/guardrail/stance-guardrail.sh:165-185` |

## 2. The three defects

**D1 — the architect elevation is declared only as an absence.** What keeps `architect` and `kino` at
the conceptual rung is the _omission_ of `software-engineering` from `capabilities` plus prose in
`archetype`. An omission is not scoreable: no rubric can quote it, no gate can cite it, and no reader
of the projected Target can tell a deliberate absence from a forgotten one. The delegation of
_decomposition_ is not even an absence — `planning-decomposition` is present, glossed in `kino.ts:89`
as "the decomposition that hands work out", while `deliver` transitively drags the `plan` cell's text
onto the same surface. An agent holding a capability exercises it. Left as-is, `kino` designs,
decomposes itself, and dispatches implementers directly, with every declaration it carries endorsing
that.

**D2 — `validate` is the elevation's own solvent.** `deliver` is right that `validate ⊨ artifact
⟨NEVER r⟩`: an acceptance that read only the return has accepted nothing. But reading artifacts is
reading files — paths, identifiers, call sites — and that is precisely the mechanical work
`architect.ts:53` says "displaces conceptual work". The skill as written obliges the design-holder to
descend into the substrate on every wave, and by wave three the design-holder is a code reviewer with
a lattice it no longer has the context to hold. The acceptance step needs a delegate; the acceptance
itself must not be delegated.

**D3 — a role here is a label, not a bundle.** `role` is `arity: 'scalar'` over single tokens, so the
corpus can _name_ a role and cannot _state_ one. Everything the name should carry must be retyped on
every agent holding it — `kino.ts:41-44` does exactly that, concluding "a specialization is a FULL
cell, so the declaration is copied rather than inherited". That protects a real requirement at the
wrong seam: what must be full is the **Target**, since a harness reads a flat declaration and never a
resolution chain, and `select` runs before `compose`, so a role folded there emits a Target every bit
as flat as today's. The duplication bought nothing and cost 19 of 22 dimensions restated. The anemia
also explains the catalog's incoherence: with no bundle to hold them, the tokens drifted into
different registers, `curate` ended up composed by nobody, and `mav` and `nico` collided on `build`.

## 3. Elevation — the aspect the gate scores

An agent is an **arrow between representational layers**. There is a ladder,
`intent ≺ C ≺ spec ≺ artifact`, and each agent reads at some layers and writes at one.
`elevation(a) ≜ ⟨reads(a), writes(a)⟩` is a **dimension**, and it is **constitutive** on every role
that declares one.

Its power is that **delegation is its theorem, not a list beside it**: an act whose domain or
codomain falls outside an agent's pair is delegated, necessarily and without a second declaration.
`decompose` goes out because it writes spec; `build` goes out because it writes artifact; the
acceptance read goes out because it reads artifact. An act nobody anticipated is still classified
correctly, which a list could never manage. A `delegation` axis is therefore **rejected**: it would
restate a consequence.

The corpus's existing arrows: `plan` is ⟨reads C, writes spec⟩; an implementer is
⟨reads spec, writes artifact⟩; the architect is ⟨reads intent·C, writes C⟩. The one arrow no cell
expresses is `artifact → C`, which is §4.

## 4. The witness — the adjoint of `plan`

`plan` translates **downward** and stamps each unit with `realizes : unit ⇀ anchor`, the concept it
exists to make real. The **witness** translates **upward**: it reads what landed and lifts it back
into `C`, answering one question per concept — was this concept achieved by the artifact that claims
it. Substrate enters the loop at `plan` and leaves it at the witness, and the principal touches
neither end.

So `validate(unit) ⇔ spells ∧ covers ∧ sole` (`skills/deliver/skill.ts:59-61`) is two operations
under one name:

- **lift** — reading the landed artifact and re-deriving which concepts it realizes. Mechanical,
  substrate-bound, high-token, **delegable**.
- **judgment** — deciding what an unachieved concept means: rejection back to the executor, an
  `amend(C)` because execution established a `yield`, or a design that was wrong. Design-bound, **not
  delegable**, exactly as `validate ⊨ self` says.

**What crosses upward is concept-typed.** The witness does not report that a function is misnamed,
that a test is thin, or that a module should be split. It reports: this concept is unachieved, and
which factor of its factorization is uncovered. The principal redispatches the executor with the
conceptual flaw, a loop `deliver` already declares (`skill.ts:68-71`). A **locus** may travel with it
so the redispatch has an address, but a locus is **routed, never read**: the principal forwards it
without interpreting it. Citations are substrate, and handing the principal substrate is D2 in
smaller pieces.

**Why this does not violate `validate ⊨ artifact ⟨NEVER r⟩`.** That law forbids accepting on a claim
from the party that built the thing — one description, a closed loop (`skill.ts:6-12`). Here there
are still two descriptions and two witnesses: the executor holds the spec and not `C`; the witness
holds `C` and not the spec. The artifact read the law demands happens **at the witness**, the one
site in the loop where reading substrate is not a descent, and the claim reaching the principal is in
the only vocabulary the principal can check without descending.

## 5. Units

Order matters only where stated. Acceptance criteria are mechanical.

### U0 · Roles as bundles — DO THIS FIRST

Every other unit is stated against a role and shrinks to one edit once this exists.

Promote `role` out of `MANIFEST`: it is not a dimension, it is a structure **over** dimensions. A
role is a named partial vector — the aspects expected of anyone holding the position — each marked
**constitutive** (what makes the holder that thing) or **default** (typical; the holder may differ).
An agent declares one role and its own values; `select` folds the two **before** `compose`/`deploy`,
so the emitted Target stays as flat as it is today and `kino.ts:41-44`'s real requirement is met at
the seam that actually holds it.

The fold has two operands and a defined precedence, so it needs no ordering rule and no conflict
resolution:

```
role ≜ (DimensionName ⇸ ℘(fragment)) × (DimensionName → {constitutive, default})
       ⟨NAMED · partial · the EXPECTATIONS of anyone holding the position⟩
       ⟨∉ MANIFEST : a role is made OF dimension values ∴ ¬ one of them⟩
role : agent → role ⟨SINGULAR · the contract a PEER dispatches against⟩
own  : agent → (DimensionName ⇸ ℘(fragment)) ⟨what the AGENT declares · ¬ bounded in size⟩
select(a) = role(a) ⊕ own(a)
⊕ ⊨ arity @ manifest ⟨set ⇒ role ∪ own ⟨EXTEND⟩ · scalar ⇒ own if stated ⟨OVERRIDE⟩, else role⟩
d ∉ role(a) ∧ d ∈ own(a) ⇒ INTRODUCE ⟨a dimension the position never spoke to · legitimate⟩
constitutive(role(a), d) ∧ d ∈ own(a) ⇒ REFUSE @ accept
    ⟨naming d, the role, and both values · a holder that may override what CONSTITUTES the position
     does not hold it, and every peer reasoning from the role has been misled⟩
∀ required d : d ∈ select(a) ⟨a role-supplied value satisfies required⟩
provenance.mark ⊭ ⊕ ⟨instance-bound @ create-agent · the HOLDER, ¬ the position⟩
```

`own` is this document's handle for the agent's self-declaration. **Cold-decode the anchor**; it must
not be `residue`, which `HookCell.residue` already holds with an unrelated meaning, nor
`composite`/`extends`/`base`/`mixin`, each of which signifies a lineage this relation does not have.

Constitutive-versus-default is what makes singular arity safe rather than merely simple. If `own`
could override anything, the role would guarantee nothing: `kino` could restate its elevation, stop
being an architect in substance while still declaring the role, and the gate in U6 would score a
contract the agent had already escaped. So `elevation` is constitutive; `framing` and `transparency`
are defaults, which is exactly why `kino` may differ on both and remain an architect.

Non-dimension fields — `description`, `archetype`, `skills` — fold the same way, `skills` set-like
and the prose fields agent-stated over a role-supplied default. `provenance.mark` never folds.

Then write the **architect role** out in full from what `architect.ts` states today: its elevation
(constitutive), `objective`, `autonomy` set, engineering principles, `capabilities`,
`self-evaluation`, `situation-awareness`, `learning`, `skills`. Rewrite **both** `agents/architect.ts`
and `agents/kino.ts` as holders. `architect` becomes near-bare — the role, `framing: systems-thinking`,
`transparency: decision-rationale`, its own prose. `kino` holds the same role and declares
`film-production`, `generative-video`, `framing: user-centered`,
`transparency: provenance-attribution`, its own prose and its mark. Replace the `kino.ts:41-44`
comment with one naming the role and what `kino` declares over it.

**Acceptance.** Neither file restates a value the role supplies unchanged — an override or an
introduction is expected, a copy is the defect being removed. `pnpm project` emits both Targets
**byte-identical** to today's except for what U1 and U3 deliberately change, run as a before/after
diff rather than asserted. An agent overriding a constitutive aspect fails `accept()` with a message
naming the dimension, the role and both values. An agent omitting `provenance.mark` fails rather than
receiving one. No agent declares more than one role.

### U1 · The architect role's elevation aspect

Author the `elevation` value the architect role carries, marked constitutive. It states the pair, the
acts the pair reserves, and — as a consequence rather than a list — what falls outside it. The
builder signifies the final form; these concepts must appear:

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

**Acceptance.** The value names the pair and derives delegation from it rather than listing it;
`pnpm typecheck` and `accept()` pass; the projected `architect` **and `kino`** Targets both carry the
text verbatim, `kino` having gained it by holding the role and not by a second declaration.

### U2 · The witness role's elevation aspect

The arrow no existing value expresses. Constitutive, and signified as the adjoint of `plan`:

```
witness ≜ ⟨reads artifact, writes C⟩ ⟨the ADJOINT of plan : ⟨reads C, writes spec⟩⟩
  holds ⟨C · realizes(unit)⟩ ∧ ∌ spec ⟨two descriptions @ deliver⟩
  answers ⟨spells · covers · sole⟩ @ deliver ↦ achieved : c → 𝔹
  emits ⟨c ∈ C · ¬achieved · uncovered-factor ⟨∈ factors(c)⟩ · locus ⟨address · ¬ excerpt⟩⟩
  ¬ emits ⟨verdict ⟨accept ∉ remit⟩ · mechanism-prose ⟨naming · structure · test-quality⟩⟩
  mechanism-prose ⇒ defect ⟨writes ≠ C ∴ outside the pair · it descends the principal⟩
```

**Acceptance.** As U1, plus: the value names the arrow and both prohibitions; no existing agent's
projection changes, since nothing holds this role until U5.

### U3 · Capability correction — one edit on the role

Remove `planningDecomposition_capabilities` from the architect role, with its import. After U0 that
is the whole unit: every agent holding the role carries the corrected set, and `kino` declares only
the two film capabilities for itself. Delete the now-false comment fragment "the decomposition that
hands work out" wherever U0 left it.

**Acceptance.** Neither projected Target lists planning-decomposition, and only ONE source file was
touched to achieve that — the second Target is the mechanical proof U0 works. `pnpm typecheck` clean;
no unused import.

### U4 · `deliver` names the witness and the lift

Amend the `deliver` formal block (`skills/deliver/skill.ts:23-95`). `validate ⊨ self` and
`validate ⊨ artifact ⟨NEVER r⟩` **stay byte-identical** — they are the laws this unit protects:

```
witness : unit ⇀ agent ⟨role = witness · ∌ spec(unit)⟩
lift : artifact → ℘(C) ⟨what the artifact ACTUALLY realizes · the reverse of plan⟩
achieved(c, unit) ⇔ c ∈ lift(artifact(unit)) ∧ spells ∧ covers ∧ sole
unachieved(unit) ≜ { ⟨c, uncovered-factor(c), locus⟩ | c ∈ realizes(unit) ∧ ¬achieved(c, unit) }
unachieved ⊨ C-typed ⟨the return crosses in C's vocabulary · mechanism-prose ⇒ REFUSE
    ∵ it descends the principal it was dispatched to protect⟩
lift ⊨ artifact ⟨the witness reads FILES · the ONE site in the loop where substrate-reading ¬ descent⟩
witness ⊥ executor ⟨two witnesses, two descriptions : executor holds spec ∧ ∌ C ·
    witness holds C ∧ ∌ spec⟩
validate(unit) ≜ unachieved(unit) = ∅ ⟨the principal JUDGES the lift, ¬ re-reads the artifact⟩
    ⟨the READ is delegable · the VERDICT is ¬ delegable ∵ keyed to C, which the principal alone amends⟩
¬validate(unit) ⇒ redispatch(executor(unit), unachieved(unit)) ⟨the flaw handed down is CONCEPTUAL ·
    locus is ROUTED, ¬ read⟩
```

Extend the closing `deliver ≜ bind → dispatch(wave) → verify → validate → judge → …` so lift and the
witness appear in the sequence.

**Acceptance.** The block parses as `SkillExpression`; the two protected laws are byte-identical to
their current text; the projected `deliver` SKILL.md contains the lift terms and the redispatch law;
the header comment (`skill.ts:6-21`) is extended to explain the read/verdict split and why a third
witness does not reopen the trust defect it closes.

### U5 · The witness agent cell

New `packages/canon/src/agents/<σ*>.ts`. **Cold-decode the name** over its contract — not "reviewer"
by default, and `reviewer` is already a harness built-in, so it must not collide. Decided
constraints:

- holds the **witness role** (U2). Its elevation is `⟨reads artifact, writes C⟩`.
- `capabilities`: substrate reading is its whole job, so `software-engineering` is **present**. This
  is the agent that descends, so the principal does not.
- `objective` / `self-evaluation`: its output is a concept-typed report. Anything rewarding it for a
  verdict, a recommendation, or a code-review narrative is wrong.
- `autonomy`: **not** `principal-self`. It is dispatched, it answers, it returns.
- `guardrails`: `honesty` (required dimension).
- `skills`: `['design']` — it must read the lattice to lift into it. **Not** `deliver`: judging is
  not its remit.
- `description`: must state that it returns unachieved **concepts**, never a verdict and never prose
  about mechanism, so a dispatcher cannot mistake it for a code reviewer.

**Acceptance.** `pnpm project` emits the agent for every harness; the projected description contains
the no-verdict clause; the agent appears in no gate's enrollment it should not.

### U6 · The elevation gate

New hook cell beside `stance-guardrail` / `stance-guardrail-pre`, following
`packages/canon/src/hooks/stance-guardrail-pre.ts` as the structural model — the proven pre-fire
shape, and the only one that can see a mid-turn descent.

- `substrate: 'harness'`, `events: ['subagent.dispatch.pre', <tool-use-pre moment>]`. Descending is a
  mid-turn act; Stop fires after the text and is structurally blind to it.
- Its rubric is a **separate file** at the vendor-neutral `.agents/` root, reached by the derivation
  the existing workers use (`stance-guardrail.sh:87-100`). Do not append to `stance-judge-prompt.md`:
  one gate, one contract, and `gates` in the stance manifest is keyed by owning cell precisely so a
  second guarded dimension is a second entry.
- The rubric **quotes the elevation value verbatim**, exactly as the stance rubric quotes
  `handoff ≜ …`. It scores the declared contract, never an authored opinion about good behaviour. One
  rubric serves every holder of the role, which needs no agent names — the same law the stance guard
  learned when its allowlist drifted and left `kino` unjudged (`packages/canon/CHANGELOG.md:12-18`).
- **BLOCKS**: a dispatch to an implementer for a piece no planner decomposed; an edit or write to
  substrate by an agent whose elevation does not write artifact; a dispatch whose prompt is the
  operator's literal words rather than a cut piece.
- **PASSES**: dispatch to a planner; dispatch to the witness; reading anything; writing what the
  elevation reserves.
- **Fail-open, evidence-checked, re-entry-capped** — inherit all three from the sibling. A block
  whose cited span is not literally in the payload is discarded (`stance-guardrail.sh:485-521`): a
  fabricated block is not a lesser error than a missed one.

**Acceptance.** `pnpm stance-guard:test` passes; the new cell appears as its own entry under `gates`
in `kino`'s projected `stance/manifest.json` alongside the two existing ones; a fixture dispatch of an
undecomposed piece is denied and a dispatch to a planner allowed, both proven against the deployed
artifact.

## 6. Do not

- Do **not** give an agent a second role. Domain expertise is declared by the agent; a situational
  second position is a second AGENT, selected by dispatch.
- Do **not** treat the role as a cap. Extending a set, overriding a default, and introducing an
  untouched dimension are all legitimate and unbounded in size.
- Do **not** let an agent override a constitutive aspect. It fails at `accept()`; the fix is a
  different role, or a role whose author marked that aspect a default.
- Do **not** implement this as inheritance — no `extends`, no parent pointer, no single-base chain,
  no abstract cell nobody dispatches. `architect` is a thin holder exactly as `kino` is.
- Do **not** fold a role at deploy time or leave one unresolved in the Target. A harness reads a flat
  declaration; the fold belongs at `select`, before `compose`.
- Do **not** let `provenance.mark` fold. It is instance-bound, and two agents sharing a mark are
  indistinguishable in the one place an operator reads them.
- Do **not** mint a `delegation` axis. Delegation is a theorem of the elevation pair.
- Do **not** let the witness emit accept/reject, or prose about naming, structure or test quality.
  Either re-descends the principal and defeats the cell's purpose.
- Do **not** let the witness hold the executor's spec. Two descriptions is the whole mechanism.
- Do **not** enforce the elevation by deleting capabilities alone. U3 is necessary and not
  sufficient: an absence cannot be cited by a gate, which is D1.
- Do **not** remove `deliver` from `kino`. Judgment stays with the design-holder; only the read moves.
