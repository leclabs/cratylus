# Baseline / delta agent model

How a agent-anatomy agent is authored as a small **delta over a base**, composed with native JS, and projected
minimally per harness. Source-of-truth for the TS types and the rollout — now reality, not a pending plan.

## Two resets — distinct, and filed in different places

| reset                                    | what it is                                                                                                                                              | lives in                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **harness reset** (`claude`, `codex`, …) | what _that harness_ provides natively — measured by a blank `/introspect`; the basis for omit-to-inherit                                                | the **agent-forge adapter**          |
| **agent base** (`base`)                  | the polis-universal, harness-**neutral** floor every agent-anatomy agent inherits (HHH charter, continuity on, the memory protocol, genus dispositions) | **agent-anatomy** (`agents/base.ts`) |

`claude` is a **harness**, never a agent-anatomy agent. The "claude baseline" is the claude adapter's reset.

## Composition & merge — native JS, no bespoke machinery

- **Composition** = ESM `import`.
- **Merge** = object spread. Scalar override = field replace; additive set = array spread; remove = filter (rare).
- **Inherit-by-omission** = don't set the field; the spread fills it from `base`.
- **Delta-over-target** = computed **in the adapter at export**: the adapter subtracts its own harness
  reset, so the projected artifact omits what the target already provides (set organs: emit the
  set-difference). Same agent → minimal-per-harness automatically; no target-diff computation in agent-anatomy.

```ts
// agent-anatomy/agents/nico.ts — a delta over base, composed by import + spread
import { base } from "./base";
import { sage } from "../organs/persona/sage";
import { curate } from "../organs/role/curate";
import { inputUntrusted } from "../organs/guardrails/input-untrusted";

export const nico: Agent = {
  ...base, // inherit the polis floor (guardrails, memory protocol, genus, continuity…)
  name: "nico",
  persona: sage, // scalar override
  role: curate, // scalar override
  guardrails: [...base.guardrails, inputUntrusted], // additive set = array spread
  // actions / model / autonomy / modalities / … : omitted ⇒ harness provides them at export
};
```

When the claude adapter projects `nico`, it subtracts the claude harness reset — so `actions`,
`autonomy`, `model`, etc. (provided by Claude Code) drop out of the `.md`, and only nico's
distinctive delta is emitted.

## Decision — where the polis-universal floor lives

**An explicit `agent-anatomy/agents/base.ts` module** that every agent spreads — _not_ a hidden composer
injection. Rationale: the floor (HHH guardrails, continuity organs, the memory protocol, genus dispositions)
should be **visible in source** and composed by the same `...spread` mechanism as everything else, so
there is one composition model, no magic. The founder genus (`principal-ic`) is a thin
`founderBase = { ...base, ...founder-dispositions }` that the two founders spread instead of `base`.

This supersedes the Python composer's implicit genus/founder/memory injection (which becomes explicit
spreads at the cutover, T6.1).

## Laws

- **Completeness.** After merge, every organ resolves (base ⊕ delta covers the anatomy); a gap is a
  compile error against the T0.1 types.
- **Byte-identity (acceptance).** `base` + an agent's delta, projected, must equal that agent's current
  SOUL byte-for-byte (the rollout gate, T4.1) — a pure DRY refactor, zero behavioral change.
- **Conformance.** A harness reset must equal a blank `/introspect` on that harness (measure ↔ declare);
  drift between them is a bug in the reset (T2.2).
