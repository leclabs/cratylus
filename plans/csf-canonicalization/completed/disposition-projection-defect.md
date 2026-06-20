# ζ — Fix the disposition-projection defect (impl spec)

**Slice.** ζ · standalone (orthogonal; no spine dep). **Owner.** Nico (disposition) + Mav (composer).

**Objective.** `recommendation-style-consensus-quality-pick` is composed into `principal-ic` yet does
not fire (agents hand option-menus instead of deciding). Find the root cause — **projection
density-collapse** vs **embodiment gap** — and fix the machinery so a composed load-bearing disposition
reaches the running agent with force.

**Preconditions (apply the session finding).** A disposition that reads as a _soft lean_ is **homeless**
in the default ontology and gets **density-collapsed in projection** (treated as compressible), so it
never reaches the agent. The fix lever is the **organ / `render: verbatim`** mechanism
(`packages/mind/ideas/AGENTS.md`): an organ cell's operative body projects whole and density-immune.
Composer support is tracked as polis-machinery **B7**.

**Operations.**

1. **Reproduce.** Instantiate `principal-ic`; pose a decision with one obviously-best option. Observe:
   decide, or menu? Capture the projected agent def at its reader profile.
2. **Localize.** Is `recommendation-style-consensus-quality-pick` present in the projected output?
   - **Absent** → projection density-collapse (the disposition pointer was compressed away).
   - **Present but inert** → embodiment gap (reaches the agent but without force).
3. **Fix.**
   - density-collapse → mark the disposition load-bearing: make it an **organ** (`render: verbatim`) or
     otherwise density-immune so the composer emits it whole (or land the B7 composer fix).
   - embodiment gap → strengthen embodiment to **imperative** force, not advisory (the forcing-vs-advisory
     distinction proven in the session's prompt work: advisory ~1/3 → mandatory 3/3).
4. **Regression.** Re-run step 1; confirm it decides. Add a check so the disposition can't silently
   density-collapse again.

**Artifacts.** root-cause note · the machinery/cell fix (organ mark or composer fix) · regression evidence.
**Acceptance.** `principal-ic` decides (no menu) on the repro; regression check; `verify.py` PASS. The
fix is **general** (covers every load-bearing disposition by construction); γ's corpus-wide re-audit
verifies it at scale.

---

## Resolution (ζ — done 2026-06-20, commit 9fea5f5)

**Repro.** A fresh `principal-ic` faced a decision with one obviously-best option (id scheme for an
append-only log). It **decided** — picked ULID, refused a pointless lateral swap to UUIDv7, grounded the
call against the actual codebase, returned one pick. **No menu.** The defect did not reproduce: the
disposition fires.

**Root cause (localized).** Neither an embodiment gap nor a _current_ density-collapse. The cell
`recommendation-style-consensus-quality-pick` is correctly marked `render: verbatim`, and its
`## Protocol` body reaches `principal-ic` whole (deployed render line 31) and `mav`'s SOUL — the
historical collapse was cured when the cell was marked verbatim. **The latent hole was in the gate:**
`verify.py`'s ROUNDTRIP loop _exempted_ verbatim organs from its token-presence check with a bare
`continue`, never asserting the body was actually present. A future composer regression that silently
dropped a verbatim body would pass unnoticed — the exact silent density-collapse this slice prevents.

**Fix (machinery, general by construction).** Converted the exemption into a **positive body-presence
assertion**: for every agent embodying a `render: verbatim` organ, the gate recomputes the organ's
`## Protocol` body (`render_organ(ref, slug)`) and FAILs ROUNDTRIP if it is absent from the rendered def.
Covers ANY load-bearing disposition — genus (`memory`) or embodied/transitive (`recommendation-style`) —
with no per-cell enumeration.

**Regression evidence.** `toolkit/test_verbatim_organ_guard.py`: intact organ verifies clean; a render
with the organ body stripped FAILs naming the collapse. `verify.py` PASS on the clean corpus (R1+R2+R3).
No corpus-cell mutation needed — the cell was already correct; the fix is entirely the gate.
