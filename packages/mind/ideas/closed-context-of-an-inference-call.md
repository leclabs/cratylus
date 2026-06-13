---
kind: concept
delineation: Treat an inference call's input like a compiler's translation unit — every input explicit, sufficient at call-time, and recorded; out-of-band runtime reads break closure and erase replay, audit, and comparison.
---

# Closed Context of an Inference Call

A compiler's input is a closed set (sources, headers, flags), and its output is reproducible because of it. An LLM inference call earns that property only under the same discipline: **every input explicit, sufficient at call-time, and recorded for audit.** Runtime side-channels at inference time — fetching a resource mid-prompt, reading the working directory, time-dependent assembly — break closure: two calls with identical recorded prompts can then diverge.

Three closure violations: **runtime fetch inside the prompt** (the fetched value lives outside the record); **mode-mixed resources** (one prompt branching on a mode complects modes with content ([[hickey]]) — split into two definitions); **implicit context** (env vars, file snooping, unsummarized history — invisible to audit and replay).

The discipline: **compile the prompt** (assemble and persist the full input at dispatch; the recorded prompt _is_ the input); **no runtime side-channels** (preparation and in-call behaviour must not overlap); **one purpose, one agent definition**. Closure is what makes replay, audit, and comparison even definable — treat dispatched prompts like compiled object files: stored, hashed, diffed, replayed.

## See also

- [[hickey]] — complecting modes with content is the source of the mode-mixing failure.
- [[generated-artifact-provenance]] — the recorded prompt is itself a provenance artifact.
- [[engine-orchestrates-agents-execute]] — the engine compiles the prompt; the agent is the closed-input inference leaf.
