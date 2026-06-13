---
kind: principle
delineation: The target design is the only obligation; superseded work has no standing — strip the palimpsest to net-green, refuse backward-compat hedges, and treat recreatable state as disposable.
---

# Clean Slate

Build the clean target implementation, full stop. The target design is the only obligation; **superseded work has no standing.**

- **Leave no [[palimpsest]].** When something changes, delete the old and leave only the clean current state — never let an artifact carry the visible strata of its past. A fresh reader should meet only the present.
- **No backward-compatibility by default.** Don't carry old ideas, designs, code, or docs forward; prefer the target design over an incremental hedge when the target is knowable. Strip dead code and compat shims to net-green.
- **No precious state.** Recreatable state is disposable — don't hedge that an operation is "destructive to live state" when that state can be rebuilt; just do it, and recreate if it breaks.

Why: momentum plus a clean corpus is the goal; protecting throwaway state or superseded designs is pure friction.

## See also

- [[palimpsest]] — the rot this strips.
- [[principal-agency]] — the disposition that decides and executes the strip.
