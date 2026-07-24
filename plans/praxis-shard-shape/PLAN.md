# praxis-shard-shape — PLAN

<!-- `ρ=human` — operator review. Reader = LLM. -->

**Status: PROPOSED.** A single atomic hardening of the praxis skill. Local commit is in-remit; **push +
deploy reserved** for sign-off.

## The gap

The praxis skill carries the shard-document shape in **two granularities that don't match**:

- **formalBlock** (σ\*, the model-read payload): `spec : P → ⟨static, scope, accept⟩` — a 3-tuple.
- **description** (σ_human\*, the one-line selector): *"each shard is a self-contained task execution
  specification with objective, inputs, constraints, dependencies, outputs, and completion criteria"* —
  the full 6-field template.

Both project into `SKILL.md`, so a reader who reads the whole artifact sees the template. But the σ\*
payload — the part an LLM reads as authoritative — carries only the terse 3-tuple. A reader working from
the formalBlock alone produces a 3-field shard, not the 6-field one. The operational fidelity that made
this session's shards well-formed lives in the *selector line*, not the payload — one deploy convention
away from being lost.

## The fix

Lift the shard-document shape into the formalBlock so the σ\* payload itself carries the full-fidelity
structure, and reconcile the 3-tuple with the 6 fields into **one** consistent model (not two). The
description stays a one-line selector; the block becomes the authoritative source of the shard shape.

This is a **formalization / signification act** (prose template → σ\* structure), governed by the
formal-block law (`self-sufficient(block) ⇔ every term defined in-cell`; no prose, σ\* density) and the
`formalize` skill's discipline. Not a mechanical edit.

## Shard

- **T-shape** — formalize the shard-document shape into the praxis formalBlock (single atomic concern).

Genuinely one concern (formalize + its verification-as-acceptance); `|frontier|=1` here is atomicity,
not a mis-cut.
