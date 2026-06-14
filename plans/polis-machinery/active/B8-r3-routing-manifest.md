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

**Schema-field rule (clarified 2026-06-14, from the consumer build):** in the manifest, a `routes[]` entry
HAS a `home_slug` (homed in F), so **`routes[].disposition ∈ {reuse, mint}`** only — `delta` is *not* a
routes disposition. A delta fragment lives in the **`delta[]`** bucket, whose membership *is* the delta
disposition (so `delta[]` entries carry no `disposition` field). The vocab is total over fragments; the
*placement* is `{reuse,mint} → routes[]`, `delta → delta[]`.

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

## Consumer half landed (Mav agent → verified + integrated by Nico, 2026-06-14)

**The R3 gate (consumer) is built; the producer (emit) is the remaining half — Nico's follow-on.** B8 is
**active**, not done: R3 stays a NOTE on the current corpus (no manifests yet); it activates when a producer
emits one.

- `verify.py` `gate_reconstruct()` R3: `_load_manifest()` parses + shape-validates (`ManifestError` → FAIL;
  a malformed manifest is a **hard error**, never a silent skip); the gate asserts every `routes[].home_slug`
  resolves to exactly one live cell (shares `_home_index()` with R1) and routes XOR delta (no double-listing).
  **Degrade-visibly:** no manifest ⇒ R3 NOTE + PASS line `(R1+R2; R3 manual)`; ≥1 manifest ⇒ `(R1+R2+R3)`.
- **Manifest location (Nico confirmed):** `packages/mind/.manifests/<source>.json` — dotted, outside `ideas/`
  (no slug collision), one per exemplified source. **Commit-vs-gitignore deferred to the producer wiring**
  (it's a workflow call — left un-gitignored for now; no manifests exist).
- **Nico's schema tightening:** `routes[].disposition ∈ {reuse, mint}` (was `{reuse,mint,delta}` — `delta` is
  the `delta[]` bucket, not a route disposition; see the field rule above). Verified the fixture + corpus stay
  green under it.
- `test_reconstruct.py` R3 cases: full-coverage manifest PASSES, dropped/unresolvable-home FAILS, malformed
  (bad JSON / missing key / out-of-vocab disposition) is a hard error, no-manifest degrades to NOTE. Suite 9/9;
  current corpus a **no-op** (verified independently before integrating).

**Digest primitive landed (2026-06-14, `06e61dd`).** `core/digest.py::fragment_digest(text)` →
`"sha256:"+sha256(normalize(text))`, normalize = NFC + whitespace-collapse + trim (v1, conservative — the
unambiguously-cosmetic transforms; markdown-decoration normalization is the deferred refinement that needs
real fragments). Invariance verified independently (whitespace + NFD/NFC → equal digest; distinct meanings →
distinct). Pure addition, dormant, suite 10/10. So the producer now has its digest primitive in hand.

**Producer step authored (2026-06-14, exemplify `dd45370`).** Added `exemplify.md` **step 6** — on accept,
emit `.manifests/<source>.json`: one entry per fragment `c ∈ C`, `fragment_digest`-keyed (via
`core.digest`), homed-in-F → `routes[]` (disposition reuse|mint), homed-nowhere-by-design → `delta[]`, every
fragment in exactly one. So the run now *instructs* manifest emission. verify PASS (provenance + symbols +
harness clean); the compact `jsonc` schema in the skill matches the consumer's.

**All three B8 setup pieces are now WIRED end-to-end:** consumer gate (`gate_reconstruct` R3) + digest
primitive (`core.digest`) + producer step (`exemplify` step 6). The machinery + instruction are complete.

**Remaining = exercise it once (Nico, needs a real `/exemplify` occasion):** R3 stays a NOTE until an actual
exemplify run produces a manifest — only then does the producer→consumer round-trip get *verified* and R3 flip
live (`R1+R2+R3`). No raw intake is pending, so this awaits a real occasion (Operator-intent-driven); I won't
fabricate a source to mint meaningless artifacts. The first real exemplify run closes B8 and validates the
markdown-normalization refinement against actual fragments. **B8 is setup-complete, activation-pending-a-run.**

---

*(The digest-normalization invariant above is the acceptance contract the producer's byte-rule must satisfy.)*
