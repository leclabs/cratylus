# S2 · composition-binding

**Objective.** Make the claude adapter emit a per-agent mechanism for each enforcing fragment in
`ir(a)`, so a guardrail's SCOPE comes from composition rather than from a runtime string match.
This is the **binding seam**, and the research says it is the one that actually matters.

**Why this shard is the plan's centre of gravity.** Across every system surveyed, the fatal failure
mode of a split constraint is **incomplete mediation** — the governed object is never presented to
the mechanism. It is fatal specifically because it is SILENT: the declaration is correct, the
enforcement simply never runs, and nothing on the declaration side can reveal it. Named instances:
LSM missing-hook placement (USENIX Sec 2002; ACM TISSEC 7(2) 2004; PeX, USENIX Sec 2019 — an entire
literature exists because missing hooks were undiscoverable by inspection); Spring `@PreAuthorize`
inert under self-invocation because the call never crosses the AOP proxy; Kubernetes NetworkPolicy
accepted by the apiserver and enforced by nobody when the CNI does not implement it. Our
`agent_type` grep is the same shape: the scope lives in the enforcement code, invisible from the
agent it governs, failing open and silently.

Split failures are silent-allow. Bundled failures are loud-deny. **Prefer the loud one.**

**Static inputs (pinned, verified present at authoring):**

- `packages/agent-forge/src/adapters/claude/hooks.ts` — hooks currently deploy to ONE global `settings.json` block keyed by event. That global block IS the ambient scoping this shard removes.
- `packages/agent-canon/src/hooks/stance-guardrail-pre.ts` — the runtime `agent_type` grep. READ it to learn exactly what the mechanism needs in order to be scoped statically; do not delete it here (that is S4).
- `packages/agent-forge/src/adapters/claude/anatomy.ts:54-57` — agent frontmatter currently emits `name`, `description`, `color`. If per-agent scoping needs a carrier in the projected bytes, this is the seam.
- `packages/agent-forge/src/anatomy/hook-cell.ts:70` — `matcher`. **KEEP IT.** Attachment has a documented expressiveness ceiling: a static mark cannot express a runtime-conditional policy. `matcher` is the residual DYNAMIC binding — the parameters/scope face that stays separable. Removing it would force dynamic conditions back into pointcut-shaped code and re-introduce exactly the fragility this shard removes.

**Constraints.**

- Scope is derived from `ir(a)` — the agent's composition. An enforcing fragment governs an agent **iff** it is composed into that agent. No name lists, no `agent_type` matching, no glob over agent ids.
- **The seam must be TYPED.** Untyped seams drift silently toward allow: Gatekeeper links a Constraint to its template by an untyped string `kind`, and a typo yields a constraint that matches nothing and fails open. Whatever carries scope from composition to mechanism must be checked, not string-matched.
- Do not change `matcher` semantics. Static attachment and dynamic matching are different seams; this shard replaces the former only.
- The mechanism emitted must be per-agent, not global-plus-filter. A global mechanism that filters by agent at runtime is the defect wearing a new costume.
- Do not delete the grep and do not touch the hook cells — S4 owns that. S2 must leave the system with BOTH paths live so the two can be compared.

**Dependencies.** S1 (needs `events` on a fragment to have anything to emit for).

**Outputs.** `packages/agent-forge/src/adapters/claude/hooks.ts`; whatever typed carrier the
composition→mechanism seam requires; adapter tests.

**Completion criteria (falsifier).**

1. **Differential proof of mediation.** For an agent composed WITH an enforcing fragment, the deployed tree contains a mechanism scoped to that agent. For an agent composed WITHOUT it, no such mechanism exists. Both halves asserted — the negative is the one that proves scoping is real, and it is the half that is normally skipped.
2. The emitted mechanism is byte-identical in effect to what the `agent_type` grep produced for the same agent. Capture the old output BEFORE the change to compare against; a comparison built after the fact is a claim about the comparison.
3. The composition→mechanism link fails at BUILD time when broken — verify by deliberately breaking it and observing the failure. A link that can only fail at runtime has re-created Gatekeeper's fail-open.
4. `pnpm test` green; the existing grep path still passes its own tests (both paths live).

**REJECTED if:** scope is carried by an untyped string; a global mechanism filters by agent at
runtime; `matcher` is removed or repurposed; the grep is deleted here; or only the positive half of
criterion 1 is demonstrated.
