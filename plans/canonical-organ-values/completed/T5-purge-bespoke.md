# T5 purge-bespoke

R=LLM. lead: Nico. dep: T4. **The materialization — the only task that mutates the catalog.**

obj ≜ make the catalog match the T3/T4 decisions: **zero bespoke per-agent values**; closed organs = their
model-native enum; open organs = the generalized opinionated set. All via [[exemplify]] (round-trip gated).

do ≜

- **Delete** bespoke value cells (e.g. `construal/frame-as-*`, `competence/{e2e-delivery-toolchain,…}`,
  `telos/*` one-offs, `disclosure/surface-*`, `enaction/emit-*-dump`, `effectors/{run-*,write-arch-docs,…}`,
  `mandate/*` per-agent, `appraisal/*` per-agent, `percept/*` bespoke). Keep only survivors + new generalized
  cells (T4) + closed enums (T3).
- **Mint/edit** the surviving + new cells; bodies rendered for LLM-as-reader (`σ*_LLM`).
- **Rewire all 11 agent vectors** (`agent/*.md`) to select only surviving values (each agent maps its old
  bespoke pick → the nearest generalized/canonical survivor; an agent may share a value — that is the point).
- **Rewrite every organ README** to the surviving value-set.
- Run `exemplify`/`signify`; `resolve → glossary → verify` until **PASS** (R1+R2+R3 + no-holders); toolkit
  tests green; round-trip equivalent-or-better.

acc ⊨ no bespoke cell remains; `gate_agent_organ_refs` PASS (every vector resolves); verify PASS; tests green;
the source reconstructs ≽ from the new catalog. → `completed/`, then T8.

## Outcome (done 2026-06-23)

Materialized per 0002. 91 generalized value cells created; ~60 bespoke cells + 11 stale agent manifests deleted; all 11 agent vectors rewired; persona/sage de-contaminated; 14 organ READMEs rewritten; test_provenance allowlist updated for carry-on. verify PASS (R1+R2+R3 + no-holders); toolkit 15/15; gate_agent_organ_refs clean. Commits 7689fc1 (core) + READMEs.
