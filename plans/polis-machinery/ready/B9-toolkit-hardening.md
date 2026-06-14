# B9 — toolkit-hardening (verify/composer robustness)

**State:** ready · **Lead:** Mav (machinery) + Nico (the register/corpus truth-sources) · **Phase:** B (machinery) · **Dep:** —

## Intent

Close three known toolkit robustness gaps — all "the gate doesn't yet enforce a rule the corpus already
obeys." Each is a `verify`/composer hardening; none blocks other work, but each removes a class of silent
defect (a rule isn't real until the gate enforces it). Bundled because they're one orthogonal concern:
**make the projector refuse what it currently lets pass silently.**

## The three gaps

### (1) Symbol-coverage lint — Nico has a calibrated script, ready to wire

**Gap (toolkit/AGENTS.md "Verify gaps"):** *"No symbol-coverage lint. Manual check when a new law lands:
fence-chars − symbol-table − definienda = ∅."* Today it's a manual check; automate it as a `verify` gate.

**Truth source (Nico's):** `references/formal-symbolic-notation.md` (the symbol table) + the register rule
(fences carry only declared symbols + the cell's own definienda; never `[[ ]]`).

**Calibration (Nico ran the manual check 2026-06-13 — corpus is CLEAN; these are the exemptions the lint
must encode, learned from the false-positives):**
- **Include the full table** — col 1 of the notation doc, *including* `·` (U+00B7, row 54 list-separator)
  and the compound forms (`──op──→` row 53, `∃!`, `f : A → B`). A naive glyph set that drops `·` false-flags
  three cells.
- **Exempt Greek letters** (`η σ Φ Δ ρ λ …`) — they're definienda-class variables a cell defines locally.
- **Exempt subscripts/numeric decoration** (`₀ ₁ ₂ ᵢ ⱼ`) — they attach to definienda (C₀, cᵢ, D₁), part of
  the variable name.
- **Decide fenced-diagram policy** — `sharded-plan-layout` has a ```text **directory-tree** (`├ └ ─`); that's
  a diagram fence, not a formal-logic block. Either exempt diagram fences (e.g. a fence whose content is
  tree/ascii-art) or whitelist box-drawing. Nico's lean: **exempt non-formal fences** (the register rule is
  about *formal* blocks); a `lang`-tagged or heuristic test.
- **Under-documented but legitimate:** `…` ("and so on", in `materialize`'s `{ file, document, … }`) and an
  in-fence prose `—`. Either add `…` to the table (Nico will, if the lint wants it declared) or exempt.

**Reference script (Nico's, working — `fence_lines`-based, run from `packages/mind`):** flags every glyph in
a fence interior that is not ASCII, not in the table, not Greek, not a subscript. Returns CLEAN on the live
corpus once `·`/subscripts/Greek are exempted. Mav: wire as `gate_symbols()` in `verify.py`, PASS-gated; the
exemption set above is the calibration. Nico owns any table additions the lint decides to require.

### (2) Empty-skill-body operative-content check

**Gap:** *"Round-trip PASSes on an empty skill body — no operative-content check yet."* A skill cell with a
valid front-matter + heading but no operative body projects a vacuous SKILL.md and passes verify. Add a check
that a `kind: skill` cell carries operative content (more than heading + formula). Nico defines "operative
content" (the acceptance bar); Mav gates it.

### (3) `skill.py` fenced-`≜`-as-formula root fix

**Gap (root cause of the recurring empty-provenance bug):** `skill.py` reads the *first prose `≜` line* as the
composition formula and correctly ignores fenced `≜` — but when a skill's only early `≜` is fenced math, the
provenance composes empty *silently*. Nico has cell-side-fixed every instance (exemplify `e19f895`;
conceptualize/materialize/signify `efcccd5`), but the composer should **degrade visibly**: if a `kind: skill`
cell composes empty provenance, emit a NOTE (it already does in the audit path) and consider it a verify
warning, so a future skill can't regress silently. (Cell-side is clean now; this prevents recurrence.)

## Done-when

- `verify.py` runs a symbol-coverage gate: a fenced glyph outside (table ∪ definienda ∪ exemptions) FAILS;
  the clean corpus PASSES.
- A skill cell with an empty operative body FAILS verify; populated skills PASS.
- A skill that composes empty provenance surfaces visibly (NOTE → warning), never silent.
- toolkit/AGENTS.md "Verify gaps (open)" updated as each lands.
