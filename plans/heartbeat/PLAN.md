# heartbeat

> The endogenous pulse is a **heartbeat**. The sign was attested by the operator, tested cold,
> and it returns the concept.

## Why the first derivation missed it

`heartbeat` was disqualified **a priori**, on an in-repo occupancy collision, and never
reached the oracle. That is backwards: occupancy is a question about THIS corpus, and it
cannot answer what a sign MEANS. Skipping the test on those grounds is how a search returns ⊥
while the answer sits in the candidate list, untried.

The second error is subtler and is the one that produced the ⊥. The port's header states the
concept as _"an endogenous pulse on a cadence that samples a pressure/salience gate to decide
whether a cognitive cycle runs"_ — which bundles TWO things. No sign names that bundle,
because it is not one concept. The derivation found exactly this (`poll` named the cadence
cleanly and lost the gate; `homeostat` the reverse) and then reported ⊥ instead of reading its
own finding: the bundle was the problem, not the vocabulary.

## The decode

`heartbeat`, cold, zero project context:

> _a signal sent out at regular, repeating intervals to prove that something is still alive
> and working… regular pulses = alive; irregular or absent pulses = something's wrong._

That is the **cadence**: self-emitted, periodic, intrinsic. It is what the capability's
`Period` produces. The gate is a separate concept the sign does not carry and does not need
to — `PressureGate` already names it, and `Tick.consolidate` is the seam where the two meet.

## The occupancy, restated rather than dismissed

`ports/memory.ts` binds `heartbeat` as a session-lease verb (`register | heartbeat | release`).
Under the cold decode these are **not two concepts** — both are "a regular pulse from a live
thing". One proves a session is alive; one is the agent's own cycle. The header called this a
defect on the assumption they were distinct senses; the oracle says they are the same sense at
two scopes, which is polysemy a sign is entitled to.

Recorded rather than resolved: if they must be distinguished, the distinguishing word belongs
on the SCOPE (`session-heartbeat`), not on the concept.

## Shards

| state | task                    | concern                                                      |
| ----- | ----------------------- | ------------------------------------------------------------ |
| ready | `t-rename-to-heartbeat` | `git mv` + identifier sweep; the path stops being a shard id |
