# H · hook-collapse (per-hook)

**Slice** CORPUS · **Wave** 2 · **Deps** E1 ⊳dep, E2a ⊳dep · **State** pending · **Executor** nico

Parameterized by `<hook> ∈ {stance-guardrail, praxis-continuity}` (`src/hooks/*.ts`). Each edits ONLY its own
`src/hooks/<hook>.ts` file.

## Objective

Collapse one `HookCell` to the MODEL shape (D9): strip type/filename restatement; `definiens`→residue. Leave the
behavior + bytes intact.

## Spec

- Drop `kind: 'hook'` (restates the type — the `organ`-field sin).
- `id` and `slug` are the same string == the filename → collapse to ONE anchor (or drop both if derivable).
- `definiens` → **residue σ\*** (E2a).
- **Keep untouched**: `substrate`, `events`, `command`, `timeout`, `refs`, and `workers[].content` — the worker
  BYTES are byte-locked (`test/hook-rule-boundary.test.ts`) and are code, not σ\*.

## Scope boundary (do NOT conflate with the rubric fix)

This task is the **structural** cell collapse only. The stance-guardrail **rubric/horizon fix** (widen the
judge's input to the operator turn + a signal-4 for order-taking — Mav's post-mortem) is a **separate** engine
work-item, NOT part of this task. Do not edit worker logic here.

## Acceptance (falsifier)

- FAIL if `kind` or a duplicated `id`/`slug` survives (E2b REDs).
- FAIL if `definiens` is still prose (E2a REDs).
- FAIL if any `workers[].content` byte changed (byte-lock test must stay green — this task doesn't touch bytes).
- FAIL if `pnpm --filter @leclabs/agent-anatomy typecheck` REDs or the hook no longer projects/deploys.

## Return

Per-field kept/dropped · the residue `definiens` · byte-lock still green · projection/deploy check.
