# pacemaker

> The endogenous-pulse capability has no name, and nothing downstream can be built until it
> does. `provisional-v9` encodes the shard that produced the file and asserts nothing.

## Why this plan exists, and why it is not the channel plan

I reported that the channel substrate was "already half-built as `provisional-v9`". **That was
wrong**, and the correction is the reason this plan is scoped the way it is.
`ports/provisional-v9.ts` states its own concept in its first ten lines: _an endogenous pulse
on a cadence that SAMPLES a pressure/salience gate to decide whether a cognitive cycle runs —
it never CLOCKS one._ Its `Envelope` and `PushHost` are that capability's internals, not an
agent-to-agent transport. I asserted otherwise from a symbol grep and a subagent's framing
without reading the header.

So there are two concepts, not one:

- **this plan** — name and land the endogenous pulse, which exists and is unnamed;
- **the channel substrate** — genuinely unstarted, and its prior research answered a question
  about a capability that turns out not to exist. It gets its own plan, re-researched against
  the real runtime surface.

## The naming constraint the file itself records

Under `cratylism` the anchor is DISCOVERED, never coined, and `⊥` is a legal answer — a `⊥`
leaves the provisional path standing rather than licensing a coinage.

**A collision is already flagged in the source and must be honoured:** `heartbeat` is bound in
this runtime as a session-LEASE verb (`ports/memory.ts`: `'register' | 'heartbeat' | 'release'`),
which is the liveness sense, not the scheduling sense. Two concepts under one sign in one
runtime is the defect `α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)` forbids.

## What must NOT happen before the anchor lands

The port's header lists these, and they are load-bearing — they are what keeps the eventual
rename a `git mv` plus an identifier sweep:

- not added to `loader.ts`'s `CAPABILITIES`
- not a field on `plugin.ts`'s `RuntimePlugin`
- not in `package.json#exports` or `tsup.config.ts`
- no `packages/canon/src/skills/<name>/`

## Shards

| state   | task                  | concern                                                         |
| ------- | --------------------- | --------------------------------------------------------------- |
| ready   | `t-signify-the-pulse` | derive the anchor by cold decode, or return ⊥ with the evidence |
| pending | `t-land-the-anchor`   | `git mv` + identifier sweep + the surfaces the header withheld  |
