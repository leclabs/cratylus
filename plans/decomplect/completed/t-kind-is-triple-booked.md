# `kind` names three different concepts, two of them in the same package

> Found 2026-08-05 by the signification rulings, which stopped rather than swept: renaming a MEMBER
> of one of the three does not touch the collision, and discharging an instance while leaving the
> class is the pattern the census exists to stop.

## The three

| sign                                               | concept                                                          | site                                        |
| -------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| `DimensionSpec.kind: Classification`               | how a dimension's value-catalog is SOURCED                       | `schema/src/index.ts:267`                   |
| `RuleCell.kind: 'rule'`                            | MODEL's `Kind ≜ {fragment, agent, rule, skill}` — what a cell IS | `schema/src/rule-cell.ts`, **same package** |
| `FragmentKind = 'scalar' \| 'set' \| 'structured'` | a value's structural SHAPE                                       | `forge/src/resolve/resolve.ts:37`           |

Two of the three collide **inside one directory**. `MODEL.md:10` owns `Kind`, so that member has the
strongest claim and the other two are the intruders — but which sign each takes is a derivation, not
a deduction.

## Why it survived

Every one of the three is locally sensible; the collision is only visible when all three are read
together, and nothing reads them together. `t-coined-classification` renames a _member_ of the first
and leaves the field name untouched, which is why that ruling explicitly filed this rather than
folding it in.

## ▶ RULING 2026-08-05 — `kind` stays with MODEL's `Kind`; `ValueShape` and `Repertoire` vacate. The blocking member was found and repaired.

| concept                         | sign                                                                 | why                                                  |
| ------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| MODEL's `Kind` — what a cell IS | **`kind`** (unmoved)                                                 | derived, not assumed by ground ownership — see below |
| a value's structural SHAPE      | `FragmentKind` → **`ValueShape`** / `valueShape`                     | forward argmin + blind reverse 8/10                  |
| how a value-catalog is SOURCED  | `Classification`/`kind`/`openness` → **`Repertoire`** / `repertoire` | derivable only AFTER the member repair below         |

**FIRST PASS GOT THIS WRONG AND THE RECORD KEEPS BOTH.** The field was initially given its
own type's name (`classification`) with the mint declared OWED and escalated, on the
reasoning that a member repair re-opens a settled ruling. That was a collapse, not a
ruling: `t-coined-classification` adjudicated `coined`→`curated` and explicitly FILED
everything else, so there was no settled finding on `enum` to re-open; `Classification`
is not ground (MODEL declares `Kind`, not this), so the ground-edit prohibition does not
reach it; and the shard's own acceptance demands a sign "derived not picked", which
`classification` was not. A later blind decode convicted it outright: beside `axis` it
reads as _"what category this dimension is filed under"_ — **already `axis`'s job** — and
two of three members strain under it (`classification = latent` reads "not yet
classified"; `classification = open` reads "the taxonomy is unfinished"). It is not a
neutral fallback; it is a wrong meaning the members contradict.

**`kind`'s owner was DERIVED, and the derivation agreed with the ground rather than
deferring to it.** A blind reverse decode was given all three declarations with the doc
comments stripped and asked which had the strongest claim on the sign. It returned
`RuleCell` unprompted: `kind` fires one dominant prior — _a literal discriminant whose
value answers "what is this?"_ — and `kind: 'rule'` is exactly and only that. It ranked
the sourcing site WEAKEST ("closest to a pure misfire"), because that is a property
_about_ the dimension, not the dimension's identity. **`MODEL.md` is untouched; the STOP
condition did not fire.**

**`ValueShape` is an ALIGNMENT, not a new collision.** `MODEL.md:22` rules
`shape ⊥ vocabulary`, which installs `shape` as a GENUS — structure-of, as against
names-of — and a genus term is _supposed_ to recur. `<Noun>Shape` is a family
(`ResidueShape` is its other member) whose qualifier names the subject whose structure
is meant. What WOULD have been a collision is a bare `shape` field, since
`GatedField.shape` already squats the unqualified name — so the `value` qualifier is
load-bearing, not verbose. Rejected 2026-08-05 with the cold reader's own reasons:
`cardinality`/`multiplicity`/`degree` (count-flavoured — the narrower `Arity` owns that,
confusable by construction) · `ValueType` (reader guesses `string|number|boolean`) ·
`ValueStructure` (stem-collides with its own member `structured`) · `MergeKind`/
`Mergeability` (names the CONSEQUENCE, so the reader expects op names as members) ·
`Sort` (everyday reading is ordering) · bare `Shape` (see above).

### The third sign was blocked by a MEMBER, and the block was the finding

Six independent **unbiased** forward decodes of the axis _"who owns the value-set"_ — no
candidate list given, each blind to the others — returned **six different winners**:
`vocabulary` · `domain` · `provenance` · `admission` · `valueSource` · `sourcing`.
Argmin undefined. Every one was then knocked out, and the rejections are dated here:

| ⊥ 2026-08-05                                                                                                 | reason                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vocabulary`                                                                                                 | OCCUPANCY — 42 sites; `shape ⊥ vocabulary` (`MODEL.md:22`) makes it a SET OF NAMES. This is not one; it sources one.                                                                                                                                               |
| `provenance`                                                                                                 | OCCUPANCY — `ResolvedFragment.provenance` is the attributed fold history. One sign, two glosses: α injectivity.                                                                                                                                                    |
| `domain`                                                                                                     | OCCUPANCY — the corpus writes `dom(f)` / `Domain → Codomain` in its own formal blocks. `domain : O → {…}` names a map that HAS a domain, and refutes its own first-pass type in the next token. The one candidate that gets WORSE the more of the corpus you read. |
| `admission`                                                                                                  | OCCUPANCY — `admissible`/`admit`, 90+ sites, is the residue/canonization gate verdict. Also fires _checking_, not _authorship_.                                                                                                                                    |
| `source`                                                                                                     | OCCUPANCY — `ContributionSource` · `HookSource` · `PluginFragmentSource` · `CellTarget.source`.                                                                                                                                                                    |
| `sourcing`                                                                                                   | free, but scored 6/10 blind: reads as retrieval mechanics (fetch/lookup), and a reader writes resolution code against it.                                                                                                                                          |
| `authority` · `governance` · `custody` · `ownership` · `origin` · `stewardship` · `jurisdiction` · `control` | each reads TRUE for two members and FALSE for `enum` — an enum is not an authority, an origin, or a custodian.                                                                                                                                                     |
| `openness`                                                                                                   | tautological fixed point with its own member `open` — see the sibling shard.                                                                                                                                                                                       |

**Two independent blind reverse decodes then named the same single cause, and one
supplied a falsifier.** The strain is not in the search space of field words: it is that
**`enum` is on a different axis from its two siblings.** `open` and `curated` are policy
words about how a set is tended; `enum` is programming-language type vocabulary naming a
REPRESENTATION — and it misfires inside its own register, decoding as _"a closed list
written down in the source"_ when the member's gloss is that the corpus wrote none of
them down. **The sign asserts what the gloss denies, which is precisely the defect
`coined` had.** The falsifier: hold the field word fixed and swap `enum` for a party
sign; all nine candidates go from strained to clean at once. Nine candidates failing on
one element is evidence, not coincidence.

### The repair: `enum` → `latent`, then the field names itself

The GLOSSES were always MECE on ownership (model · agent · corpus) — that is why
`t-coined-classification`'s refusal to merge still stands. Only the SIGN was wrong, and
`latent` is **discovered, not coined**: `VISION.md` names this project's whole discipline
**latent lexicography** and glosses the word — _"the vocabulary exists, unsurfaced,
awaiting description… Nor is it authored"_ — in a table whose owner column reads **the
model**. `cratylism` itself carries `model-latent-space = real stable concepts`. The
member meaning "the model's own set, read out not authored" now wears the sign the
founding document already gave it, and the type QUOTES its axiom where it used to
contradict it — the exact inverse of the `coined` defect.

⊥ 2026-08-05 for the member: `model` (OCCUPANCY — a live dimension name, `export type
Model`; `model: { repertoire: 'model' }` is absurd) · `model-native` (blind reverse's own
winner at 9/10, but a near-homonym of the live `llm-native` value three agents compose) ·
`native` (OCCUPANCY — `llm-native`, plus harness-native event vocabulary) · `discovered`
and `intrinsic` (OCCUPANCY — cratylism's own `DISCOVERED` and `INTRINSIC`) · `innate`
(free and clean, but no corpus grounding, and it fights the truth that a model's
vocabulary IS learned) · `learned` (reads as mutating-from-telemetry, inverting closure) ·
`given` · `emergent` · `endogenous` (imported jargon, breaks register).

**The dissent is recorded because it was strong.** A blind reverse decode scored `latent`
4/10, holding that "nothing in the declaration points at a language model unless the
reader already knows the codebase". It is answered by `MODEL.md:45` —
`decode_cold(f) ≜ decode(f, LLM-priors ∪ Corpus, ∅)`: the **Corpus is admitted** to a cold
decode and only session-K is excluded, so grounding in `VISION.md` is cold grounding, not
a warm crutch. The subagent decoded with priors alone and could not know that.

**With the member repaired the field derivation converged immediately.** Unbiased forward
argmin returned **`repertoire`**, the only candidate under which all three members read as
true, grammatical predicates in one register — `repertoire = latent` (competence one
possesses without having exercised it), `= open` (open vs closed class, a live term of
art), `= curated` (what curators do). Occupancy: zero. ⊥ `lexicon` (OCCUPANCY —
`operator-lexicon.ts`, 50 sites; also a near-synonym of the excluded `vocabulary`) ·
`membership`/`roster`/`range`/`enumeration` (all break on `latent`) · `origin`/`derivation`
(break on `open` — a policy is not a place) · `authorship` (breaks on `curated`: curating
is precisely NOT authoring) · `governance` (breaks on `latent` — dormant authority).
Sibling harmony holds: `axis` · `repertoire` · `arity`.

The residual, stated because it is REAL: `repertoire` decodes as "what this dimension's
value space is like" rather than "who owns it". The members repair it on sight, and the
division of labour — field scopes, members answer — is the corpus's own `axis: Genus`
precedent, where the field names the question and the type names the answer-space.

**Two further findings, filed not fixed.** (1) `ValueShape`'s members cross two axes:
`scalar`/`set` are `Arity`'s signs, where they mean cardinality only, while the axis the
op table actually reads is degree of internal structure — the tell is that _a set of
structured values_ is unrepresentable. (2) `CellTarget.kind: 'hook' | 'rule'`
(`canon/src/toolkit/project-targets.ts:84`) is a fourth occupant whose own doc disclaims
being a Kind; its gloss names it "which source FAMILY emitted this target". Outside this
shard's write scope.

**`ContributionSource.kind` STAYS** — a discriminated union's variant tag is the one job
the sign fires for cold, the same job `RuleCell.kind` does. One gloss over two unions is
alignment; the census convicts one sign over two GLOSSES.

## Acceptance

- Each of the three concepts has a sign no other concept in the repo carries, derived not picked.
- A gate censuses field names across `schema/` and `forge/` and convicts one gloss under two signs —
  the same leg `t-definiens-vs-residue` establishes. **Build it once, not twice.**
- `MODEL.md`'s `Kind` is untouched, or its change is argued in its own commit.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 0
- **depends on** `t-definiens-vs-residue` · `t-coined-classification`
- **writes** `packages/forge/src/resolve/**`
- **compiles against** `packages/schema/src/index.ts` · `packages/schema/src/rule-cell.ts`
- **evidence** `packages/schema/src/index.ts` · `packages/forge/src/resolve/resolve.ts` · `MODEL.md`
- **dispatchable** no ruling owed
