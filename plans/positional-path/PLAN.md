# positional-path

> A path built from a COUNT of parent hops encodes a file's current location in someone
> else's body. The coupling is invisible at the definition site, and only a move reveals it.

## Why — five instances in one plan, measured

`toolkit-dissolution` moved code between directories and broke five path computations. Every
one failed in a way that read as _"found nothing"_ rather than _"looked in the wrong place"_:

| site                          | shape                                 | how it presented                                                           |
| ----------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `render-oracle.sh`            | `cd "$(dirname "$0")/../../../../.."` | `no baseline at packages/canon/.render-oracle` — reads as a missing FILE   |
| `project-targets.ts`          | `join(here, '..', '..')`              | `cellTargets()` returned `[]`; two bin-name sweeps went **green and dark** |
| `plan-set.ts`                 | `join(here, '..', '..')`              | designator oracle collapsed 200+ ids → 0                                   |
| `deploy-drift-notice.test.ts` | `join(here,'..','src','toolkit',…)`   | `worker exited 127`                                                        |
| `memory-nudge.test.ts`        | same                                  | `worker exited 127`                                                        |

Two of the five were silent: an empty list is not an error, so the gate that consumed it
reported clean. That is the harm — not the breakage, the **quiet** breakage.

## Live population (measured at `77dfd3f6`)

**17** TS `join(...)` calls with ≥2 `'..'`, **6** live shell lines with ≥2 `../`. Across
`packages/canon/{test,tooling}` almost entirely. Full roster is re-derivable by the scan the
gate ships; do not trust this count without re-measuring.

## The shape of the fix

Three known-good replacements, in preference order:

1. **Ask, don't count** — `git rev-parse --show-toplevel`, with a positional `cd` only as a
   no-`.git` fallback. Already applied to `render-oracle.sh`; it is the reference.
2. **Anchor on a marker** — walk up for `pnpm-workspace.yaml` / `package.json` with the
   expected `name`. Works in a tarball.
3. **Inject** — take the root as a parameter with a self-located default, which is what
   `plan-set.ts`'s `PlanSetContext` already does for its callers and tests.

## Shards

| state   | task                       | concern                                                                   |
| ------- | -------------------------- | ------------------------------------------------------------------------- |
| ready   | `t-root-resolution-helper` | one shared way to find the repo root, in each language                    |
| pending | `t-positional-path-gate`   | the law: convict ≥2-hop positional paths; both fixtures; ratchet the rest |
| pending | `t-drain-the-ratchet`      | migrate the 23 sites; the ratchet must reach ∅ and be deleted             |

## The trap this plan must not fall into

A gate landing while 23 sites violate it reds the tree for correct work, so the ratchet is
unavoidable **and must be shrink-only with an explicit end**. This corpus has already learned
that an exemption list with no members is a mechanism with no subject — so when the ratchet
empties, the list and its shrink-only leg are DELETED rather than left at zero.

Second trap: the gate's own reach. It must count the SITES IT EXAMINED, not the violations it
found — the honest steady state is zero violations, and a violation-counting reach leg reads
green for having looked at nothing.
