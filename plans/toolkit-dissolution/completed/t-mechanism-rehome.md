# t-mechanism-rehome

**COMPLETE — 1 of 9 files moved, and the other 8 are the finding.**

## What moved

`formal-block-self-sufficiency.ts` → `@cratylus/forge/validate`. Signature
`(name, block: string) → Finding[]`, zero imports, zero canon coupling. Genuinely
doctrine-agnostic, and forge owns validation.

## What did NOT move, and why — the audit was wrong about all eight

The plan inherited an audit that classified these by CONCERN. Concern is necessary and not
sufficient: a relocation is only free if the destination package is permitted to hold the
edges the module carries. Four carry a canon edge their destination may not have —
**runtime depends on nothing; canon reaches forge as DATA, never as a dependency**:

| module                 | edge                       | destination forbids it |
| ---------------------- | -------------------------- | ---------------------- |
| `plan-set.ts`          | → `../plan-states.js`      | runtime → canon        |
| `plan-set-cli.ts`      | → `plan-set.ts`            | inherits the above     |
| `symbol-probe-gate.ts` | → `../operator-lexicon.js` | forge → canon          |
| `project.ts`           | → `../manifest.js`         | forge → canon          |
| `scaffold-cli.ts`      | → `./project-template.js`  | invoke → canon         |

`plan-set` is the sharpest: the corpus already knows the answer, and it is not a move.
ARCHITECTURE property 4 says everything corpus-specific reaches runtime **as configuration
the projection emitted** — which is exactly how `CANONICAL_EVENTS` reaches it. Plan states
must arrive the same way. That is a design change, not a relocation, and it belongs in its
own plan.

**`structural-parsimony.ts` was moved and then moved back.** `forge/src/validate/index.ts`
carries a standing warrant for its location — _"its witnesses quantify over canon's
`agents/`, name `ResolvedAgent`, and read canon's `mark:{emoji,hue}` token, so no injection
could make it doctrine-agnostic"_ — and I moved it without reading that first, then verified
the claim and found it exactly true. Read the original warrant for whatever a decision
undoes; this one was written to prevent the move I was making.

`praxis.sh` and `cold-oracle.sh` are shell with no imports, so nothing forbids the move —
but their TS twins cannot follow, and splitting a mechanism across two packages to satisfy a
directory name is worse than the directory name.

## Consequence for the plan

`src/toolkit/` **cannot be dissolved**, because the audit's premise — that its contents
decompose into other packages — is false for 8 of 9. What remains is coherent, not residue:
canon's own build and validation tooling, which must live in canon because it reads canon's
doctrine.

The original defect stands and has a different repair: a build-EXCLUDED subtree inside `src/`
makes the directory name false. The repair is to move the remainder **out of `src/`**, not
out of canon. `t-build-scripts` and `t-generated-shell` are re-scoped accordingly.
