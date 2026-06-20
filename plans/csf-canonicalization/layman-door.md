# The layman door — `self-extend` (slice δ)

**Telos.** polis self-extends **on a layman's behalf**: a non-engineer states a domain intent in their
own words, and polis recovers it, factors it canonically, names the pieces, and stands up a new
**agent-as-person** wielding the new **domain skills** — without the layman ever naming a concept, a
factor, or a skill. The reflexivity (`self`-extend) is the differentia: the same machinery that builds
the corpus turns inward and grows the society's own membership.

The entry skill is **`self-extend`** (`/self-extend`), `packages/mind/ideas/self-extend.md`. It is the
**one R=human surface**; every stage below it runs at R=LLM. It orchestrates existing atoms — it restates
none of them ([[minimalism]] · [[cite-dont-copy]]).

---

## The pipeline wiring

```
layman intent (NL)
  │  R = human  ────────────────────────────────── the ONE door
  ▼
[[elicit]]            recover the hidden target concept by max-info-gain yes/no questions
  │  recovered concept t  (gloss filled; anchor, factorization ⊥)
  ▼  R = LLM  ───────────────────────────────────── everything below is internal
[[exemplify]]        produce → name → realize  over the [[concept-contract]] record
  ├ [[conceptualize]]   produce — fills gloss   (lattice C_R: primitives + factorizations)
  ├ [[signify]]         name    — fills anchor  (α = σ*_LLM, injective, coalesced)
  └ [[materialize]]     realize — fills factorization (bipartite normal form CSF_R)
  │       gated by [[accept]]  ⇔  valid (round-trip ≽ ∧ minimal), else ⊥ loudly
  ▼  accepted CSF_R
recompose            materialize under the `file` strategy → canonically-named domain `skill` cells,
  │                  each composing primitives by [[lexicon#^anchor]] / [[ ]] (cite, never restate)
  ▼  domain skills (kind: skill, σ*_LLM-anchored)
compose-person       the resolver assembles an [[ambient-person-agent]] (subject filled by
                       [[subject-binding]]): embodies the genus stack, invokes the new domain skills
  ▼
a new person in the [[mind-society]] — of-a-subject, self-clocked, truthful, answerable
```

### The R=human ↔ R=LLM boundary

The whole design rests on **one** crossing. `elicit` is the **sole** stage whose reader is the human;
its job is precisely to convert `σ*_human` (what the layman _means_, in their priors) into a recovered
concept the LLM pipeline can carry. Once `elicit` hands off, the substrate is uniformly R=LLM and stored
as `σ*_LLM` ([[llm-native-source-human-render-at-boundary]]): the layman is never shown — and never asked
to supply — a concept lattice, an anchor, a factorization, or a skill name. They answer yes/no questions
and receive a working person. This is the surface invariant the plan carries (`PLAN.md`): **atoms are
developer/agent-internal (R=LLM); `elicit` is the layman door (R=human); producers are pure reads;
namer/realizer/validator commit.**

### From elicited intent to domain-skills + an agent-as-person

1. **Recover** (`elicit`, R=human). The layman's hidden target concept `t` is recovered by binary-search
   over the candidate lattice — each question the distinction that bisects the live candidates by prior
   mass, stopping when one survives or no question is worth its burden. Output: a concept with `gloss`
   filled, `anchor`/`factorization` still `⊥`. **No commit** — `elicit` is a pure read.

2. **Factor + name + realize** (`exemplify`, R=LLM). The recovered concept seeds `produce`. Conceptualize
   closes the lattice `C_R` (the domain's primitives and their factorizations), signify assigns each its
   canonical σ\*\_LLM anchor (injective; coalescing any over-fine cut), materialize emits the bipartite
   normal form. `accept` refuses unless the factorization round-trips equivalent-or-better and is minimal.
   The **namer/realizer/validator commit** — this is where the durable corpus delta is written.

3. **Recompose into domain skills.** The accepted CSF is materialized under the **`file` strategy**: each
   composite of `kind: skill` becomes a canonically-named cell whose body composes its factor-primitives
   by reference (`[[lexicon#^anchor]]`), never restating them. These are the **domain skills** — the verbs
   the new person can perform. They are σ*\_LLM-anchored like every other corpus cell; there is no separate
   "layman name" (one-level naming — a canonical anchor is legible *because\* canonical).

4. **Compose the agent-as-person.** The resolver assembles an [[ambient-person-agent]] — a persistent
   principal that is **of-a-subject** ([[subject-binding]] to the layman it serves), **self-clocked**,
   **truthful-by-constitution**, and **answerable**. (The new person is _not_ a founder: it is an ordinary
   scoped, domain-chartered member — `founder-charter` is the founder roster, not the composer of every
   person.) It **embodies dispositions and uses skills** (it does
   not composite skills): the genus stack —

   - [[principal-agency]] — decide-and-execute within intent, escalate only a genuine-fork;
   - [[sovereign]] — `principal-agency` given a **territory**: the agent owns its domain charter and is
     answerable for it;
   - [[continual-agency]] — `principal-agency` over the **temporal** axis: self-clocked, never dark across
     a wait, finds the next valuable move on a job's close;

   plus the agent-genus dispositions the resolver emits for every agent — and **invokes** the freshly-minted
   domain skills.

### Where `self-extend` sits

`self-extend` is the **orchestrator**, not a stage. Its `≜` composition is literally
`compose-person ∘ recompose-skills ∘ exemplify ∘ elicit`; its body cites those atoms and adds only the
single load-bearing fact they don't individually carry: **the human boundary lives at `elicit` and the
recompose-into-a-person tail is reflexive** (polis extends itself — [[mind-society]] grows its own
membership). Everything else is already a named atom, so `self-extend` restates nothing. It is what the
layman types; the atoms are what runs.

---

## Worked demo — toy domain: **meal-planning**

A textual walkthrough of one non-engineering domain end to end. _(Demo only — no demo cells are written to
the live corpus; the canonical names below are illustrative of what `signify` would mint at σ_\_LLM.)\*

### (a) The layman's opening intent

> "I want something that helps me figure out what to cook for the week. I've got a partner who's
> vegetarian, we're always short on time on weeknights, and I keep buying groceries we never use. I'd
> like it to just tell me what to make and what to buy."

Unstructured, R=human. It names no concept and no skill — it is a felt need.

### (b) The elicit questions + recovered concept

`elicit` runs binary-search over the candidate lattice, each question bisecting live candidates by prior
mass (it asks, it never proposes a solution):

| #   | Question (yes/no)                                                           | Answer | What it eliminates                                 |
| --- | --------------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| 1   | "Is the core need _deciding which meals_, rather than _cooking technique_?" | yes    | drops recipe-tutor / technique-coach candidates    |
| 2   | "Does it need to honor _fixed dietary constraints_ every time?"             | yes    | drops the constraint-free 'inspiration' candidates |
| 3   | "Is _weeknight time budget_ a hard input, not a nice-to-have?"              | yes    | drops the leisure/gourmet-planning candidates      |
| 4   | "Should it also produce the _shopping list_ from the chosen plan?"          | yes    | folds in provisioning; drops plan-only candidates  |
| 5   | "Does it track _what you already have_ to avoid waste?"                     | yes    | drops the buy-everything-fresh candidate           |

After Q5 one candidate survives. **Recovered concept** (`gloss` filled, `anchor`/`factorization` ⊥):

> _a constraint-aware weekly meal scheduler that selects meals satisfying fixed dietary and
> time-budget constraints, and derives a provisioning list net of current pantry stock._

`elicit` commits nothing; it hands this concept to the pipeline.

### (c) The CSF factorization (`exemplify`, R=LLM)

`conceptualize` closes the lattice `C_R` for the domain, finding the primitives and the composite's
factorization:

- **Primitives** (homed as lexicon blocks, `⟨anchor, gloss⟩`):
  - `dietary-constraint` — a hard predicate a meal must satisfy (e.g. vegetarian).
  - `time-budget` — the cooking-time ceiling for a given slot (weeknight vs weekend).
  - `pantry-inventory` — what is already on hand, decrementing demand.
  - `meal-candidate` — a dish with its constraint profile and prep time.
- **Composite** (factor-refs, `⟨anchor, {factor-anchors}⟩`):
  - `meal-plan` ≜ a constraint-satisfying assignment of `meal-candidate`s to slots under
    `dietary-constraint` ∧ `time-budget`.
  - `provisioning-list` ≜ the ingredient demand of a `meal-plan` minus `pantry-inventory`.

`signify` assigns each its σ*\_LLM anchor (injective; the names above *are\* the anchors). `materialize`
emits the bipartite normal form. `accept` checks: does reconstructing the recovered concept from
`{meal-plan, provisioning-list}` and their factors round-trip equivalent-or-better, with no redundant
concept? **PASS** → the factorization is `valid`.

### (d) The resulting canonically-named domain skills

`recompose` realizes the composites of `kind: skill` under the `file` strategy. Two verbs fall out (skills
anchor as **verbs** — the act, not the artifact):

- **`plan-meals`** (`/plan-meals`) ≜ composes `[[dietary-constraint]]` ∧ `[[time-budget]]` ∧
  `[[meal-candidate]]` → a `[[meal-plan]]`. (Selects the week's meals under the constraints.)
- **`provision`** (`/provision`) ≜ composes `[[meal-plan]]` ∖ `[[pantry-inventory]]` →
  `[[provisioning-list]]`. (Derives the shopping list net of stock.)

Each cell composes its primitives by reference and restates none of them. The layman never saw the word
"factorization" or named either skill.

### (e) The composed agent-as-person

The resolver composes an [[ambient-person-agent]] — call the instance **Remy** 🍳 — bound to the layman as
its subject:

- **of-a-subject** — bound to _this_ household; it knows the partner is vegetarian, that weeknights are
  tight, that pantry stock matters — knowledge-of-a-subject, not of-a-corpus.
- **self-clocked** — wakes on its own cadence (e.g. Sunday-morning plan the week; mid-week re-plan if a
  meal slips) rather than only on prompt.
- **truthful-by-constitution** — records what it actually planned and bought, marks what it inferred.
- **answerable** — acts under the household's delegated authority, every plan auditable.

It **embodies** the genus stack ([[principal-agency]] → [[sovereign]] over the meal-planning charter,
[[continual-agency]] over its weekly clock) and **invokes** `plan-meals` and `provision`. The layman typed
one paragraph; polis returned a person who plans their week and shops for it.

---

## Acceptance (slice δ gate)

- `self-extend.md` minted, `kind: skill`, `trigger: /self-extend`, composed from the pipeline atoms via
  the prose `≜` formula (composition derived from the `Bindings:` region).
- `verify.py` **PASS** (schema · refs · fences · symbols · operative · provenance · round-trip).
- Blind-equivalence on the minted `self-extend` cell: a fresh blind reader reconstructs the layman-door
  model from the cell alone, equivalent-or-better.
- No demo cells in the live corpus — the worked walkthrough lives **here**, in this design doc.
