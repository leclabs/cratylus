# Cratylism sweep — execution specs

> Working handle, **not** an anchor. Reader = LLM. Every claim below was verified against the tree
> before it was written here; the counts are mine, not inherited.

Tests `∀ authored-surface ⟨σ* ∨ ⊕σ* · prose ≡ identifier ≡ path⟩` — the generalized `cratylism`
landed in `a2205eb`. **Not honored.** One failure shape dominates:

> **THE CORRECTION WAS WRITTEN INTO THE PROSE AND NEVER INTO THE SIGN.**

In most findings the discovered sign is already present — in a comment, an import alias, an error
string — and is simply not the one on the export or the path. `C4` is the extreme case: the source
comment explains the collision across fifteen lines while the collision persists three feet away.

**Structural root cause:** identifiers get renamed under type-check pressure; prose, paths, CLI
strings and help text carry **no forcing function**. Defects cluster where a sign was minted before
its concept settled and the referent later moved.

**Discipline for every item below: no candidate names are supplied.** Supplying them biases the
argmin — `llm-native`'s `¬leading-candidate-set` binds the fix as much as the audit.

---

## C0 — extend the density gate's reach — ✅ **LANDED 2026-08-04** (`979fa021`)

> **Reach: fixed and asserted. Detector: untouched — both halves of the normalization complaint died
> under checking.** One conviction, fixed not pinned. Controls verified by injection. Suite green
> uncached; render oracle unchanged. **§4 (a declared home for the message a hook speaks to an agent)
> is the one part deferred** — it is a model change, not a test change, and is filed below.
>
> The audit trail is kept in full rather than rewritten to match the outcome: the spec was right about
> reach, wrong about its own flagship exhibit, and my first replacement for that was wrong too.

`agent-canon/test/reader-density.test.ts` `allSurfaces()` enumerates exactly **three** families:
`dimensions/**/*.ts` · `skills/*/skill.ts` · `genus/persona.md` — the three that were already dense
by construction. `REGISTER_RATCHET` is `new Set([])`, annotated as the corpus conforming.

**That annotation is a claim about COVERAGE stated as a claim about CONFORMANCE.** An empty ratchet
over three self-selected families proves nothing about the corpus.

### ▶ MEASURED 2026-08-04 — the reach finding stands, the exhibit does not

The whole unscanned corpus was scored against the live detector. **The reach half of this spec is
confirmed and larger than filed. The normalization half is refuted by its own exhibit, and the fix it
prescribes would break the gate.** Recorded before acting on it, because the correction is the finding.

**Confirmed — the unscanned ρ=LLM set.** Every family below is declared `LLM` by `RHO` or is plainly
model-read, and no gate scores any of it:

| unscanned surface                                               | measured                      |
| --------------------------------------------------------------- | ----------------------------- |
| `rules/*.ts` `body` — **the projected `/AGENTS.md`**            | **CONVICTS** — `FPP×2`        |
| `hooks/*.ts` `residue` (5) + workers (7)                        | 1 convicts (`FPP×3`)          |
| **hook-emitted agent-facing strings** (4) — these enter context | all pass, all invisible       |
| `genus/founding-doctrine.ts` — rides into every SOUL            | passes                        |
| `agents/*.ts` `description` · `archetype` (18)                  | pass; `RHO` declares them LLM |

`agent-vector: LLM` sits in `RHO` and **no agent prose is scored anywhere** — a class declared and
never witnessed. That is the coverage-as-conformance defect in its sharpest form.

**Refuted — the exhibit.** `stance-judge-prompt.md` measures **3600 words, 34 hits, 0.94/100** (filed
as 3789 / 0.90). Read in context, the 34 hits are two populations and **neither is human register**:

- **agent-address** — _"You are a STANCE JUDGE"_, _"Your one job"_, _"in your REASON"_. The reader is
  an LLM being instructed. This is the canonical imperative prompt voice, and the model already
  concedes it (`carry-on description = 1 hit @3.1`, excused as "incidental agent-address").
- **quoted specimen** — _"What would you like me to call it?"_, _"I'll leave the architecture to
  you."_ These are exhibits **of the collapsed register the rubric detects**, quoted as evidence.

A rubric that teaches a detector must quote what it detects. **Convicting this artifact would be a
false positive**, so raising the threshold — the fix as filed — breaks the gate on the very document
offered as proof that it is broken.

**The normalization complaint is refuted too — and so is my first replacement for it.** The first
reading of the above was that `SECOND-PERSON` binds three concepts (human-tutorial address ·
agent-address · quoted specimen) and that the rate merely suppresses two of them _by accident_ — a
proxy giving right answers for an unrelated reason. **Ablation refutes that.** Both candidate fixes
were run against constructed tutorial prose and the live corpus:

| candidate fix                              | result                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| raise / de-normalize the threshold         | **false-positives** the judge prompt, the rubric fixture, `stance-guardrail.sh`    |
| drop the signal — "`HEDGE` already covers" | **false-negatives 4 of 5** genuine tutorials; one has _zero_ hedges and is obvious |

_"First you open the file. Then you edit the value. Then you save it."_ carries no hedge and no FPP.
**Only second-person catches it.** The signal is necessary, and the rate is not a proxy — it is a
sound discriminator, because tutorial register is _constituted by_ density of address:

| population                                           | second-person rate |
| ---------------------------------------------------- | ------------------ |
| constructed human tutorial                           | **15.4 – 20.0**    |
| the seeded long-form delegation (`reach`)            | 5.7                |
| — threshold —                                        | **4**              |
| agent-address + quoted specimen (3 corpus artifacts) | **0.27 – 1.05**    |

Wide margin on both sides. **A document cannot dilute its way past 4/100 while _remaining_ tutorial
in register**, because dilution is exactly what stops it being tutorial. C0's "a metric a document can
pass by getting longer" is true of the formula and false of the property.

**Residual bound, recorded not fixed:** a very long document with a small genuinely-tutorial section
would dilute below 4. No such artifact exists in the corpus. Windowed-max would close it; the cost is
not yet warranted. This is a known limit, not a defect.

**Also new: hook-emitted agent-facing text has no home in the model.** The four strings that actually
reach an agent's context live as `printf` bodies inside shell workers, reachable only by parsing
shell. A cell declares its `residue` and its `workers[].content`; the **message it speaks to an agent**
is an authored surface with no declared field. Missing distinction in the ground, second site in
source — and it is why "extend the reach" is not purely a test-file edit.

### What survives — the fix, reduced to what the measurement supports

**The detector is not touched.** Both halves of the normalization complaint died under checking; the
work is entirely about reach.

1. **Extend `allSurfaces()`** over the table above, giving each family its `RHO` class.
2. **Make reach checkable**: assert every ρ=LLM class this gate owns is witnessed by ≥1 enumerated
   surface. This is what converts the coverage claim into a conformance claim; without it the next
   class added is silently unscanned again — the defect recurring rather than being fixed.
3. **Re-derive the ratchet** from what convicts. On today's tree that is `rule repo-preamble body`
   (`FPP×2`: _"why **we** are doing this"_, _"how **we** are doing this"_ — human-gloss exposition in
   the file every session loads). Small, not large; the filed prediction was wrong about that too.
4. **Give the emitted message a declared home**, so the reach extension is enumeration rather than
   shell-parsing.

**This still dominates every item below**: with reach extended, C1–C5 and most of the unassigned list
convict themselves.

---

## C1 — `anatomy` binds two concepts

**Verified.**

- **Concept A — the dimension meta-model.** `agent-forge/src/anatomy/index.ts:280`
  `type Anatomy = Readonly<Record<string, DimensionMeta>>`; `agent-canon/src/anatomy.ts` `ANATOMY`.
  Forge's own prose calls it _"the dimension CATALOG"_ / _"the catalog INSTANCE"_
  (`resolve/plugin.ts`) — the sign is in the comment, not on the type.
- **Concept B — the agent-canon package root.** `anatomyRoot = join(here,'..','..')` in
  `toolkit/{plan-set,project-targets,project-cli,project-cli-codex,scaffold-cli}.ts`, plus
  `anatomyProjectTemplate` and `scaffoldAnatomyProject`.

Fossil of `@leclabs/agent-anatomy`, renamed in `2f9bd6e5`; the `95b8f90f` depalimpsest missed these.
**Breaks `α(cᵢ)=α(cⱼ) ⇒ D(cᵢ)=D(cⱼ)` at the corpus's most structural node.**

Collateral: `adapters/claude/anatomy.ts` and `adapters/codex/anatomy.ts` contain no anatomy — they
export `claudeHarnessAdapter`, `agentToClaudeMd`, `agentToCodexToml`, `agentsMdSurface`.

**Ruling (operator, binding):** holdover palimpsest — depalimpsest it. **Neither** concept is named
`anatomy`; it is a metaphor. Signify both and take the argmin.

**Occupied ground the signification must route around:**

- `MODEL.md` declares `catalog : DimensionName → ℘(fragment)`.
- `agent-forge/src/catalog/` ALREADY denotes fragment-value enumeration (`enumerateCatalog`), and
  takes the meta-model as a parameter it currently must call `anatomy` to avoid the clash. **Two
  concepts contend for one sign — resolve that in the same act, not after.**
- Concept B may not be a project concept at all. **Test whether it is merely a filesystem locus
  before minting anything for it** — `⊥ IS A RESULT`.

**Note the interaction:** `ARCHITECTURE.md` names `agent-anatomy` as the intended meta-model package.
If C1's argmin rejects `anatomy`, ARCHITECTURE must be revised in the same act — it is ground, and
ground carrying a refuted sign is worse than source doing so.

### ▶ IN PROGRESS 2026-08-04 — the seam is cut, the sign is not

**Concept A is itself two concepts, and the source says so.** `anatomy/index.ts:265` explains
`Anatomy` as _"A dimension CATALOG: name → metadata. The **META-MODEL** forge owns — that a dimension
HAS an axis/kind/arity — as against the **INSTANCE** (which dimensions exist), which belongs to the
corpus that declares them."_ So:

| facet                                 | owner  | sign today                           |
| ------------------------------------- | ------ | ------------------------------------ |
| per-dimension facts (axis/kind/arity) | forge  | `DimensionMeta` — **already signed** |
| the map a corpus declares             | corpus | `Anatomy` — **the one at issue**     |

**The `catalog` contention is narrower than filed.** `catalog` is _correctly and consistently_ bound
to `DimensionName → ℘(fragment)` across `MODEL.md`, `agent-forge/src/catalog/`, and `enumerateCatalog`
— dimension name → its **values**. The defect is that this file's prose calls `Anatomy` a _"dimension
catalog"_ too, for a map to **metadata**, not values. `DimensionMeta.kind`'s own comment then writes
_"how the **value-catalog** is sourced"_ to disambiguate. **The disambiguation is in the prose and
never in the sign** — this sweep's dominating shape, at its most structural node.

So C1 is not a contest over `catalog`. It is a **missing sign**: `L1 passes ∧ no sign`.

**Three forward legs, cold-isolated, candidate-free — UNSTABLE.**

| leg | framing emphasis                                  | argmin     |
| --- | ------------------------------------------------- | ---------- |
| 1   | membership — "adding an entry makes it exist"     | `manifest` |
| 2   | per-slot metadata shape                           | `schema`   |
| 3   | both, contrasted explicitly against the value map | `schema`   |

Three framings, two answers — the emphasis picks the answer, which means no framing has yet isolated
the concept. Rejected across the legs: `registry` · `taxonomy` · `spec` · `descriptor` · `config`.

**And the leading candidate FAILS the reverse round-trip — this is the load-bearing result.** Given
`dimension schema` cold, with no other context, the reader expects it to carry _"the permitted set of
values (as a constraint, e.g. `enum: [...]`)"_ — **which is MAP 1**, the exact boundary that must
hold. `signify-verify(w) ⇔ concept_R(w) = α⁻¹(w)` fails. The forward argmin alone would have minted
it; only the round-trip caught it. **Do not mint `schema`.**

**State: the concept is real and load-bearing; every generic container word tried fails on some
boundary the corpus needs.** That is the signature of a short language, not of a missing analysis.
Next executor: do **not** re-run legs 1–3, and do not re-derive the seam above. The open question is
whether the constitutive facet or the metadata facet is the definiendum — `ARCHITECTURE.md` says
constitutive ("a dimension is _constitutive_: declaring one makes it part of that corpus's agent
design"), which favours leg 1's cut over leg 3's, and leg 1's argmin was the one never round-tripped.

### ▶ CENSUS 2026-08-04 — `anatomy` binds FOUR concepts, and the proposed replacement is taken

Full-repo occupancy, excluding generated trees: **732 lines / 313 files.** The spec's "two concepts"
undercounts.

| #   | concept                                                                               | scale          |
| --- | ------------------------------------------------------------------------------------- | -------------- |
| A   | the dimension meta-model / catalog instance                                           | 608 ln / 291 f |
| B   | a **filesystem locus** — the agent-canon package root (`anatomyRoot`, scaffold)       | 57 ln / 19 f   |
| C   | **harness PROJECTION** — `adapters/{claude,codex}/anatomy.ts`, `core/anatomy-body.ts` | 67 ln / 32 f   |
| D   | **the agent's live in-session state** — `@ live-anatomy` (`skills/introspect`)        | 2 ln           |

**C is new and was not in the spec.** Those files contain no meta-model at all: `claude/anatomy.ts`
exports `agentToClaudeMd` · `skillToClaudeMd` · `claudeHarnessAdapter`; `codex/anatomy.ts` exports
`agentToCodexToml` · `agentsMdSurface` · `codexHooksJson`. `core/anatomy-body.ts` is a markdown
SOUL-body composer. In a **file name**, `anatomy` denotes projection — a third binding, inside the one
package whose entire audit criterion is that it decides nothing.

**The blocking finding: `agent-anatomy` already denotes two things.** It is ARCHITECTURE's _proposed_
meta-model package **and** `agent-canon`'s own pre-`2f9bd6e5` package name (`guardrail/fixtures/turn-554.txt:50`,
`plans/.retired/heartbeat-organ/PLAN.md:10`). **Extracting the meta-model as `agent-anatomy` would
resurrect a retired package name for a different concept** — minting the defect into the one place
that is most expensive to carry, which is exactly what the C1↔§1 interaction warns against. This holds
_regardless_ of how the signification resolves.

**`catalog` carries four senses**, one of them not ours: forge's value-enumerator module + CLI
subcommand; the prevailing _prose_ word for A; `MODEL.md`'s formal `DimensionName → ℘(fragment)`; and
**pnpm's reserved `catalog:` dependency protocol** (`pnpm-workspace.yaml` + 24 `package.json` lines).
Confirms the earlier reading: MODEL's `catalog` is dimension→**values**. `Anatomy` is dimension→
**metadata** — the same index set, a different codomain, and MODEL names only the first.

**Scale is smaller than 608 suggests**: ~198 of A's lines are mechanical one-line imports
(`dimensions/**` ×142, fixture dimensions ×24, `skills/*/skill.ts` ×16, `agents/*.ts` ×10, hooks ×5).
The authored surface is a few dozen sites.

**Two dangling signs found in passing** — file them, they are free: `pnpm anatomy:*` is cited at 4
sites and **no `anatomy:` script exists in any `package.json`**; `test/adapters/codex/anatomy.test.ts`
is cited twice and does not exist (the live file is `codex-hooks.test.ts`).

**Concept B's existence check is still not run**, but the census sharpens it: B is 19 files, and every
one of them wants a path, never a predicate. `⊥` is the likely result — test it before minting.

### ▶ RESOLVED 2026-08-04 — concept A is **`manifest`**, round-tripped

The unstable legs were unstable because the emphasis was doing the work. `ARCHITECTURE.md` settles
which facet is the definiendum — _"a dimension is **constitutive**: declaring one makes it part of
that corpus's agent design"_ — so the constitutive cut is the one to run. Both legs framed that way
returned **`manifest`**, and the fourth leg rejected the rivals on exactly the right grounds:

> **Registry** — a registry _records_ things that already exist independently; it doesn't bring them
> into being. **Catalog** — same failure mode: catalogs describe an inventory that exists prior to and
> apart from the listing. Descriptive, not creative. **Schema** — already spoken for by the per-
> dimension shape.

**The round-trip holds, on the boundary that killed `schema`.** Given `dimension manifest` cold:

| probe                          | cold decode                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| what it contains               | "each entry naming a dimension and describing its shape" ✅                                  |
| does it hold the **values**?   | "**Probably not** … that catalog would more naturally live in something like a `catalog`" ✅ |
| shape vs instance              | "what dimensions exist and how they're structured", not one agent's chosen values ✅         |
| a dimension **absent** from it | "not a recognized slot … **unknown to the framework**", not merely unset ✅                  |

Probe 2 is the result. The reader's priors put `catalog` **exactly where `MODEL.md` puts it** and
`manifest` exactly where `Anatomy` sits — unprompted. **So `catalog` does not move at all**; the
collision dissolves by naming the other map, which is the cheapest possible resolution and the one the
model already held.

Probe 4 recovers the constitutive property verbatim. `signify-verify` passes.

**σ\*(A) = `manifest`** — `DimensionManifest` for the type, `MANIFEST` for the corpus's instance.

### ▶ RESOLVED 2026-08-04 — the extracted package is **`agent-schema`**

The definiendum is not concept A. ARCHITECTURE scopes this package as _"what a cell is, what a value
is, what carries enforcement — MODEL.md realized in types"_ — strictly broader than the manifest; it
also holds `Skill`, `Agent`, `HookCell`, `RuleCell`. Signified separately, framed only by what it
holds, who writes against it, and what it must not do.

**Forward: `SCHEMA`**, rejecting `types` ("reads as a grab-bag, not a deliberate shared vocabulary"),
`form` (overloaded), `ontology` ("overclaims — implies a network of relationships").

**The round-trip does something none of the others did: it recovers the ARCHITECTURE constraint from
the name alone.** Given `agent-schema` beside `agent-canon`/`agent-forge`/`agent-runtime`, cold:

| probe                     | cold decode                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| contains?                 | "type/interface definitions … the contract other packages code against" ✅                                                           |
| holds content?            | "**No.** Schema names the shape of data, not instances" — and puts content in `agent-canon` unprompted ✅                            |
| executes? knows a target? | "**No.** No side effects and no opinion on how/where things run — that's `agent-runtime`'s job" ✅                                   |
| dependency direction      | "**The other three would depend on `agent-schema`, not the reverse. Schema packages sit at the bottom of the dependency graph.**" ✅ |

Probe 4 **is ARCHITECTURE's property 2 and 4, derived from the sign with no access to the document.**
For a project whose thesis is that the model already holds the concepts, that is the result to want:
the name does the architectural work.

**Occupancy checked before minting** — 17 hits across all package sources, clustering on one real
referent: `core/hook/hook.schema.json`, a JSON Schema generating `CanonicalEvent`. **Convergent, not
colliding** — it is the industry sense, and a shape generated from a schema file belongs in the shape
package.

**σ\*(package) = `agent-schema`.** `anatomy` then dies completely: the directory becomes this package,
`type Anatomy` → `DimensionManifest`, canon's `ANATOMY` → `MANIFEST`, `AgentPlugin.anatomy` →
`.manifest`.

**RIDER — one ground revision falls out, and it was already owed.** `MODEL.md:22` reads
`Event ≜ the harness-agnostic lifecycle vocabulary ⟨schema-owned⟩`. That clause describes
`hook.schema.json` generating forge's `CanonicalEvent` — **exactly the arrangement PLAN §2's operator
ruling overturns** (the vocabulary is canon's). So `⟨schema-owned⟩` is already false and must be
revised with §2, independently of this naming. It must not be left standing beside a package called
`agent-schema`, where it would read as an ownership claim about that package.

**And it hands §2 its cut**, which the plan did not have: the **shape** of a `Hook` is
`agent-schema`'s; the **vocabulary** of 28 event names is canon's. Shape and vocabulary are different
concerns, which is why one home was hard to find while they were braided.

### Still open

1. **Concept B** — the filesystem locus (`anatomyRoot`, 19 files). Existence check unrun; **`⊥`
   expected**: every site builds a path, none asks a predicate, and the siblings already read
   `repoRoot` · `srcRoot` · `renderRoot`. The fix is compositional (`σ* ∨ ⊕σ*`), not a mint —
   `anatomyRoot` is the only one of the four that fails to name what it roots.
2. **Concept C** — `anatomy` as a **file name** meaning harness projection (3 files). Own
   signification; the census found it, the spec never did.

---

## C2 — shipped instructions naming commands that do not exist

**Verified, and broader than reported: 4 instances, 3 of them in markdown.**

| where                               | emits                          |
| ----------------------------------- | ------------------------------ |
| `toolkit/project-targets-cli.ts:18` | `pnpm anatomy:project:targets` |
| `toolkit/guardrail/README.md:48`    | `pnpm anatomy:project`         |
| `toolkit/guardrail/README.md:50,81` | `pnpm anatomy:deploy:hooks`    |

The real script is `canon:project:targets`. **The CLI surface's only job is telling a reader what to
run, and it names nothing.**

**Instance:** correct all four literals.

**Class — the actual fix:** a gate asserting every `pnpm <script>` string in any tracked source or
markdown file resolves to a key in the root `package.json`. This class has **zero compiler
pressure** — a shipped instruction to run a nonexistent command is invisible to typecheck, lint and
every existing test. **The same absence is what let C1 survive a package rename.** Cover `.md`, not
just `.ts`: three of the four instances are markdown.

---

## C3 — a generator for an artifact class that no longer exists

**Verified.** `agent-forge/src/anatomy/project-human.ts` projects a per-dimension README, rendering
`Classification = 'coined'` as _"a **coined** scalar dimension"_. Exported at `anatomy/index.ts:523`.

**No `dimensions/*/README.md` exists anywhere in the tree (0 found), and `projectHumanDimension` has
no caller outside its own test.** The artifacts were removed; the generator was not.

**Ruling (operator, binding):** zero documentation is to be generated. The READMEs and the code that
creates them are both palimpsest. Delete both.

**Scope:** `project-human.ts`, its two exports, `DimensionDoc`, its test — and the orphaned duplicate
it leaves: **`dimensionTitle` is defined twice, byte-for-byte** (`core/anatomy-body.ts:17` exported,
`project-human.ts:29` private). One home survives.

**DOES NOT DIE WITH IT — and the review understated this.** `Classification = 'enum' | 'open' |
'coined'` is live and independent. `coined` labels three dimensions (`anatomy.ts:61,67,70`):
guardrails, **engineering-principles**, heuristics. **`engineering-principles` is the dimension that
HOLDS `cratylism`** — so the axiom reading `σ*(c) INTRINSIC ∧ DISCOVERED ¬coined` lives inside a
dimension the type system classifies as `coined`. Deleting the generator removes the most visible
rendering, not the contradiction. **Re-signify the value.**

---

## C4 — one capability, three signs, with a documented production failure

**Verified, and the source documents its own casualty.**

| sign        | where                                                         |
| ----------- | ------------------------------------------------------------- |
| `eventTap`  | `runtime/src/loader.ts:33` `CAPABILITIES` keyspace            |
| `event-tap` | `capabilities/event-tap/index.ts:34` plugin `name`, + the dir |
| `tap`       | CLI verb surface — `dispatchTap`, `TapVerb`, `TAP_ID`, …      |

`main.ts:80` accepts **both** `tap` and `eventTap`, and `main.ts:65-79` records why: projected shims
spawn `f(capability)` = `eventTap`, which fell through dispatch and died `unknown capability`. **The
tap was reachable by a human typing `tap` and DEAD to every agent arriving through its own skill's
shim.**

`memory` carries exactly one sign across keyspace, plugin name, directory and CLI verb — **a live
exemplar, not a hypothetical.**

**Fix:** one anchor. **Case transformation is a MECHANICAL PROJECTION of a sign, never a second
sign** — derive `eventTap` from the kebab anchor at the one place the keyspace is built, never
hand-author it alongside. Retire the dual acceptance: two accepted words is two signs wearing a
compatibility shim.

**Then gate it:** capability keyspace ≡ plugin `name` ≡ directory basename ≡ CLI verb ≡ canon skill
name, for every capability. `memory` passes today, so the gate has a positive control from the start.

**Signify the anchor before wiring.** The canon skill says `event-tap`, the runtime verb surface says
`tap`; only one is σ\*, and possibly neither.

---

## C5 — `SOUL`, a canon metaphor inside the doctrine-agnostic engine

**Verified.** `SOUL` appears in **12 files under `agent-forge/src`** — `core/anatomy-body.ts`,
`anatomy/index.ts`, `deploy/{index,deploy,seeds,init}.ts`, `project/index.ts`, both adapters. It
denotes the projected agent-definition artifact.

**It has no σ\* home: zero occurrences in VISION.md, MODEL.md, ENGINE.md, CANON.md or
ARCHITECTURE.md** — measured. Meanwhile `MODEL.md:33` declares `Target ≜ harness-declaration-artifact`,
and forge already carries three signs for the same referent: `agentDef`, `HarnessProjection`, and
`validate/accept.ts` `interface Target`.

Every one of those 12 file headers declares itself doctrine-agnostic.

**Fix in forge:** `Target` — MODEL's own anchor. The cleanest item in this set: the sign is already
declared in ground, already present in the package, and the metaphor is the outlier.

**LINKED QUESTION, decide explicitly:** `SOUL` is also live canon vocabulary (projected agent bodies,
the wake/dream cycle). It is a metaphor of exactly the kind C1's ruling rejects. **Probe it.** If it
fails, that is a larger rename than this shard and gets its own — but **do not let C1's ruling apply
silently to canon's `SOUL` without a decision.**

---

## Unassigned — verified, unspecced

- **`ports/event-tap.ts:32` exports `interface Record`** and _both_ consumers import it as
  `Record as CaptureRow`. The codebase cannot use its own exported name; the discovered sign is
  sitting in the alias.
- **`validate/accept.ts:52` admits a fifth Kind** — `'fragment' | 'agent' | 'skill' | 'rule' |
'hook'` — into MODEL's closed `Kind ≜ {fragment, agent, rule, skill}`. `hook-cell.ts:9` already
  argues `hook` is not a Kind the canon authors, and the type still carries it. Ground says four.
- **`catalog/index.ts:167,284`** ship literal `[SIGNIFY: …]` markers over live exports — owed
  cold-decode passes, recorded honestly and never discharged.
- **`RuleCell.definiens` and `HookCell.residue` are two signs for one concept** — each is documented
  in its own source as "the σ\*-signified canonical identity" that `accept()` gates. Surfaced while
  giving both a shared `RHO` class at C0; the class had to be named for what they _are_ because
  neither field name generalizes. `residue` is the MODEL term (`body(c)=⟨α(c),residue(c)⟩`) and
  `definiens` is the loose one, so this is not symmetric — one of them is simply wrong.
- **`RuleCell.body` collides with MODEL's `body(c)`** — one sign, two concepts. The field is the
  cell's _verbatim projected payload_; `body(c)` is `⟨α(c), residue(c)⟩`, the declaration. C0's new
  `RHO` class had to route around this (`rule-target-body`), which is the tell: a name minted to
  avoid a collision is a collision that was never resolved.

## Rejected — a claim that did not survive verification

The prompting review asserted **`ARCHITECTURE.md` is linked from `AGENTS.md:10` and `CANON.md:22`
but does not exist** — "a dangling path at the apex." **False.** The file exists (`b060350`, 8.6 KB).
The claim was written against a tree predating that commit.

Recorded because it is the useful kind of wrong: an unverified finding, stated with the same
confidence as the verified ones, in a list where every other item held. **A review is a claim, not an
instruction** — the same law that applies to my own filed findings.

## Refuted — worth keeping

Discipline does **not** decay with distance from `agent-canon`. `agent-runtime` — the farthest node —
carries the repo's most explicit cratylist work: `bin-name.ts` collapses 13 homes of one sign,
`brand-derived-literals.test.ts` is a real source-text naming gate, and `ports/provisional-v9.ts`
refuses to register a working capability because its anchor is underived, citing the law by name.

**The predictor is absence of a forcing function, not distance.** Which is why C0 comes first.
