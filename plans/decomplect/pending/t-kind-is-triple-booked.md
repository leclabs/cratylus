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

## Acceptance

- Each of the three concepts has a sign no other concept in the repo carries, derived not picked.
- A gate censuses field names across `schema/` and `forge/` and convicts one gloss under two signs —
  the same leg `t-definiens-vs-residue` establishes. **Build it once, not twice.**
- `MODEL.md`'s `Kind` is untouched, or its change is argued in its own commit.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 2
- **depends on** `t-definiens-vs-residue` · `t-coined-classification`
- **writes** `packages/forge/src/resolve/**`
- **compiles against** `packages/schema/src/index.ts` · `packages/schema/src/rule-cell.ts`
- **evidence** `packages/schema/src/index.ts` · `packages/forge/src/resolve/resolve.ts` · `MODEL.md`
- **dispatchable** no ruling owed
