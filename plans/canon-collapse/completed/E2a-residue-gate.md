# E2a · residue-gate (AC-RESIDUE)

**Slice** ENGINE · **Wave** 1 · **Deps** E1 ⊳dep · **State** pending · **Executor** mav (predicate specified below by nico)

## Objective

The machine-check behind **AC-RESIDUE**: an `accept()` leg that FAILS on any DEPLOYED σ\* payload whose stored
form is explanatory prose rather than a **composable σ\* expression / `formalize` artifact / ∅**. **Scope =
every organ value string + every skill `description` + every skill `formalBlock` (whole).** Each is read by the
model as context ⇒ it MUST address the model's semantic space in formal σ\*, never human prose (the vision's
failure criterion). MODEL's PARSIMONIOUS (`body(c)=⟨α,residue⟩ ∧ residue=D∖fired(α)`) specialized to the
deployed corpus. Only enumerated HookCell executable worker-bytes are excluded.

## Predicate (nico-specified — the decidable rule the gate enforces)

A **single-line payload** (organ value string · skill `description`) is admissible iff it is one of:

- **∅** (the empty string — the anchor fully fires the concept), or
- a **σ\* expression**: a symbol/anchor, or an application of the declared operators over such terms —
  `↾` (restriction) · `⟨…⟩` (modifier) · `${…}` (ESM reference). (Member-composition is the agent's set-arity
  vector, NOT a `⊕`/`⊗` glyph — see below; no compose operator is admitted without its own cold-verification.)

A **`formalBlock`** (multi-line) is admissible iff it is a `formalize` artifact: every line is a **declaration**
(a symbol introduced/bound above the `----` divider via `≜` · `;` · `:`) or a **law** (a formal statement below
it) — **zero explanatory prose**: no free NL sentence, no `#`-preamble gloss.

Inadmissible (either shape) = free natural-language sentence: verb-led exposition, articles/connectives carrying
clausal meaning, sentence punctuation doing semantic work. The gate must, for a rejected payload, NAME the
offending clause/line (actionable for `O*`/`S*`). Home: extend `test/reader-density.test.ts`'s sibling detector +
add the `accept()` leg in `toolkit/cold-oracle/`.

## Operator lexicon (HOME = the `operator-lexicon.ts` module, E3 — this is its seed content + verifications)

The lexicon lives in `src/toolkit/operator-lexicon.ts` (E3); the residue gate READS that module (never this doc
— DRY, one home). The table below is the seed content + the cold-verification record E3 migrates in. The σ\*
value algebra has exactly **two intra-expression operators** + **one reference mechanism**. Every glyph must be
COLD-VERIFIED — a cold reader must recover the operation from the glyph alone (SIGNIFIED/COLD-BLIND).

| glyph  | role        | meaning                                                                                                               | cold-verified                                                                                        |
| ------ | ----------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `↾`    | restriction | `X ↾ Y` — X narrowed/limited to scope Y                                                                               | **✓ PASS** — isolated `f ↾ S` → 2/2 "restriction of f to S"; in-context 3/3 "restricted to IC scope" |
| `⟨…⟩`  | modifier    | `X ⟨m⟩` — X qualified by modifier m; carries the **residue** (what the anchor underdetermines)                        | **✓ PASS** — `⟨intrinsic⟩` → 3/3 read as an inherent-property "tag"/qualifier                        |
| `${…}` | reference   | ESM template-literal interpolation of another cell's value — a **code** mechanism resolved at eval, NOT a decoded σ\* | n/a (code, not read)                                                                                 |

- **`⟨⟩` dual-reading (the overload — MUST be documented here so a cold reader never conflates them):** `⟨…⟩`
  is ALSO the ordered **pair/tuple** in MODEL `body(c)=⟨α,residue⟩`. Disambiguate by **position** — a
  comma-separated pair with no leading anchor = tuple; a bracket **suffixing** an expression = modifier. The
  cold survey confirms a reader lands on "modifier/tag" in the suffix position.
- **Member-composition is NOT an operator glyph.** An agent holding scope + loop + doctrine is the **set-arity
  vector** (a list in the agent), not a `⊕`/`⊗` expression — my earlier `⊕` prose was informal shorthand; do
  NOT mint it as a cell operator without its own cold-verification.

## Acceptance (falsifier)

- FAIL if a prose residue (`acts autonomously on the operator's behalf; …`) passes.
- FAIL if a valid σ\* form (`''`, `human-on-the-loop`, `decision-authority(self) ↾ individual-contribution ⟨intrinsic⟩`)
  is rejected.
- FAIL if a rejection does not name which clause is prose.
- FAIL if the gate's scope omits skill `description` or skill `formalBlock` (must cover the whole deployed σ\*
  payload set — organ values + descriptions + formalBlocks — not only organ values).
- FAIL if a `formalBlock` with an explanatory-prose line PASSES, or a valid `formalize` artifact
  (declarations-above / laws-below, zero prose) is rejected.
- FAIL if any operator glyph admitted by the grammar lacks a cold-verification (a cold reader must recover the
  operation from the glyph alone) — `↾` and `⟨⟩` are verified; a newly introduced glyph must pass the same bar.

## Return

Gate home · the decidable predicate as implemented · operator lexicon · transcript: prose REJECTED, the three
σ\* forms ACCEPTED, a rejection message naming the offending clause.
