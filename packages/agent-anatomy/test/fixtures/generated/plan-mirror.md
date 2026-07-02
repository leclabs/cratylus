# plan: healthz — /healthz endpoint + liveness probe wiring, service `gateway`

objective ≜ gateway serves GET /healthz → 200 `{"status":"ok"}` ∧ k8s livenessProbe targets it
retirement ≜ both tasks completed ∧ result landed on main

## backlog

| task         | state   | slice           | wave | deps          |
|--------------|---------|-----------------|------|---------------|
| add-endpoint | ready   | http surface    | 0    | ∅             |
| wire-probe   | pending | deploy manifest | 1    | add-endpoint  |

## R — dependency edges  ((t,u) ∈ R ⇔ t depends on u)

R = { (wire-probe, add-endpoint) }

## waves

wave(0) = { add-endpoint }
wave(1) = { wire-probe }
frontier(P) = { add-endpoint }

## invariants

- authority: (state, R, content) ≽ PLAN.md — folder placement is state; this doc is the derived mirror, re-emitted only on change.
- slices MECE: {http surface} ∩ {deploy manifest} = ∅; ⋃ = P; one cross-slice edge = argmin over admissible cuts.
- ρ(PLAN.md) = ρ(content(t)) = ρ(r) = LLM ∀ t, r.
