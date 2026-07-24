# T-sweep — enumerate and reconcile every reference to the autonomy anchors

## Objective

The autonomy anchors are referenced across tests, fixtures, and gates. Any rename or split must sweep
every dimension that touches them (`rename-enumerates-every-dimension`) — the renamer's own scope-cuts
hide the seams. Reconcile all of them and prove nothing dangles.

## Static inputs (census-surfaced; re-run the sweep, do not trust this list as complete)

- `packages/agent-canon/test/reader-density.test.ts` — references the pole value verbatim.
- `packages/agent-forge/test/catalog/enumerate.test.ts` — enumerates autonomy values.
- `packages/agent-forge/test/stories/E6/S4.elicit-markers.test.ts` — candidate slugs.
- `packages/agent-canon/test/cratylism.test.ts` — the autonomy sign decode.
- `packages/agent-forge/test/adapters/codex/anatomy.test.ts` — autonomy value in a fixture.
- `packages/agent-forge/test/adapters/ir-bridge/agent-canon.agent-forge.json` — generated fixture.
- `packages/agent-canon/test/fixtures/generated/agent-vector.md` — generated fixture.
- any byte-lock / projection gate keyed on the autonomy dimension.

## Constraints

- Re-run a full `rg -nw` sweep for each old and new anchor across `packages/` — do not rely on the list
  above; the census is a starting point, not a guarantee.
- Generated fixtures regenerate from source, never hand-edit — regenerate and verify the diff is exactly
  the anchor change (`generated-banner-absence` trap: confirm which files are generated before editing).
- Non-vacuous verification: every "no remaining reference" grep must be paired with a control that must
  match (`grep-false-green`).

## Dependencies

`T-mece` (all anchor changes must have landed).

## Outputs

- Every test/fixture/gate reconciled; generated ones regenerated from source.
- A non-vacuous grep proof that no old anchor survives and every new one resolves.
- Full suite + typecheck green.

## Acceptance

- `pnpm test` + `pnpm typecheck` green across all packages; `pnpm canon:project` clean.
- A control-backed grep showing zero surviving old-anchor references and every new anchor resolving in
  both source and generated artifacts.
- **Falsifier:** any dangling old-anchor reference; a generated fixture hand-edited instead of
  regenerated; or a "clean" grep with no proven-matching control.

---

## Findings (executed) — green; anchor preserved ⇒ no dangling reference

T-mece appended a residue (`human-on-the-loop` → `human-on-the-loop ⟨resting ·
phase-state⟩`) rather than renaming, so by construction **no old anchor dangles** —
every `human-on-the-loop` reference remains a valid prefix/substring.

**The sweep surfaced two REAL cross-cell defects** the per-shard verification missed
(the value of a full-suite dogfood): my T-persist/T-introspect-K formalBlocks carried
glyphs failing the SYMBOLS registry (`ℓ`, `≇`, `∋`, `∖`) and an em-dash failing the
zero-comment self-sufficiency gate. Fixed toward the fitter sign in `7c34ec3`
(register-clean), not by degrading — semantics unchanged.

**Non-vacuous grep proofs:**

- new value LIVE in projection: `human-on-the-loop ⟨resting · phase-state⟩` present
  in nico.md + mav.md (control `## Autonomy` matches — non-vacuous). ✓
- no EXACT-equality assertion of bare `'human-on-the-loop'` in any source test. ✓
- `enumerate.test.ts` uses `.startsWith('human-on-the-loop')` — holds under the
  residue append. ✓

**Green gate:** `pnpm typecheck` 8/8, `pnpm test` 7/7 (agent-forge 121 · agent-canon
14 · agent-memory 13 · agent-runtime 3), `pnpm canon:project` clean.

**Generated fixtures:**

- `test/fixtures/generated/agent-vector.md` — the agent is `scribe`, a FIXTURE-ONLY
  agent (no live `scribe.ts`); self-contained, unaffected by the live-cell change.
- `test/adapters/ir-bridge/agent-canon.agent-forge.json` — a frozen IR snapshot for
  adapter round-trip identity (regenerated manually via `emit_ir.py`), read statically.
  It carries ZERO `human-on-the-loop`, so my change does not touch it.

**Correction (an earlier draft of this note was WRONG).** I first flagged the json as
"carrying stale `principal-ic` from the pole fix `ef1ce87`." That was a token-collision
misread (`confidence ≠ confirmation`): `principalIC` (the retired autonomy _pole_ value,
renamed `principalSelf` in `ef1ce87`) does NOT appear in the json at all. The
`principal-ic` that IS in the json is a different, LIVE concept — the Principal Engineer
_archetype_ (`src/agents/principal-ic.ts`), a disposition root nico/mav/reviewer
specialize. `rg -o` stripped the context and I asserted staleness from a bare token
match. No `ef1ce87`-era autonomy staleness exists in the json. The json is a frozen
snapshot generated from the now-removed `ideas/*.md` architecture (a valid fixed IR for
adapter round-trip identity, not tracking live agents) — orthogonal to this change.
