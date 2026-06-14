| Symbol                | Name                            | Meaning                                                                   |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| `≜`                   | defined as                      | The left side is defined to mean the right side.                          |
| `:=`                  | is assigned / defined as        | Common for definition or assignment.                                      |
| `≡`                   | identical / equivalent          | Strict identity, logical equivalence, or congruence depending on context. |
| `≈`                   | approximately equal / analogous | Similar, approximate, or analogically equivalent.                         |
| `≠`                   | not equal                       | The two terms are not identical/equivalent.                               |
| `≅`                   | isomorphic                      | Structurally equivalent though not numerically identical.                 |
| `∴`                   | therefore                       | The conclusion follows from prior claims.                                 |
| `∵`                   | because                         | Gives the reason, ground, or premise.                                     |
| `→`                   | implies / leads to              | Conditional implication, causal direction, derivation, or transformation. |
| `⇒`                   | entails / implies               | Stronger formal implication.                                              |
| `↔`                   | mutual implication              | A implies B and B implies A.                                              |
| `⇔`                   | if and only if                  | Biconditional equivalence.                                                |
| `¬`                   | not                             | Negation.                                                                 |
| `∧`                   | and                             | Conjunction.                                                              |
| `∨`                   | or                              | Disjunction.                                                              |
| `⊕`                   | exclusive or / direct sum       | Either-or in logic; structured combination in algebra.                    |
| `∀`                   | for all                         | Universal quantification.                                                 |
| `∃`                   | there exists                    | Existential quantification.                                               |
| `∄`                   | there does not exist            | Negated existential quantification.                                       |
| `∈`                   | element of                      | A is a member of B.                                                       |
| `∉`                   | not element of                  | A is not a member of B.                                                   |
| `⊂`                   | proper subset                   | A is contained in B but is not equal to B.                                |
| `⊆`                   | subset                          | A is contained in B and may equal B.                                      |
| `⊄`                   | not subset                      | A is not contained in B.                                                  |
| `∅`                   | empty set                       | No members; null collection.                                              |
| `∪`                   | union                           | Combination of members from sets.                                         |
| `∩`                   | intersection                    | Shared members between sets.                                              |
| `⊢`                   | proves                          | Syntactic entailment; derivable within a formal system.                   |
| `⊨`                   | models / semantically entails   | Semantic entailment; true in all relevant interpretations/models.         |
| `⊤`                   | truth                           | Logical truth / tautology.                                                |
| `⊥`                   | falsehood / contradiction       | Logical falsity, contradiction, or absurdity.                             |
| `□`                   | necessarily                     | Modal necessity.                                                          |
| `◇`                   | possibly                        | Modal possibility.                                                        |
| `∝`                   | proportional to                 | Varies in proportion with.                                                |
| `∑`                   | sum                             | Aggregation or summation.                                                 |
| `∂`                   | partial                         | Partial aspect, partial derivative, or dependent dimension.               |
| `λ`                   | lambda abstraction              | Function abstraction or anonymous function.                               |
| `Q.E.D.`              | quod erat demonstrandum         | “Which was to be demonstrated”; proof complete.                           |
| `∎`                   | tombstone                       | End of proof.                                                             |
| `│`                   | such that                       | The set-builder separator: `{ x │ P(x) }` — the x for which P holds.      |
| `×`                   | Cartesian product               | Pairs drawn from two sets; the relation space `A × B`.                    |
| `⋃`                   | union over a family             | n-ary union of a collection of sets.                                      |
| `⊃`                   | proper superset                 | A contains B and is not equal to B.                                       |
| `⊇`                   | superset                        | A contains B and may equal B.                                             |
| `∃!`                  | there exists exactly one        | Unique existence.                                                         |
| `⇀`                   | partial function                | Defined on only part of its domain; an element may have no image.         |
| `↦`                   | maps to                         | The image of a specific element under a map or assignment table.          |
| `≽`                   | equivalent or better            | Dominance order: at least as good as (house use: round-trip acceptance).  |
| `f : A → B`           | has signature                   | f is a map from A to B; compose with `⇀` for partial maps.                |
| `dom(f)` · `range(f)` | domain / range                  | The set where f is defined / the set of f's images.                       |
| `──op──→`             | labeled step                    | A `→` carrying the operation that performs it (pipeline arrows).          |
| `·`                   | list separator                  | Compact "and": enumerates coordinate items within one clause.             |
| `…`                   | ellipsis / and so on            | Continues an enumeration: the remaining members left implicit (`{ a, b, … }`). |

## Register rule — anchors in prose, symbols in fences

A fenced formal block contains **only declared symbols** from this table plus the cell's own definienda — never `[[ ]]` anchor syntax. An anchor is a **prose-register** device (composition machinery, rewritten per harness); inside a fence it is a category error, regardless of how any renderer treats it. A cross-cell operator is **bound once at the boundary**: cite the `[[anchor]]` in surrounding prose (e.g. a "Resolve from context" bullet), name the bare symbol it binds, and use only that symbol inside fences. Likewise `≜` inside a fence is always this table's math symbol — a cell's _composition formula_ (the `≜` line the composer reads) lives in prose, never in a fence.
