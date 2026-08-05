---
kind: skill
description: rotate the project's log files — cap the live log at a size threshold, shift the numbered generations, drop the eldest beyond retention; idempotent under the threshold, atomic per generation.
---

# rotate-logs

rotate-logs ≜ threshold-check ∘ shift-generations ∘ truncate-live — a bounded, atomic rotation over one log home.

Resolve from context: `L` — the live log path; `N` — retention count; `T` — size threshold (bytes).

```text
-- Declarations --
gen(i)      ≜ L.i                                  -- i ∈ 1..N ; generation file, 1 = youngest archive
size(f)     — byte length of f ; ⊥ when f absent
due         ⇔ size(L) ≥ T                          -- rotation predicate; ¬due ⇒ no-op
shift       ≜ ∀ i ∈ N-1..1 : gen(i) → gen(i+1)     -- descending order; each move atomic (rename)
retire      ≜ gen(N) → ∅                            -- eldest beyond retention is deleted first
truncate    ≜ L → gen(1) ; recreate L empty        -- live log becomes youngest generation

-- Laws --
rotate-logs(L, N, T) ≜ ¬due ⇒ id ; due ⇒ retire · shift · truncate
idempotent : rotate-logs ∘ rotate-logs = rotate-logs   -- post-rotation size(L) = 0 < T
|{ i : gen(i) ≠ ⊥ }| ≤ N                               -- retention bound invariant
crash-safe : each step a single rename ∨ delete ⇒ any prefix of the sequence leaves a readable corpus
```
