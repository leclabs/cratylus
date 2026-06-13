---
kind: principle
delineation: A recurring loop must gate its own output on actual change — when a cycle detects zero delta across its authoritative sources, it emits nothing and commits nothing; output bandwidth tracks the real signal, not the polling rate, and the next non-silent cycle records "covers N silent cycles" so the timeline reconstructs losslessly.
---

# Emit Only on Change

A loop that runs on a fixed cadence must **gate its output on real change**. Each cycle pulls deltas from a small set of authoritative sources; if the cycle detects **zero delta** — no new commits, no state changes, no new messages — it **emits nothing and commits nothing**. The polling rate is how often it _checks_; it must not become how often it _writes_.

The discipline matters because output-on-empty actively corrupts: empty commits pollute the log, distort cadence, and inflate the apparent cycle count, making the record lie about how much happened. The loop's output bandwidth must match the **real signal**, not the clock (Ashby's requisite variety: emit at the rate of change, not the rate of observation). The change-decision lives **at the loop**, not in the scheduler that triggers it — the scheduler only wakes it; the loop decides whether anything is worth saying.

Losslessness is preserved without emitting: the next **non-silent** cycle records that it "covers N silent cycles since {predecessor}," so the timeline reconstructs fully from the emitted snapshots alone — the silence is accounted for, not lost.

## See also

- [[never-go-silent]] — distinct: that forbids going dark on a _human waiting on you_; this forbids emitting _noise when nothing changed_. Report substance, suppress non-events.
- [[doc-mirrors-runtime-truth]] — the loop mirrors the authoritative sources; it writes only when they actually move.
