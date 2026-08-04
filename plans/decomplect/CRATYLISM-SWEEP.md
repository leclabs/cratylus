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

## C0 — extend the density gate's reach _(do this FIRST; it dominates)_

`agent-canon/test/reader-density.test.ts` `allSurfaces()` enumerates exactly **three** families:
`dimensions/**/*.ts` · `skills/*/skill.ts` · `genus/persona.md` — the three that were already dense
by construction. `REGISTER_RATCHET` is `new Set([])`, annotated as the corpus conforming.

**That annotation is a claim about COVERAGE stated as a claim about CONFORMANCE.** An empty ratchet
over three self-selected families proves nothing about the corpus.

**Measured, and worse than the review that prompted this:** the detector is length-normalized
(≥4 second-person hits per 100 words), so long prose is **structurally unconvictable**.
`toolkit/guardrail/stance-judge-prompt.md` — the enforcement organ of the stance canon, read by an
LLM judge every turn — is **3789 words, 34 second-person hits, 0.90 per 100**. Not marginal:
**4.4× under threshold by dilution alone**, and it is not even in scope to be measured.

**Fix:** extend `allSurfaces()` past those three families — hook prompts, hook-emitted feedback
strings, rule bodies, root doctrine docs, READMEs, template emitters. Then **re-derive the ratchet
from what actually convicts**, so it records real debt instead of asserting a conformance never
tested. Expect it to be large; that is the finding, not a failure of the fix.

**Also fix the normalization.** A per-100-words rate lets a long document dilute its way to a pass.
Whether the right form is an absolute floor, a windowed maximum, or something else is a design call —
but a metric a document can pass by _getting longer_ is not measuring what it claims.

**This dominates every item below**: with reach extended, C1–C5 and most of the unassigned list
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
