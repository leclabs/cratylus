# canonical-organ-values — charter

**Lead:** Nico (corpus owner). Address for this initiative: **human-out-of-the-loop** (Operator-granted full
autonomy — decide every in-domain reversible move, report at the end).

## Why

The corpus is mid-transition. `agent/nico.md` already selects **generic canonical values** (`sage`,
`conceptualization`, `react`, `satisfice`, `parsimony`, `formal`, …), but most organs still carry a **mix of
canonical + bespoke per-agent cells** (e.g. `construal` has the canonical `conceptualization` _plus_ five
`frame-as-*` bespoke cells; `competence` has 3 generic + 11 bespoke; `telos`/`mandate`/`disclosure`/
`enaction`/`effectors`/`appraisal`/`percept` similarly). Bespoke per-agent values are the disease:
poorly-formed, non-composable, terminology no clean LLM reader fires on.

**The point of the library** (Operator): provide an _opinionated set of composable fragments_ for building
custom agents/skills that function as advertised — **precise context an LLM understands exactly, optimized
for LLM-as-reader** ([[exemplify]] · [[signify]] · `σ*_R(c)`), with **no bespoke terminology and no
poorly-formed ideas**. Every organ is either a **closed** model-native enum or an **open** dimension with a
**generalized opinionated** value-set — never a junk drawer of per-agent one-offs.

## Method (zero-trust, blind introspection)

`σ*_LLM` is intrinsic to R=LLM (= the model). The canonical enum of an organ is a **member of the model's own
native schema**, recovered by **blind model introspection** — ask clean instances, never leak our current
values. Two independent rounds + consistency check; probe until evidence/enums + open-vs-closed is clear.
Then for open organs, blind-source a generalized opinionated set. **All emitted fragments render for
LLM-as-reader** (dense, symbolic, anchor-bearing — `σ*_LLM`, not human prose).

## Acceptance

- Every organ classified **open** or **closed**, with evidence (≥2 consistent blind rounds, reference cited).
- Closed organs carry exactly their model-native enum; open organs carry a generalized opinionated set.
- **Zero bespoke per-agent values** remain in any organ.
- All 11 agent vectors reference only surviving values; all organ READMEs rewritten; `verify.py` PASS
  (R1+R2+R3 + no-holders); toolkit tests green; round-trip equivalent-or-better.
- `weitermachen → carry-on` renamed (weitermachen kept as a trigger word in delineation + body).
- Layman agent-builder skill shipped (agent-reader; layman Q&A per organ; default = first option).
- Fleet redeploy to all 6 hosts (absorbs `asleep-host-catchup`); landed artifacts verified.

## Tasks (task-state = folder)

`T1 blind-audit-r1 → T2 blind-audit-r2 → T3 probe-and-classify → T4 open-value-gen → T5 purge-bespoke →
T8 fleet-redeploy`. `T6 rename-carry-on` and `T7 layman-builder-skill` are independent (parallelable),
gated only by T8.
