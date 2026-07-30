# enforcing-fragment — findings

One home for what this plan established. Supersedes six session-strata documents
(`GROUND-registers…`, `ALTITUDE-…`, `COLD-agent-profile-schema.md`, `MODEL-where-enforcement-belongs`,
`RESEARCH-guardrail-concept`, `DEFECT-warm-oracle`), which were layers of one session's reasoning
and are collapsed here.

**Provenance is marked on every claim, because it is not uniform.**
`[GROUND]` read off VISION/MODEL/ENGINE/CANON · `[COLD]` the canonical
`toolkit/cold-oracle/cold-oracle.sh` harness · `[CITE]` externally checkable sources · `[WARM]`
subagent probes, **which are not cold** and whose naming judgements do not stand.

---

## 1. The registers `[GROUND]`

| register | MODEL/ENGINE                                                                                            | artifact                                  |
| -------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| source   | `author : Intent → cell` · `catalog : DimensionName → ℘(fragment)`                                      | `agent-canon` cells                       |
| build    | `select` → `compose(select(a)) = ir(a)`                                                                 | the composed IR                           |
| project  | `deploy(c,adapter) = inject(content(c), realize(c, adapter))` · `Target ≜ harness-declaration-artifact` | `~/.claude/agents/*.md` · `settings.json` |
| runtime  | the harness reads the Target                                                                            | Claude Code · codex                       |

MODEL names it **BEING/FACE**: _a cell is a BEING; deploy projects it to MANY per-harness Targets =
its FACES._ ∴ **the source register is harness-innocent by construction** — the invariant that
catches a mechanism smuggled into a cell.

`mechanism : fragment × harness-adapter ⇀ harness-mechanism ⟨what deploy EMITS⟩`. MODEL puts exactly
**two** things on a fragment: `events` and `substrate`.

## 2. What MODEL already settled `[GROUND]`

Recorded because a whole session was spent re-deriving these:

- substrate-relative refusal, and ROUTE for a foreign substrate — MODEL `ENFORCED`, verbatim.
- _"COMPOSITION is the scope, ¬ a runtime self-filter"_ — condemns the `agent_type` grep, verbatim.
- `activation : cell ⇀ ActivationMode` is **instance-level** with Kind-typical DEFAULTS — already
  correct; any plan text calling this "owed" is stale.
- `enforcing(f) ⇔ events(f) ≠ ∅ ⟨bounds, ¬ steers⟩` — ∴ `honesty`/`helpfulness` are mis-filed in the
  `guardrails` catalog, since a steering value is not enforcing.

**Read the ground before the plan. A plan file is a working note; MODEL is apex.**

## 3. Where enforcement belongs

- **Guardrail ≜ an out-of-band, task-invariant predicate with veto power, mounted at a boundary,
  that the guarded reasoning cannot talk its way out of.** The persuasion test is definitional: if
  content flowing through the check can alter the check's own policy, it is an instruction. `[CITE]`
  NeMo rail taxonomy (input·dialog·retrieval·execution·output) · Llama Guard · Bedrock Guardrails.
- **Stance-drift enforcement is NOT a guardrail.** A guardrail is `P(artifact, policy)`; this is
  `P(trace, declaration)`. The clean test: _could you run the check on a shuffled sample of outputs
  with no knowledge of which agent produced them?_ Toxicity yes; stance drift no. `[CITE]` its real
  names are **persona drift** (Li et al., COLM 2024) and **role adherence** (DeepEval, Galileo) —
  which the industry files in the **evals** product, not the guardrails product.
- **The authority case wants a narrower grant, not a detector.** `[CITE]` If "advises but does not
  execute" is enforced by not binding the write tools, there is no drift to detect. Corroborated
  `[COLD]` by the Agent Profile Schema, which expresses authority declaratively per tool:
  `tools[].permission : auto|confirm|deny` alongside `sideEffects : none|reversible|irreversible`.
- **Declaration and configuration are two artifacts.** `[COLD]`, unprompted: _"policy artifact
  declares WHICH TIER IS REQUIRED; config/code artifact declares HOW THAT TIER IS ENFORCED."_ Our
  `agent-canon` is the policy artifact; the projected `settings.json`/front-matter is the config one.
- **A turn-end role-consistency check has NO industry name.** `[COLD]` The oracle refused to name
  one rather than fabricate. ⊥ is a result: concept real, language short ⇒ a signify pass is owed
  rather than a borrowed word.

## 4. The gate architecture

MODEL declares **seven** Universal legs. `accept.ts` implemented six — `ENFORCED` was absent from
the header, the `Leg` union and `UNIVERSAL_LEGS` alike, so a cell passed the gate while declaring a
bound that projects to nothing. MODEL states the consequence itself: _a declared bound that projects
to nothing is INDISTINGUISHABLE from an undeclared one._

`enforced(declared, emitted)` now convicts two shapes — **unprojected** (declared, nothing emitted)
and **ambient** (emitted, not scoped to the composing agent). Global like `REGENERABLE`, since a
cell cannot witness its own projection.

## 5. Method — the cold oracle

**A spawned subagent is NEVER cold.** It inherits project `AGENTS.md` (carrying cratylism and
`cold-decode-oracle` itself), `gitStatus` commit subjects, the deployed `~/.claude` corpus, and skill
CONTENT. Measured: probes returned our own commit subjects verbatim and said _"I read it off the
deployed agents rather than inventing a set."_

**Use the canonical harness, which already encodes all of this:**

```sh
sh packages/agent-canon/src/toolkit/cold-oracle/cold-oracle.sh --text '<fragment>' [--raw]
```

For a bare QUESTION, mirror its isolation: scratch dir outside the repo, `CLAUDE_CONFIG_DIR` at a
credentials-only dir seeded FRESH from the Keychain (`security find-generic-password -s "Claude
Code-credentials" -w`), tool-less, **prompt via stdin** (`--disallowedTools` is variadic and would
swallow a positional prompt). Do not copy `.credentials.json` — it fails with a revoked token.

∴ every `[WARM]` naming judgement in this plan's history is unverified. `[CITE]` claims survive
regardless of who asked.
