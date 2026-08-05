# R1 — prior-art survey: how working long-term agent memory is actually built

**Wave 0 · deps: none · state: ready · delegable**

## Intent

Answer the operator's question directly: _"Surely someone out there has implemented long-term memory that
just works — is there a similar tool/library we can study?"_ Produce a grounded survey of how shipped
systems factor agent long-term memory, aimed squarely at the decisions `memory` has to make.

This is research, not design. R1 returns findings. S3 decides.

## Inputs

- `packages/memory/src/route.ts` — the store taxonomy in force (CoALA 4-part; Working unpersisted)
- `packages/memory/src/record.ts` — the record shape, and the `tags`-may-not-route contract
- `packages/canon/src/skills/dream/skill.ts` — the consolidation ritual as currently specified
- `plans/heartbeat-organ/PLAN.md` §Prior art — an existing, cited sweep establishing that consolidation is
  gated by **pressure/salience thresholds or a phase transition**, never clocked by a pulse. That finding
  is settled; carry it, do not re-derive it.

## The questions to answer

1. **Named systems.** Which shipped/published systems implement agent long-term memory with consolidation
   — at minimum: MemGPT/Letta, Mem0, Zep/Graphiti, LangMem, Generative Agents, A-MEM, cognitive
   architectures (LIDA/SOAR/ACT-R). For each: store taxonomy, what triggers consolidation, what is
   deterministic vs model-judged, and how they dedup.
2. **The write-time-signal question — the crux.** Do any of them capture structured signal AT WRITE TIME to
   drive later routing, or do they all defer classification to consolidation as we do? If they defer,
   what makes it work for them? If they capture, what exactly do they capture, and what does it cost the
   writer? Answer this with specifics; it is the operator's central hypothesis and S3 turns on it.
3. **The deterministic/inference split.** Which parts of the pipeline are mechanical in practice —
   dedup, salience scoring, admission, decay/forgetting, compaction — and which genuinely need a model?
   Name the actual mechanisms (embedding-similarity thresholds, recency/frequency scoring, LRU/TTL decay,
   graph merge, contradiction detection).
4. **Bloat control.** How does anything prevent a generalized-wisdom store from growing without bound?
   Look for explicit admission tests, merge-on-write, contradiction resolution, periodic re-compaction,
   and eviction. This is `PROCEDURAL` bloat, which is a live symptom here.
5. **Whether to buy instead of build.** Is any of this a library we should adopt rather than reimplement?
   Judge honestly against our constraints: local-first, file-backed markdown stores, no network, no
   embedding service assumed, must run inside a Stop/skill hook, portable across hosts.

## Constraints

- **Ground every claim.** A named system, a link, and what it actually does. Unsourced recollection about
  a library's behavior is worthless here and worse than silence — it is how we get a design built on a
  system that does not work the way we remembered.
- Distinguish **published research** from **shipped implementation**. Both are useful; conflating them is not.
- Note licence and dependency weight for anything proposed as adoptable.
- WebSearch/WebFetch run in the MAIN loop reliably; a sandboxed subagent may have them blocked. If a fetch
  is refused, say so rather than substituting recollection.

## Outputs

`plans/memory-consolidation/ready/R1-findings.md` — the survey. Comparison table across systems on the five
questions, then a short section per question stating what it means for `memory` specifically. Close
with the two or three systems most worth copying from and **what precisely to copy**.

## Acceptance

- Question 2 (write-time signal) is answered with **named systems on both sides** of the question, or with
  an explicit finding that the split does not exist and why. A survey that only describes stores and skips
  the write-time/drain-time factoring FAILS — that factoring is the reason this shard exists.
- Question 5 returns a real verdict (adopt X / adopt nothing, because …), not a list of options.
- Every system named carries a source. Any claim that cannot be sourced is dropped or marked unverified.

**Falsifier (this must fail on the pre-state):** run the acceptance against the repo as it stands today —
`R1-findings.md` does not exist, so every criterion fails. Any acceptance that would pass before the work
is done is mis-specified and must be rewritten.

---

**DISPOSITION (mav, 2026-07-26) — RE-AUTHORED AND EXECUTED in `close-out`.**

Carried forward as `close-out`/R1 and run:
`plans/.retired/close-out/completed/R1-findings.md`.

Verdict: **build the bound, not the router.** The operator's write-time hypothesis is NOT
confirmed as the primary lever and survives only demoted. The survey hunted disconfirming
evidence as instructed and found it, and flagged that its own first automated read of the
key source was wrong _in the direction that flattered its conclusion_.

The merge initially dropped this shard's buy-vs-build constraint set (local-first, no network,
no embedding service, runs in a hook). That was caught and restored into S3 — and it bit:
R1's recommended dedup ladder has a cosine rung assuming an embedding service.
