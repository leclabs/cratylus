# t-signify-the-pulse

**⊥ — no anchor. The provisional path stands, and the reason is a finding.**

## The concept, as the port states it

An endogenous pulse on a cadence that **samples** a pressure/salience gate to decide whether
a cognitive cycle runs — it never **clocks** one. `consolidate` is `false` on every tick while
pressure sits below threshold, no matter how many ticks elapse.

## The derivation

Blind reverse decode, `cold-oracle.sh` — process-level isolation, zero project context. A
subagent is explicitly not cold and was not substituted.

| candidate        | what a reader with no access to this repo returns                                                         | verdict                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `heartbeat`      | not tested — disqualified a priori                                                                        | **occupancy**: this runtime binds it as a session-LEASE verb (`register \| heartbeat \| release`)                                               |
| `pacemaker`      | "sends controlled electrical pulses to **keep the heart beating** at a steady rate"                       | **wrong sense** — it CLOCKS, which is the one thing the concept forbids. Also occupied: the Pacemaker cluster resource manager                  |
| `circadian`      | "biological rhythms following roughly a **24-hour** cycle… entrained to light-dark"                       | **accidental mass** — commits to a day length the concept does not have                                                                         |
| `poll`           | "repeatedly check at intervals to see if a condition has changed, **rather than waiting to be notified**" | **right sense, large residue** — carries sampling-not-driving exactly, but nothing of endogeneity or the gate, and is generic enough to collide |
| `pressure-poll`  | "I don't recognize this as an established term… made-up/placeholder"                                      | **coinage** — refused on sight by the first principle                                                                                           |
| `oscillator`     | "regularly swings back and forth between two states… regular, repeating alternation"                      | no sampling, no decision                                                                                                                        |
| `homeostat`      | "senses when it's pushed away from a stable state and **adjusts itself** to counteract"                   | names the ACTUATING loop; this capability never actuates                                                                                        |
| `sleep pressure` | "the accumulating **need** for sleep… the sleepiness meter"                                               | names the GATE's variable, not the pulse                                                                                                        |

**No candidate's blind reverse decode returns the concept.** Under `cratylism` that is `⊥`,
and `⊥` is a legal answer: the provisional path stands rather than licensing a coinage. The
port header already anticipated exactly this outcome.

## The finding, which is worth more than the ⊥

**The two closest candidates split the concept in half, and neither half is missing.**

- `poll` returns the cadence sense — sampling at intervals rather than being notified — and
  loses the gate entirely.
- `homeostat` returns the gate sense — noticing a variable has left its band — and loses the
  cadence, while wrongly adding actuation.

A concept that no sign names, whose two nearest signs each name exactly one of its halves
cleanly, is a candidate for being **two concepts wearing one capability**. The port's own
interfaces already sit apart: `PeriodConfig` and `Period` on one side, `PressureGate` and
`GateConfig` on the other, joined only where `Tick.consolidate` reports the gate's verdict at
an emission.

So the naming failure may not be a search that has not gone far enough. It may be the cut.
`Period` and `PressureGate` each decode cleanly on their own; their conjunction has no sign
because it is not one thing.

**That is a hypothesis this shard did not test**, and it is the next question rather than a
conclusion — deciding it means re-cutting a capability, which is a different act from naming
one.

## What did NOT happen, per the port's own list

Nothing renamed. Not added to `CAPABILITIES`, not a field on `RuntimePlugin`, not in
`exports` or `tsup.config.ts`, no skill directory. `provisional-v9` stands, which is what a
`⊥` means.
