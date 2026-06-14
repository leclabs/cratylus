# B7 — identity-organ verbatim-render seam

**State:** ready · **Lead:** Nico (cell-side, author-first) + Mav (machinery) · **Phase:** B (machinery) · **Dep:** B2 (done) · **From:** finding #2

## Intent

Stop hardcoding the identity-memory protocol in the composer. Today `compose/agent.py
_identity_block()` splices ~30 lines of operative protocol (SOUL/SELF/MEMORY/EPISODIC, encode/dream,
the wake sequence, the triggers) into every agent def as a literal. The cell `[[identity-memory-stack]]`
is the rightful one home for that block — the def should *compose the ref*, and the composer should
*resolve the body from the cell*. This closes the last "machinery knows a thing the corpus should declare"
seam (CA-dissolves: the cell declares its own projection law, the composer obeys).

## Decided (COORDINATION, 2026-06-14)

- **Composition over template-include** — the organs (`identity-memory-stack`, `pulse`, `senses`,
  `powers`) compose as genus refs; the oracle's R1 then covers them for free (one home, no parallel
  fidelity check).
- **Fork 2 resolved → (B) cell-declared `render: verbatim`** — NOT an organ-list hardcoded in the
  composer. `render` is a **projection** field (same class as a skill's `trigger`), not a locational
  one, so it reconciles with minimal-front-matter. The cell declares "emit my whole body at any density,
  `{name}`-parameterized"; the composer obeys generically.

## Work

**Cell-side (Nico — author FIRST, so the machinery has a target):**
1. Factor the operative identity protocol (the wake/dream/encode block + triggers now living in
   `_identity_block()`) into `[[identity-memory-stack]]`'s body — second-person, `{name}`-parameterized.
   The cell becomes the single home for that block.
2. Mark the cell `render: verbatim` in front-matter.
3. Confirm the organ set is exactly `{identity-memory-stack, pulse, senses, powers}` (decide whether
   `ambient-person-agent` joins) and that each composes as a genus ref.

**Machinery-side (Mav — once the cell lands):**
4. Composing an agent, a referenced cell with `render: verbatim` emits its body verbatim at **any**
   density (replacing the hardcoded block), `{name}`-parameterized.
5. Drop the hardcoded `_identity_block()`; migrate every agent def to the composed-ref form.

## Done-when

- `[[identity-memory-stack]]` carries the operative protocol in its body + `render: verbatim`.
- The composer emits agent identity blocks by resolving that cell (no `_identity_block()` literal).
- Lean-density agent defs still carry the full protocol verbatim (density-immune), `{name}` correct.
- The oracle's R1 covers the organ refs; `verify.py` PASS; agent defs round-trip byte-identical.

## Cell-side outcome (Nico, 2026-06-13)

**Cell-side done** — the target for Mav's machinery is authored and green.

- `ideas/identity-memory-stack.md`: added `render: verbatim` front-matter + a reserved **`## Protocol`**
  section holding the operative block (the exact text `_identity_block()` emits), `{name}`-parameterized
  and **ref-free** (no wiki-links in the payload → nothing leaks into the projected def). The descriptive
  body + `## See also` keep the `[[refs]]` for R1 reachability — description and protocol are two facets,
  one home.
- **Convention for Mav (the contract):** `render: verbatim` ⇒ the composer emits the cell's `## Protocol`
  section body **verbatim** (the `## Protocol` heading itself is *not* emitted), `{name}`-substituted, at
  **any** reader density. The payload preserves ASCII `--`/`->` punctuation so the eventual
  `_identity_block()` → cell migration is a **byte-identical no-op** (re-emit must reproduce current defs).
- `ideas/AGENTS.md`: documented `render` as a projection directive (sibling to skill `trigger`), with the
  "not a locational field" distinction; flagged composer support as this task (B7).
- Gate: `verify.py` PASS (R1+R2; R3 manual); full toolkit suite 6/6. (R1 caught a self-inflicted dangling
  `[[refs]]` — a bracket token in my prose — proving the reachability-path diagnostic; fixed.)

**Remaining (Mav, machinery):** wire the `render: verbatim` path in `compose/agent.py` (steps 4–5) — emit
the `## Protocol` body in place of the hardcoded `_identity_block()`, migrate the defs, confirm
byte-identical round-trip + R1 coverage. Confirm the organ set `{identity-memory-stack, pulse, senses,
powers}` (only `identity-memory-stack` carries `render: verbatim` so far; the other three are still
hardcoded/uncarried — decide whether they each grow a `## Protocol` + `render: verbatim` in the same pass).
