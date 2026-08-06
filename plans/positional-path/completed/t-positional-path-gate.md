# t-positional-path-gate

**Wave 1.** The law: a path built from a COUNT of parent hops is convicted.

## Intent

The helper exists; nothing yet stops the next author from writing `join(here, '..', '..')`.
A rule in a comment competes with everything else in context and loses when the work gets
interesting — this one must be a gate.

## The predicate

Convict, per authored source under `packages/*/{src,tooling,targets,test}`:

- **TS/mjs** — a `join(...)`/`resolve(...)` call whose argument list contains **≥2** `'..'`.
  One `'..'` is fine and common (`join(here, '..', 'tooling')`); two is where the count
  starts encoding a directory depth the reader cannot see.
- **shell** — a line containing `(\.\./){2,}`.

Exonerate: `dirname(fileURLToPath(import.meta.url))` and `$(dirname "$0")` on their own —
naming a file's OWN directory is not a count and cannot go stale.

## Constraints

- **Ratchet, shrink-only, with an explicit end.** 17 TS + 6 shell sites are live at
  `77dfd3f6`; the gate lands red without a pin list. When the ratchet empties, **delete the
  list and its shrink-only leg** rather than leaving them at zero — this corpus has already
  ruled that an exemption list with no members is a mechanism with no subject.
- **The reach leg counts SITES EXAMINED, not violations found.** The honest steady state is
  zero violations, so a violation-counting reach leg reads green for having looked at
  nothing. Print the denominator.
- **Both fixtures.** Convicting proves it bites; exonerating must include a single-`'..'`
  join and a bare `dirname(fileURLToPath(...))`, or the gate bans the correct form too.
- This gate's own file will contain the offending shapes as specimens — the haystack-contains-
  the-needle hazard the veracity gates already name. Resolve it the way they do.

## Deps

`t-root-resolution-helper`

## Accept

1. Convicts a synthetic 2-hop join and a 2-hop shell line; exonerates the 1-hop and
   self-location forms. Verified by running, not by reading.
2. The reach leg reds if the scan is narrowed — proven by narrowing it on purpose.
3. Ratchet contains exactly the measured live sites, each re-derived rather than copied.
4. `pnpm verify` + `pnpm typecheck:test` green.
