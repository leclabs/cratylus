# t-drain-the-ratchet

**Wave 2.** Migrate every pinned site; the ratchet reaches ∅ and is deleted.

## Intent

23 sites resolve a root by counting hops. Each becomes a call to the helper, and the pin
comes off as it lands.

## Constraints

- **Re-census; do not trust the roster.** The count was measured at `77dfd3f6` and the
  gate's own scan is the authority.
- **Some sites are correct today by luck** — `test-deploy-drift-notice.sh` carries a 5-hop
  `cd` that survived a move only because the source and destination sat at equal depth. A
  site that happens to work is still a site that encodes depth; migrate it.
- **Fixture sites need the temp-dir behaviour, not the checkout's root.** Several suites run
  the subject inside `mkdtemp`; passing the wrong start directory silently repoints them at
  this checkout and the test still passes. Check what each site is asking ABOUT.
- Land in batches with the tree green between; a 23-site sweep whose intermediate states are
  red cannot be bisected.
- **When the last pin comes off, delete the ratchet AND its shrink-only leg**, and say so in
  the commit. The gate gets strictly stronger for it.

## Deps

`t-positional-path-gate`

## Accept

1. The gate's ratchet is empty, then absent.
2. A fresh scan finds zero ≥2-hop paths outside the gate's own specimens.
3. `pnpm verify` + `pnpm typecheck:test` green; the render oracle unmoved (these are test
   and tooling sites, not projected cells — if it moves, say what projected changed).
