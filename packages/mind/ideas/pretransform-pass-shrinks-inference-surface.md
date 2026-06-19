---
kind: concept
delineation: Most of what an agent does in a transformation is mechanical bookkeeping disguised as inference — run a deterministic pre-transform pass (codemod, scaffolder, schema-gen) between setup and dispatch, so the agent receives only the small inference-shaped residue.
---

# Pre-Transform Pass Shrinks the Inference Surface

Calibration: "rewrite these 80 components" is ~70 mechanical (find the call site, swap the import, rename, preserve the argument shape) and ~10 needing judgment — the residue is the agent's actual surface area.

Saltzer's end-to-end at the agent/program boundary: mechanical work goes to the layer holding the structural information for it; the agent gets the layer that needs inference. Run the pass first, dispatch against the residue — don't braid it into the agent's loop ([[hickey]]). A structured verifier, inverted, _is_ a generation spec — where it reports "lacks X", the generator writes X; and a source-pinned golden ([[golden-master-equivalence-oracle]]) serves twice: oracle after, seed before.

Codemod alone leaves the 10 hard cases as silent bugs; agent alone drowns in bookkeeping — the composition (deterministic pass + agent residue + verifier loop) is the win ([[engine-orchestrates-agents-execute]]).

## See also

- [[engine-orchestrates-agents-execute]] — the reliability thesis this operationalizes.
- [[closed-context-of-an-inference-call]] — the shrunk surface is the closed input the agent reasons over.
- [[two-phase-bulk-then-unit-dispatch]] — the procedural sibling: bulk first, residue second.
- [[golden-master-equivalence-oracle]] — the golden that doubles as oracle and seed.
