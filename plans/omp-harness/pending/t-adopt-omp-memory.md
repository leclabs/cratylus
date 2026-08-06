# t-adopt-omp-memory

**Wave 2.** omp's memory backend replaces the bespoke strategy.

## Why this is a deletion, not an addition

`memory.backend = off|local|hindsight|mnemopi` and
`providers.memoryModel = online|qwen3-1.7b|llama3.2:3b|gemma-3-1b|qwen2.5-1.5b|lfm2-1.2b`.

W4's research reached two conclusions this makes cheap: **hindsight is production-grade and
worth harvesting**, and **the consolidation model should have its own binding, separate from
the working session's**. Wiring both by hand was judged more expensive than it returned. omp
ships them.

## The question this shard must answer honestly

**What survives adoption, and what is lost?** The research named things this corpus does that
no surveyed system does:

- **the being LOADS WHOLE rather than retrieving** — identity is not contingent on a query;
- **`projection-carries`** — memory that credits the commons before storing privately;
- **provenance ≠ scope**, computed rather than reasoned.

hindsight's contract is `recall(query) → fragments`, and its
`dynamicBankGranularity: ["agent","project"]` re-conflates provenance with scope. If adoption
costs those, it is not a straight win and the shard must say so rather than discovering it
later.

## Constraints

- **The fidelity ladder decides the shape**: PROXY omp's backend where it is present, PROVIDE
  ours where it is not, DECLARE where neither. A harness without a memory backend must still
  get an agent with a past.
- `MemoryStrategy` is a PORT. Adoption means a new strategy behind it, not deleting the port —
  deleting it would make every non-omp harness memoryless.
- Measure before switching: 8 of 10 agent homes have never consolidated. A backend swap that
  does not fix THAT has not addressed the problem W4 opened.

## Deps

`t-cross-harness-continuity`

## Accept

1. An omp-backed memory strategy behind the existing port, selected by configuration.
2. A written account of what the corpus's own memory model gains and loses.
3. Continuity still holds across harnesses — the previous shard's tests still pass.
