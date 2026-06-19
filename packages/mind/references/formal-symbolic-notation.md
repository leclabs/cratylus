# Formal Symbolic Notation

The corpus's shared operator vocabulary — the declared table `T` of [[self-sufficient-formalism]]'s `closed(B)`. **One glyph ⇔ one sense**: injective, like [[signify]] on names — a glyph carries a single meaning across every fence, fixed by its `Sense` and pinned by its `Signature`. It is the ground `T`, so it **declares rather than derives** — the one table exempt from "every symbol registered."

The registry is **agent-audience** ([[reader-prior-projection]] · [[anchor-legibility-budget]]): each row carries the dense sense-name and the type an agent-reader dereferences from its priors — no human-comprehension prose; a human reads it through an agent teacher (the floor's dereference channel, relocated off-surface). **Operators only** — a cell's local variables (Greek `η σ Φ`, subscripts `cᵢ D₀`) are its own definienda `D`, declared in-cell, never here; diagram art (box-drawing trees, pipeline rules) is layout, not logic. **Comprehensive over actual use** — a glyph earns a row by being used; an unused glyph is not pre-declared. **Standard math assumed** — universal ASCII notation (function application `f(x)`, `dom`/`range`, `argmin`/`max`/`min`) is dereferenced from priors, not listed; this table pins the non-ASCII operator glyphs and the package's own conventions. So a bare token a reader can't place is _standard-assumed if ASCII-conventional, a missing anchor otherwise_ — never silent.

`T` resolves the **first column only**: the meaning columns are read by agents (and humans, via a teacher), never by the gate.

**Definition & comparison**

| Glyph | Sense     | Signature                                                                     |
| ----- | --------- | ----------------------------------------------------------------------------- |
| `≜`   | defines   | `name ≜ expr` — the left is defined to mean the right                         |
| `≠`   | distinct  | `T × T → Prop`                                                                |
| `≽`   | dominates | `T × T → Prop` — at least as good as (house: round-trip acceptance)           |
| `≺`   | precedes  | `T × T → Prop` — the canonical order (house: shortlex over anchored concepts) |

**Propositional logic**

| Glyph | Sense         | Signature                                                 |
| ----- | ------------- | --------------------------------------------------------- |
| `¬`   | not           | `Prop → Prop`                                             |
| `∧`   | and           | `Prop × Prop → Prop`                                      |
| `∨`   | or            | `Prop × Prop → Prop`                                      |
| `⇒`   | implies       | `Prop × Prop → Prop`                                      |
| `⇔`   | iff           | `Prop × Prop → Prop`                                      |
| `⊥`   | contradiction | `Prop` — the false constant; `… ⇒ ⊥` is "refuse / absurd" |
| `∴`   | therefore     | `Prop ∴ Prop` — connective                                |
| `∵`   | because       | `Prop ∵ Prop` — connective                                |

**Quantifiers**

| Glyph | Sense      | Signature    |
| ----- | ---------- | ------------ |
| `∀`   | for-all    | `∀ x : Prop` |
| `∃`   | exists     | `∃ x : Prop` |
| `∄`   | none-exist | `∄ x : Prop` |

**Sets**

| Glyph | Sense         | Signature                                                                   |
| ----- | ------------- | --------------------------------------------------------------------------- |
| `∈`   | member        | `El × Set → Prop`                                                           |
| `∉`   | non-member    | `El × Set → Prop`                                                           |
| `⊆`   | subset        | `Set × Set → Prop` — contained, may equal                                   |
| `⊇`   | superset      | `Set × Set → Prop` — contains, may equal                                    |
| `∪`   | union         | `Set × Set → Set`                                                           |
| `∩`   | intersection  | `Set × Set → Set`                                                           |
| `⋃`   | n-ary-union   | `Set[Set] → Set`                                                            |
| `∅`   | empty         | `Set`                                                                       |
| `×`   | product       | `Set × Set → Set` — the pair space `A × B`                                  |
| `℘`   | power-set     | `Set → Set[Set]` — the set of all subsets                                   |
| `⊊`   | proper-subset | `Set × Set → Prop` — contained, not equal                                   |
| `⊔`   | join          | `Set[El] → El` — least upper bound (house: closure of the union of intents) |

**Maps**

| Glyph | Sense         | Signature                                                                                   |
| ----- | ------------- | ------------------------------------------------------------------------------------------- |
| `→`   | maps          | `A → B` — the type of arrows from A to B                                                    |
| `↦`   | sends         | `x ↦ y` — the image of a specific element                                                   |
| `⇀`   | partial-map   | `A ⇀ B` — some elements have no image                                                       |
| `↣`   | injective-map | `A ↣ B` — distinct inputs send to distinct images                                           |
| `⊨`   | entails       | `X ⊨ Y` — every model of X is a model of Y; a model/line satisfying a spec is the unit case |

**Enumeration**

| Glyph | Sense     | Signature                                        |
| ----- | --------- | ------------------------------------------------ |
| `·`   | and-list  | `a · b · c` — coordinate items within one clause |
| `…`   | and-so-on | `{ a, b, … }` — remaining members left implicit  |

## Register rule

A fenced formal block carries **only** these glyphs plus the cell's own definienda — never `[[ ]]` anchor syntax (an anchor is a prose-register device; inside a fence it is a category error, regardless of how a renderer treats it). A cross-cell operator is **bound once at the boundary**: cite the `[[anchor]]` in adjacent prose, name the bare symbol it binds, then use only that symbol inside the fence ([[self-sufficient-formalism]]'s `β`). Likewise a cell's composition formula — the `≜` line the composer reads — lives in prose, never in a fence; inside a fence `≜` is always this table's _defines_.

Two ASCII conventions the gate cannot enforce (both `|` and `│` exempt), so stated here: the **set-builder bar is ASCII `|`** (`{ x | P(x) }`), never box-drawing `│` (U+2502, reserved for diagram art — directory trees, pipeline rules); a **signature** is written `name : Domain → Codomain`.
