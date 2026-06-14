# B9 — toolkit-hardening (verify/composer robustness)

**State:** completed · **Lead:** Mav (machinery) + Nico (the register/corpus truth-sources) · **Phase:** B (machinery) · **Dep:** —

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

## Outcome (Mav agent → verified + integrated by Nico, 2026-06-14)

**Done. All 3 gates shipped, independently verified, integrated** (cherry-pick of the agent's `0c43346` +
Nico's `…`-table decision).

- `verify.py` gains three PASS-gated stages (verify line now `… + symbols + operative + …`):
  - **`gate_symbols()` (SYMBOLS)** — every fence-interior glyph ∈ (table col-1 ∪ definienda-class ∪
    exemptions), else FAIL with `cell:line + glyph + U+codepoint`. `_declared_symbols()` loads the table
    **live** (no frozen copy — tracks the truth source). Exemptions = Greek (U+0391–03C9), subscripts
    (U+2080–2089, ᵢ, ⱼ), box-drawing (U+2500–257F, diagram art), em-dash. The reasoning is sound: these
    classes carry no formal-logic meaning, so exempting them can't mask a misused operator — the lint stays
    live on every fence.
  - **`gate_skill_operative()` (OPERATIVE)** — a `kind: skill` needs ≥1 operative element (step / fenced
    block / substantive prose) beyond heading + `≜` formula; a scaffold-only body FAILS.
  - **`gate_skill_provenance()` (PROVENANCE)** — a skill composing empty provenance surfaces as a verify
    `NOTE` (warning, not FAIL — a skill may legitimately compose from nothing), diagnosing fenced-only-`≜`
    vs no-`≜`. Fires regardless of deploy state. Prevents the empty-provenance bug from regressing silently.
- **`…` declared, not exempted (Nico's call).** The ellipsis in `materialize`'s `{ file, document, … }` is
  the "and so on" enumerator (kin to `·`), genuine notation — so I added it to
  `references/formal-symbolic-notation.md` and dropped it from the exempt clause (one home: declared, not
  double-counted). Em-dash stays exempt (true prose punctuation).
- **Tests:** `test_symbols`, `test_operative`, `test_provenance` added (plant-a-violation + clean-corpus,
  matching `test_verify.py` style). **Suite 9/9**; `verify.py` PASS; clean corpus green under all new gates
  (verified independently — the gates do not false-positive on η/cᵢ/tree-art). `toolkit/AGENTS.md` "Verify
  gaps" updated (2 gaps struck → "Closed (B9)"; the fenced-`≜` gotcha annotated with the PROVENANCE warning).
- **Remaining open verify gap (not B9):** the H1-silently-dropped composer bug is still ungated — logged in
  toolkit/AGENTS.md, a future hardening task.
