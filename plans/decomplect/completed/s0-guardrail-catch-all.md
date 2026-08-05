# S0 · guardrail-catch-all

**Objective.** Make a guardrail-less agent a **static** failure. Today `Agent.guardrails` is
`readonly Guardrails[] | null`; the `| null` is the whole fail-open surface. Drop it, so an agent
vector composed without a guardrail cannot compile. This is the catch-all that Spring Security and
AppArmor both prescribe and that neither gets statically — they hold only a runtime backstop.

**Independent of the execution-locus fork.** S0 touches only the arity of one dimension on the
`Agent` type. It holds under every resolution of "one cell or two", so it does not wait on S4.

**Static inputs (pinned, verified present at authoring):**

- `packages/forge/src/anatomy/index.ts:243` — `readonly guardrails: readonly Guardrails[] | null; // SET`. The single line to change. Note lines 230–262: EVERY dimension is `| null`, so this deliberately breaks the "all dimensions are omittable" symmetry. That asymmetry is the point and must be commented at the site, not left for a reader to mistake for an oversight.
- `packages/forge/src/anatomy/index.ts:171` — `guardrails: { axis: 'Constitution', kind: 'coined', arity: 'set' }`. `ANATOMY.arity` is DESCRIPTIVE — consumed only by `catalog/index.ts:265`, `core/exemplify/vector.ts:176`, and `anatomy/project-human.ts:68`. **It is not read by any validator.** Do not attempt to arm the catch-all by editing `ANATOMY`; it would change nothing.
- `packages/forge/src/validate/accept.ts:297,306-308` — `COMPOSED` self-describes as "light; tsc enforces dimension/arity". Confirms the enforcement seam is the TYPE, not `accept()`. PLAN.md says a guardrail-less agent "fails `accept()` at author time" — that is imprecise; correct the plan text, do not implement an `accept()` leg to match it.
- `packages/forge/test/project/fixtures/agents/probe.ts:18` — `guardrails: null`, in a fixture whose header states "Every dimension is `null` (explicit omit-to-inherit)". **This is the only breakage and PLAN.md's "ZERO-MIGRATION" is false by exactly this one file.**
- `packages/canon/src/agents/*.ts` — 10 agents, independently measured: 10/10 declare `guardrails`, 0 declare `null`. Canon migration really is zero.

**Constraints.**

- Change the TYPE only. Do not add a runtime check in `accept()` — a compile error is strictly earlier and stronger than a validator leg, and two enforcement sites for one invariant is the congruence-drift failure this plan exists to prevent.
- The `probe` fixture must keep exercising the PROJECTION SEAM, not become an anatomy test. Give it a real guardrail value and amend its header comment so the "every dimension is null" claim stops being false. Do NOT special-case the fixture with a cast or `@ts-expect-error` — that re-opens the hole under a different name.
- Do not touch any other dimension's nullability. Whether the same argument generalizes to `objective`/`autonomy` is a SEPARATE question with its own probes; deciding it here would be scope substitution.
- Leave `ANATOMY.arity` untouched.

**Dependencies.** none (wave 0 root).

**Outputs.** `packages/forge/src/anatomy/index.ts` (one field, plus the sited comment);
`packages/forge/test/project/fixtures/agents/probe.ts` (guardrail value + corrected header).

**Completion criteria (falsifier).**

1. **The control must fire.** Author a scratch `Agent` vector omitting `guardrails` and confirm `tsc` REJECTS it; then confirm the same vector WITH a guardrail compiles. A gate not observed failing is not a gate — assert the defect was present before reading the result.
2. `pnpm typecheck && pnpm typecheck:test && pnpm test` green across the workspace.
3. `rg -n "guardrails: null"` over `packages/` returns ZERO hits.
4. `rg -n "guardrails" packages/forge/src/validate/` returns zero NEW enforcement legs (the invariant lives in exactly one place).

**REJECTED if:** the fixture is exempted rather than fixed; an `accept()` leg is added; any other
dimension's `| null` is dropped in the same change; or the typecheck passes with a guardrail-less
vector (meaning the type change did not actually bind).
