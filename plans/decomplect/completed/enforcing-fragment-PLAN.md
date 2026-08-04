# enforcing-fragment — PLAN

> Working handle, **not** an anchor. Reader = LLM. Any anchor this plan mints is derived by
> signify at the time, never inherited from this directory name.

**Status: S0–S3 LANDED. The three ground corrections LANDED. S4 is the only shard left, and it is
unblocked — mechanical, with two small decisions inside it.**

Findings and their provenance live in [`FINDINGS.md`](./FINDINGS.md). Read
[`MODEL.md`](../../MODEL.md) before this file — it is apex, this is a working note.

## Intent

MODEL says a guardrail fragment carries its own `events`, and `ENFORCED` is a Universal leg. Source
carried neither. This plan is that migration, filed rather than left implicit.

## What landed

| shard | commit    | what                                                                                               |
| ----- | --------- | -------------------------------------------------------------------------------------------------- |
| S0    | `c5e84fc` | `Agent.guardrails` loses `\| null` — an agent cannot be composed unguarded; `tsc` is the catch-all |
| S1    | `fb49ee2` | `Value = Fragment \| Enforcing`; `enforcing(f)` DERIVED, never stored                              |
| S2    | `fd3e3f3` | scope DERIVED from composition — the mediation fix                                                 |
| S3    | `3cab6a0` | substrate-relative refusal, three cases (emit · refuse · ROUTE)                                    |
| —     | `e6e0819` | the `bodyOf` sweep — one `firstExport`, was copy-pasted into seven gates                           |
| —     | `b497840` | codex HAS a hook surface; adapter maps per-agent onto its global one                               |

## The three ground corrections

Found by reading MODEL/ENGINE after the shards, and all landed:

| #   | commit    | what                                                                                                                                                                                                                            |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `89a5ff7` | **the mechanism left the source cell.** `Enforcing` = ⟨body, substrate, events⟩ + a `realizedBy` ANCHOR; `HarnessMechanism` lives in `core/hook`, INJECTED by the corpus as `accept.ts` takes its `Policy`. BEING/FACE restored |
| 2   | `4a21cb2` | **`ENFORCED` got its leg.** `accept.ts` implemented six of MODEL's seven; the per-leg meta-gate now runs 7/7                                                                                                                    |
| 3   | `6877f69` | **ENGINE caught up to MODEL** — `realize` keyed on the CELL (not `ActivationMode`), `activation(c)` not `activation(class c)`                                                                                                   |

**The port widened rather than the emission moving.** Claude's per-agent hook lives in the agent
file's OWN front-matter, which is what `agentDef` emits — relocating emission would have cost the
per-agent attachment this plan exists to establish. `agentDef(agent, mechanisms)`.

## S4 — the only remaining shard

`pending/s4-hookcell-retire.md`. **Premise corrected: only 2 of the 5 hook cells are agent-scoped**
(`stance-guardrail`, `stance-guardrail-pre`). The other three bind the session or the substrate,
have no agent to compose them, and therefore stay `HookCell`s — so `HookCell` NARROWS rather than
retires (operator-decided).

**Executable now:**

1. Migrate the two stance cells → guardrail dimension values: type `HookCell` → `Guardrails`,
   `residue` → `body` prefixed `stance-guardrail ≜ …` so `anchorOf` recovers the deployed
   `hooks/<anchor>/` path, drop `id`, drop the mechanism fields (they are `HarnessMechanism` now).
2. Supply the corpus mechanism table (`anchor → HarnessMechanism`) to `projectPluginSet`.
3. Compose the two values into `nico` + `mav`.
4. Delete the `agent_type` allowlist from both workers — S2's binding derives that scope.
5. Update two gates: `hook-rule-boundary` (5 → 3 cells) · `stance-guardrail-dark` (import path).

**Two decisions inside it:**

- **`turn.end` on an agent-scoped constraint — RESOLVED: KEEP it. The premise was false.**
  `[CITE]` The claim "a top-level session carries no agent identity on EITHER harness" is falsified
  for claude: `Stop` carries `agent_type` for an `--agent`/`@mention` launch including top-level
  (`hooks/stance-guardrail.ts:143-152`). More decisively, runtime identity is IRRELEVANT there —
  claude attaches `Stop` into the agent's OWN front-matter, so **attachment IS the scope**
  (`adapters/claude/anatomy.ts:112-139`, per-agent file at `project/index.ts:464-471`), and the
  adapter declares no `enforcingSurface` precisely because it attaches per-agent
  (`core/harness-adapter.ts:97-99`). Dropping `turn.end` would have surrendered a bound claude
  already scopes correctly, to buy nothing.
  The codex refusal is CORRECT and stays — but it moved to the seam; see below.
- **`realizable` conflated two predicates — SPLIT, landed ahead of S4.** `[GROUND]`

  Split into `realizable` (can the adapter fire `e` at all) ∧ `scopable` (can it narrow `e` to a
  named agent), with `scopable ⇒ realizable` and a second refusal clause naming `f · e · adapter · a`.
  Source came up to it: `HarnessAdapter.scopes`, a distinct `UnscopableEventError`, `Realizable.agents`
  required so the demand is not reachable by omission.

  **The gap had already cost the design its own invariant.** `refusal.ts` states it is the ONE
  refusal site; because MODEL had no word for the second predicate, the codex adapter had grown a
  private `throw` to ask it — the exact drift that header forbids, invisible because it was never a
  missing string, only a missing distinction. That throw is deleted; the adapter now DECLARES the
  incapacity and the seam decides. Coverage moved rather than vanished (`refusal.test.ts` case 2b).

  **Then the refusal itself was wrong** (operator correction). The canon authors the IDEAL; adapting
  it to a target is the ADAPTER's concern. `[GROUND]` VISION: _"author semantics once, realize
  behavior everywhere"_ and _"operators should require progressively less knowledge of harnesses"_ —
  a build that fails because the operator chose codex demands exactly that knowledge. Per the apex
  order VISION ≻ MODEL, MODEL revised.

  The refusal's premise was false. _"A declared bound that projects to nothing is indistinguishable
  from an undeclared one"_ — it never projects to nothing. `agentBody` emits `bodyOf(value)` for
  every composed value on every harness (`core/anatomy-body.ts`), so the DECLARATION face is
  unconditional and the floor is a **steer**, never silence.

  MODEL now carries `mode : fragment × harness-adapter → {bound, steer}` — a shortfall WARNS,
  withholds the mechanism, keeps the declaration, and the projection completes. `refusal.ts` →
  `realization.ts`. **Degrade ⊥ widen:** degrading changes how strongly the composed agents are
  bound; widening changes WHICH agents are bound. Codex's global `hooks.json` is where widening
  would happen, so degraded bindings are withheld from it.

  **Live consequence, measured:** claude scopes all four canon events (attachment is the scope);
  codex scopes only `subagent.start`/`subagent.end`. Render byte-identical on both. Once S4 composes
  `stance-guardrail` with `turn.end` into nico+mav, **the codex projection degrades that constraint
  to a declaration and warns** — it does not fail. No per-harness split is owed; that fork is closed.

  **Verified by mutation, and the first attempt did NOT convict.** Output-level assertions stayed
  green with the seam's withholding defeated, because codex's agent TOML has no hook field and
  `codexHooksJson` skips unscopable events itself. Seam spies (`degradation.test.ts`) observe what
  the seam HANDS the adapter and convict both mutations.

- **The `guardrails` catalog is mis-signified** — `honesty`/`helpfulness` STEER, and MODEL's
  `⟨bounds, ¬ steers⟩` excludes steering; `scope-of-authority` duplicates `autonomy`;
  `accountability` reads as the disclosure anchor. **Separate plan — do NOT ride it along.**

## Hazards, measured

- Worker content is a **JS template literal** — a backtick in any inserted comment terminates the
  string. Cost one broken parse.
- Inserting an import after "the last line starting with `import`" lands INSIDE a multi-line import
  block. Walk brace depth to find the statement END.
- `--disallowedTools` is **variadic**: one quoted string matches nothing, silently. Verify a tool
  restriction with a question that MUST touch the filesystem if it can.
- Two formatters: **biome** owns `.ts`, **prettier** owns `.md`. Crossing them rewrites every quote.
- After a failed husky commit the mangled files stay STAGED, so `git diff` compares index-to-worktree
  — use `git diff HEAD`.

## Related, deliberately NOT in scope

`check-in ⟨conclusion-first · owed ↦ recommendation-bearing-tail⟩` sits in `autonomy` but
cold-decodes as _"a shape rule for status updates"_. `[COLD]` "how much an agent tells its operator"
is **transparency**, a dimension we already have. The shape half is an `output-format` gap
(`structured-decision` cold-decodes to a decision PROCESS, not report shape — do not force-fit).
Its own plan.
