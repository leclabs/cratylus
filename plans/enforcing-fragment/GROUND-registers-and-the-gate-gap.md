# Re-grounded: the four registers, and where the gate is actually missing

Written after reading VISION · MODEL · ENGINE · CANON — which `AGENTS.md` requires at session start
and which I had not done. Every conceptual path I spun this session was already settled in these
four files. That failure is itself the thing the gate is meant to catch, so it is recorded here
rather than quietly corrected.

## The four registers, in MODEL/ENGINE terms

| register    | MODEL/ENGINE                                                                                            | artifact                                        |
| ----------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **source**  | `author : Intent → cell` · `catalog : DimensionName → ℘(fragment)`                                      | `agent-canon` cells — fragments, agents, skills |
| **build**   | `select : agent → (DimensionName ⇸ ℘(fragment))` · `compose(select(a)) = ir(a)`                         | the composed IR                                 |
| **project** | `deploy(c,adapter) = inject(content(c), realize(…, adapter))` · `Target ≜ harness-declaration-artifact` | `~/.claude/agents/*.md` · `settings.json`       |
| **runtime** | the harness reads the Target                                                                            | Claude Code · codex                             |

MODEL's BEING/FACE names the same thing: _"a cell is a BEING; deploy projects it to MANY per-harness
Targets = its FACES."_ One being, many faces. **The source register is harness-innocent by
construction.**

## What the canon ALREADY settles (and I re-derived anyway)

| I "discovered"                                                                          | already in                                                                                                                                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| substrate-relative refusal, and ROUTE for a foreign substrate                           | MODEL ENFORCED, verbatim                                                                                                                                                  |
| "composition is the scope, not a runtime self-filter" — the `agent_type` grep condemned | MODEL ENFORCED, verbatim                                                                                                                                                  |
| `activation` must be instance-level, not Kind-level                                     | MODEL `activation : cell ⇀ ActivationMode`, with Kind-typical DEFAULTS — **already done**; the "MODEL revision owed" I kept reporting was stale PLAN text, not a live gap |
| enforcing bounds rather than steers (∴ `honesty`/`helpfulness` mis-filed)               | MODEL `enforcing(f) ⇔ events(f) ≠ ∅ ⟨bounds, ¬ steers⟩`                                                                                                                   |
| a subagent is not a cold oracle                                                         | `toolkit/cold-oracle/cold-oracle.sh` header                                                                                                                               |

**Read the ground before the plan.** A plan file is a working note; MODEL is apex.

## THE DEFECT I LANDED — mechanism in the source register

`d30f078` added `command · timeout · matcher · workers` to `Enforcing`, i.e. to a **dimension value**.
That is project-register content inside a source-register cell, and MODEL forbids it directly:

```
mechanism : fragment × harness-adapter ⇀ harness-mechanism ⟨what deploy EMITS for an enforcing f⟩
```

`mechanism` is a function OF the adapter, EMITTED at deploy. MODEL puts exactly two things on the
fragment: `events : fragment ⇀ ℘(Event)` and `substrate : fragment → Substrate`.

∴ **`Enforcing` = ⟨body, substrate, events⟩** — which is what S1 originally shipped. The later
addition was the regression. The mechanism must be resolved adapter-side, by reference.

This also explains why the corpus felt like it was fighting me: a shell script inside a policy
statement makes the cell harness-specific, which breaks BEING/FACE — one being can no longer have
many faces if the being already contains one face's bytes.

## THE GATE GAP — `ENFORCED` has no leg

MODEL declares **seven** Universal legs:

```
Universal(a) ≜ CANONICAL ∧ SIGNIFIED ∧ COLD-BLIND ∧ PARTITIONED ∧ PARSIMONIOUS ∧ ENFORCED ∧ REGENERABLE
```

`packages/agent-forge/src/validate/accept.ts` implements **six**. Its own header still reads
`Universal = CANONICAL ∧ SIGNIFIED ∧ COLD-BLIND ∧ PARTITIONED ∧ PARSIMONIOUS ∧ REGENERABLE`, and
`UNIVERSAL_LEGS` has six members. **`ENFORCED` is absent.**

So a cell can pass `accept()` while violating the one leg this entire plan exists to establish. And
MODEL states the consequence itself:

> _a declared bound that projects to nothing is INDISTINGUISHABLE from an undeclared one_

That is the gate-check architecture defect, in one line. Everything else this plan did — S0's
catch-all, S2's binding, S3's refusal — are ENFORCED's _realizations at the projection boundary_;
none of them is the _leg_.

## ENGINE lags MODEL

```
ENGINE:  realize : ActivationMode × harness-adapter → harness-mechanism
         deploy(c,adapter) = inject(content(c), realize(activation(class c), adapter))
MODEL:   activation : cell ⇀ ActivationMode  ⟨INSTANCE-level⟩
         mechanism  : fragment × harness-adapter ⇀ harness-mechanism
```

Two mismatches, both consequential:

1. ENGINE reads `activation(class c)` — **Kind-level** — after MODEL made activation instance-level.
2. ENGINE's `realize` takes an `ActivationMode`, so it **cannot see the fragment's events**. MODEL's
   `mechanism` is keyed on the FRAGMENT. An enforcing fragment's mechanism is not derivable from its
   activation mode alone.

ENGINE realizes MODEL, so ENGINE owes the revision — `realize` must be keyed on the fragment.

## The work, ordered

2. ✅ **`ENFORCED` has its leg** — `4a21cb2`. `accept.ts` now implements all seven; `enforced()`
   convicts UNPROJECTED (declared, nothing emitted) and AMBIENT (emitted, not scoped). The per-leg
   meta-gate fired immediately demanding a seed and now runs 7/7.
3. ✅ **ENGINE caught up to MODEL** — `6877f69`. `realize` is keyed on the CELL and marked PARTIAL;
   `deploy` reads `activation(c)`, not `activation(class c)`.

4. ✅ **The mechanism left the source cell** — `89a5ff7`. `Enforcing` is the declaration alone
   ⟨body, substrate, events⟩ plus a `realizedBy` ANCHOR; `HarnessMechanism` lives in `core/hook`.
   The table is INJECTED by the corpus, exactly as `accept.ts` already takes its `Policy` — DATA in
   agent-canon, ALGORITHM doctrine-free. BEING/FACE restored.

   **The port widened rather than the emission moving — my stated lean was WRONG.** Claude's
   per-agent hook lives in the agent file's OWN front-matter, which is precisely what `agentDef`
   emits, so relocating emission would have cost per-agent attachment on claude — the property this
   plan exists to establish. `agentDef(agent, mechanisms)`. **Check where the harness actually PUTS
   the thing before deciding which side of a seam owns it.**

   An unresolved mechanism emits NOTHING, which is correct: the value still declares its bound, and
   that gap is exactly what the `ENFORCED` leg convicts as `unprojected`.

5. ⬜ Only then resume the cell migration.

Nothing above needs a probe. It is all read off the ground.
