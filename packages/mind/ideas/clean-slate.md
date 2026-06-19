---
kind: principle
delineation: The target design is the only obligation; superseded work has no standing — strip the palimpsest to net-green, refuse backward-compat hedges, and treat recreatable state as disposable.
---

# Clean Slate

- **Leave no [[palimpsest]].** When something changes, delete the old and leave only the clean current state.
- **No backward-compatibility by default.** Prefer the target design over an incremental hedge when the target is knowable; strip dead code and compat shims.
- **No precious state.** Recreatable state is disposable — don't hedge that an operation is "destructive to live state"; recreate if it breaks.

## See also

- [[palimpsest]] — the rot this strips.
- [[principal-agency]] — the disposition that decides and executes the strip.
