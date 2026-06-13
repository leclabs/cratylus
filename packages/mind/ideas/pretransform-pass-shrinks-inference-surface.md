---
kind: concept
delineation: Most of what an agent does in a transformation is mechanical bookkeeping disguised as inference — run a deterministic pre-transform pass (codemod, scaffolder, schema-gen) between setup and dispatch, so the agent receives only the small inference-shaped residue.
---

# Pre-Transform Pass Shrinks the Inference Surface

An agent told "rewrite these 80 components" looks like 80 acts of inference; ~70 are mechanical (find the call site, swap the import, rename, preserve the argument shape) and ~10 need real judgment. Handing the whole pile to the agent pays LLM rates for bookkeeping. So run a **deterministic pre-transform pass** (codemod, regex bank, scaffolder, schema-driven generator) between setup and dispatch; the agent then receives a smaller, harder task — its actual surface area.

Saltzer's end-to-end at the agent/program boundary: put mechanical work at the layer with the structural information for it; reserve the agent for the layer that needs inference. Don't braid the pass into the agent's loop ([[hickey]]): run it first, dispatch against the residue. A structured verifier, inverted, _is_ a generation spec — where it reports "lacks X", the generator writes X; and a source-pinned golden ([[golden-master-equivalence-oracle]]) serves twice: oracle after, seed before.

The composition is the win: deterministic pass + agent residue + verifier loop, each doing the work it is suited for ([[engine-orchestrates-agents-execute]]). Codemod alone leaves the 10 hard cases as silent bugs; agent alone drowns in bookkeeping.

## See also

- [[engine-orchestrates-agents-execute]] — the reliability thesis this operationalizes.
- [[closed-context-of-an-inference-call]] — the shrunk surface is the closed input the agent reasons over.
- [[two-phase-bulk-then-unit-dispatch]] — the procedural sibling: bulk first, residue second.
- [[golden-master-equivalence-oracle]] — the golden that doubles as oracle and seed.
