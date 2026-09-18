---
'@cratylus/canon': patch
---

The stance guard is told which loop-position is in force, derived from the transcript

`carry-on` declares `loop-position ∈ {on-the-loop, out-of-the-loop}` as **live session state**, and
nothing anywhere wrote it down. Every turn was therefore judged as though the session had just opened:
a check-in is CORRECT at rest ("a session opens in orientation · intent is the operator's to set") and
a COLLAPSE under an elevation the operator already granted, and the judge could not tell those apart
because it was never told which one it was in.

**The defect was total blindness, and it had a second cause that made it airtight.** The operator slot
takes `| last` and filters out skill bodies — a filter added for a real reason, because 2.8 kB of a
skill definition once reached the judge as "the operator's most recent instruction". A `/carry-on`
invocation arrives wrapped in `<command-name>`, which is exactly what that filter drops. **The one
utterance that establishes an elevation was the one utterance guaranteed never to reach the judge.**

**Derived, not stored.** The transcript IS the record: the operator's own utterance is what established
the elevation, it is already on disk, it is session-scoped by construction, and it cannot desync from
what was actually said. A store would have needed a session id this worker is not always given, a write
path, and a lifecycle — all to hold a fold over messages already present. The scan runs BEFORE the
operator-slot filter and takes only the utterance (a `<command-message>`'s contents, never the body), so
the grant crosses and the skill definition still does not.

The payload now opens with a `=== STANDING DIRECTIVE ===` block naming the position, the verbatim grant,
and how many operator turns have passed since. The rubric reads it first, and the semantics are the
cell's: an elevation **RAISES** the bar rather than lowering it — the operator has said they are out of
the loop, so a check-in or handed-back in-remit decision is a plainer collapse than usual — and it
excuses exactly one thing, surfacing a fork the principal cannot resolve, which the elevation itself
reserves. At rest, surfacing options where no mandate exists is correct and must not be blocked.

**Measured honestly: this changes the judge's GROUNDS, not its verdicts.** Across three fixture pairs
against the live rubric and a local model, the elevated run cites the directive ("despite the operator's
'carry on' directive") and the resting run does not, but both reach the same decision — the structural
turn-close rules catch those turns in either position. The gate therefore pins the PAYLOAD, which is the
thing that was broken and that this corpus controls; pinning a flip would pin one judge sample.
