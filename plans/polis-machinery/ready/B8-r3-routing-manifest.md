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

## Nico-side spec (ready for Mav — step 3 done as far as is responsible solo)

The two things Mav waits on me for. Specified to the boundary of what's decidable without the emit code;
the byte-level canonicalization is explicitly co-design (it needs the run's actual fragment representation).

**1 — Disposition vocabulary (decidable now, mine — it's the intake/`[[anchor-routing]]` semantics).**
Each routed fragment carries exactly one disposition — the routing decision `[[signify]]`'s `η` made:
- **`reuse`** — `η(c)` resolved to an **existing** anchor in `F` (the fragment's idea already had a home; the
  manifest's `home_slug` is that extant cell). The common case.
- **`mint`** — no existing anchor fit, so `η` **minted** a new one ([[anchor-routing]]: never force an ill
  fit). `home_slug` is the newly-created cell. The B8 gate treats reuse/mint identically (both ⇒ a live home
  in `F`); the field records *which* for audit/provenance, not for the pass/fail.
- **`delta`** — the fragment is homed **nowhere in `F`** by design (it lives in `Δ` — a source-local fact,
  a project-trace, content that must NOT become a universal cell). Appears in the manifest's `delta[]`, not
  `routes[]`. R3 passes iff it is *declared* delta, never *silently* unrouted ([[hoare-elegance-no-permissive-defaults]]:
  the absence of a routing decision is ⊥, not a default-skip).
This is total over fragments: every fragment is `reuse | mint | delta`; **no fourth disposition** and no
fragment without one. An unrouted fragment (no disposition) is the dropped-idea R3 catches.

**2 — Digest-normalization invariant (the *principle* is mine; the byte rule is co-design).**
The unit is the **conceptualize fragment** (one `[[semantic-partition]]` cut = one idea), and the digest must
satisfy the conceptualize law `meaning(D₁) = meaning(D₂) ⇒ CA(D₁) = CA(D₂)` projected onto the digest:
**equal meaning ⇒ equal digest, and a cosmetic source edit (whitespace, markdown decoration, reflow) must
NOT change the digest.** That is the whole point of keying on content-digest rather than source-location.
So normalize *before* hashing: operate on the fragment's **de-palimpsested concept text** (post-CA, post-`dp`),
not the raw source span. Minimum canonicalization I can commit to as semantics: collapse runs of whitespace to
single spaces, trim, strip pure-decoration markdown (emphasis/heading markers), Unicode-NFC. **Co-design with
Mav (needs the emit reality):** the exact token set stripped, whether the digest covers the gloss too, and the
fragment's concrete in-run representation — pin these together when the emit side opens, don't guess byte rules
blind. The invariant above is the acceptance contract the byte rule must satisfy; Mav's algorithm is free under it.

*(Status: the semantics Mav asked for are settled — vocabulary fully, normalization to the invariant + principle.
B8 stays `ready`; it activates when Mav opens the emit side and we co-fix the byte-level canonicalization.)*
