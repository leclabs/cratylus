# B8 — R3 routing-manifest (mechanize reconstruction-completeness)

**State:** ready · **Lead:** Mav (emit + gate) + Nico (the routing unit, the acceptance semantics) · **Phase:** B (machinery) · **Dep:** B2 (done)

## Intent

Turn B2's **R3 (reconstruction-completeness vs Δ)** from a visible audit-line NOTE into a mechanical
gate. R3 asks "is every idea D carries homed in `F ∪ Δ` — no idea homeless?" — but it has no mechanical
proxy because routing is in-the-loop in the exemplify run, never persisted. The fix: make
`resolve`/`exemplify` **emit a routing manifest** (the persisted form of the routing decisions), then
gate R3 against it.

## Decided (COORDINATION, 2026-06-14)

- **Routing unit = the conceptualize fragment** — one `semantic-partition` cut = one idea (Nico's
  intake call). `routes[] = {fragment_digest, idea_gloss, home_slug, disposition, rank}`.
- **Keyed by content-digest, not source-location** — a normalized content-digest of the fragment is
  stable across source edits; source-location (`D#line-range`) is too brittle (an edit two lines up
  shifts every span). Mirrors how content-hash works for defs.
- Manifest shape (sketch): `{source, exemplified_at, reader, routes[], delta[]}` — one manifest per
  exemplified source `D`.

## Work

1. **(Mav)** `resolve`/`exemplify` emit one manifest per source `D` — `routes[]` keyed by normalized
   fragment content-digest, plus `delta[]` (fragments that stay in Δ, homed nowhere in F by design).
2. **(Mav)** R3 mechanizes in `gate_reconstruct()`: every `fragment_digest ∈ routes ∪ delta` (no
   unrouted fragment = no dropped idea), and every `routes[].home` resolves to a live cell (R1 already
   guarantees the home side; R3 adds the **coverage** side).
3. **(Nico)** Confirm the normalization rule for the fragment digest and the disposition vocabulary
   (`reuse | mint | delta`) match the intake semantics.

## Done-when

- An exemplify run persists a routing manifest for its source.
- `gate_reconstruct()` R3 reads the manifest: an unrouted fragment (dropped idea) FAILS; full coverage
  PASSES. R3 is no longer a NOTE — it's a gate.
- The oracle's verify line reads "reconstruct (R1+R2+R3)" — all three mechanical.
