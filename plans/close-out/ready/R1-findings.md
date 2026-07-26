# R1 · findings — who classifies a memory, and when

**Status.** Complete. Five questions answered, every claim sourced.

**Verdict up front.** The operator's write-time hypothesis is **not confirmed as the primary lever**. It
survives only in demoted form — as a cheap non-authoritative hint. The bloat fix is elsewhere, and it
is mechanical: **bound the store, don't gate the write.** Detail in Q3 and Q5.

---

## Method and epistemic caveats

Read implementations where possible (`mem0` prompt source, `graphiti` node-resolution source, Letta
constants, Anthropic memory-tool protocol spec), docs where source was not reachable, papers last.

Three caveats that bear on how hard to lean on what follows:

1. **The single most decision-relevant source is one un-peer-reviewed preprint** — Yang, _Control-Plane
   Placement Shapes Forgetting_ (arXiv 2606.15903, June 2026, single author). I verified its **abstract**
   directly from the arXiv listing page. The per-category numbers in Q1/Q3 come from a fetch of the HTML
   body that I could **not** independently re-verify — no PDF text extractor is installed on this box
   (`pdftotext`, `mutool`, `qpdf`, `pypdf` all absent). Treat the aggregate direction as well-supported
   (it matches the abstract verbatim) and the individual cell values as **medium confidence**.
2. **My first automated read of that paper was wrong, and wrong in the direction of this shard's
   conclusion** — it returned a clean "write-time loses" story. The abstract is materially more mixed,
   and I have used the abstract. Flagging because a summarizer error that flatters the answer you are
   already reaching is the kind that propagates silently.
3. **Benchmark numbers in this field are actively contested.** Zep published a rebuttal showing mem0's
   paper misconfigured Zep, moving Zep's LOCOMO score from a reported 65.99% to 75.14%
   ([Zep](https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/)). No
   cross-system score in this document should be read as settled.

---

## Q1 — Who classifies, and when?

**Both sides are populated.** This is a genuine architectural split, not a consensus.

### Write-time (the writer emits placement)

| System                    | What the writer does at write time                                                                                                                                                                                    | Source                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Letta / MemGPT**        | The agent itself calls memory tools mid-reasoning and **chooses the target block**. "The agent decides where the lesson belongs and commits the update." Memory management is emergent LLM behaviour, not a pipeline. | [Letta docs](https://docs.letta.com/letta-agent/memory), [Letta blog](https://www.letta.com/blog/agent-memory/) |
| **Anthropic memory tool** | Routing is **by path**, chosen by the model at write time. `create /memories/<the-model-picks-this>`. Free-form — no enum, no schema, no validation.                                                                  | [Memory tool spec](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)                   |
| **A-MEM**                 | At note construction the writer emits a structured envelope: contextual description, **keywords, tags**, timestamp, embedding — then an LLM proposes links to prior notes.                                            | [A-MEM](https://arxiv.org/html/2502.12110v1)                                                                    |
| **Generative Agents**     | Emits an **integer poignancy score 1–10** at the moment the memory object is created.                                                                                                                                 | [Park et al.](https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763)                                          |

### Drain-time (a background/consolidation pass classifies)

| System                      | What happens at drain                                                                                                                                                                                                                             | Source                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **mem0**                    | Two phases, both post-hoc. Extraction pulls candidate facts; a separate **update phase** shows the LLM similar existing memories and lets it pick ADD / UPDATE / DELETE / NONE.                                                                   | [`mem0/configs/prompts.py`](https://raw.githubusercontent.com/mem0ai/mem0/main/mem0/configs/prompts.py)                                                                                    |
| **Zep / Graphiti**          | `add_episode` extracts entities and edges downstream of the write, resolves them against the graph, and invalidates superseded edges temporally.                                                                                                  | [Graphiti node_operations.py](https://raw.githubusercontent.com/getzep/graphiti/main/graphiti_core/utils/maintenance/node_operations.py), [Zep paper](https://arxiv.org/html/2501.13956v1) |
| **Letta sleep-time agents** | A background agent sharing memory blocks with the primary "consolidates fragmented memories, identifies patterns, **reorganizes and deduplicates** memory blocks, archives and prunes." Invoked every N primary steps.                            | [Sleep-time agents](https://docs.letta.com/guides/agents/architectures/sleeptime/)                                                                                                         |
| **LangMem**                 | Explicitly names the axis: hot-path "conscious formation" vs background "subconscious formation," and frames it as a latency-versus-thoroughness spectrum.                                                                                        | [LangMem conceptual guide](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)                                                                                              |
| **MIRIX**                   | Six typed stores (Core, Episodic, Semantic, Procedural, Resource, Knowledge Vault) — closest published analogue to this project. Memory additions are **queued and processed by async workers**, a meta-agent orchestrating specialized managers. | [MIRIX](https://arxiv.org/abs/2507.07957), [DeepWiki](https://deepwiki.com/Mirix-AI/MIRIX)                                                                                                 |
| **Cognee**                  | Typing happens in the **Cognify** step — LLM structured extraction validated against an ontology — not at `add()`.                                                                                                                                | [Cognee](https://www.cognee.ai/blog/deep-dives/grounding-ai-memory)                                                                                                                        |

### A third position worth naming

**LangMem's memory type is chosen by neither writer nor drain — it is chosen by the _developer_ at
configuration time.** You instantiate a semantic manager or an episodic manager; the running system
never classifies. ([LangMem](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)) This
matters: it says a typed store does not _imply_ a classification step at all.

### The most important observation on Q1

**The serious systems do both.** Letta lets the agent place at write time _and_ runs sleep-time agents
that re-place. mem0 defers everything. The write/drain choice is not exclusive, and framing it as a
fork is itself part of the error. Letta's split maps almost exactly onto this repo's existing
write-then-`dream` shape.

---

## Q2 — What structured signal does the writer emit, at what cost, and what breaks when it is wrong?

**What is emitted, ranked by weight:**

- **Nothing** — mem0's writer emits raw conversation. All structure is inferred downstream.
- **A path string** — Anthropic's memory tool. Unvalidated, unenumerated.
- **A scalar** — Generative Agents' poignancy integer; Zep's fact rating.
- **A tag/keyword envelope** — A-MEM.
- **A full placement decision** — Letta (which block, which tool).

**Cost.** LangMem states the tradeoff directly: hot-path formation "adds perceptible latency to user
interactions, and it adds one more obstacle to the agent's ability to satisfy the user's needs"
([LangMem](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)). The cost is not tokens —
it is that the writer is mid-task and classification is a distraction from the task. The control-plane
paper prices the placements: deterministic primitives 64–191 ms/case, LLM-at-mutation ~2.3 s/case, and
inscription-time incurs cost on **every** write while mutation-time incurs it only on actual mutations
([2606.15903](https://arxiv.org/html/2606.15903v2)).

**What breaks when the writer is wrong — this is the disconfirming core.** A write-time decision is
**taken with strictly less information than a drain-time decision**, because the drain sees the
subsequent stream and the existing store; the writer sees neither. Two concrete failures:

1. **Corrupted surface forms are load-bearing forever.** The control-plane paper: mutation-time repair
   "cannot bootstrap from corrupted surface forms already stored." A bad write-time commitment is not
   recoverable downstream.
2. **Write-time classification actively _underperforms_ a dumb string test on collision.** On
   `prefix_collision`, deterministic primitives score **82%**, inscription-time LLM **31%** — a
   50-point _regression_ versus no intelligence at all. The writer, lacking the store, confidently
   merges things it should have kept apart.

The scalar emitters are the interesting exception: an integer costs the writer almost nothing and,
being a magnitude rather than a category, **cannot be "wrong" in a way that mis-files anything** — it
only mis-weights. That asymmetry is the whole reason the demoted form of the hypothesis survives.

---

## Q3 — How is admission to a durable store gated? _(highest-value question)_

**Finding: essentially no shipped system gates admission on a quality judgement. It is inference all
the way down, and the inference is deliberately tuned _permissive_. Where bloat is actually controlled,
it is controlled by a mechanical bound that has nothing to do with content quality.**

### There is no quality gate — and mem0 says so out loud

mem0's `ADDITIVE_EXTRACTION_PROMPT`, verbatim from source:

> **"When in doubt, extract. A slightly redundant memory is far less costly than a missing one."**

— [`mem0/configs/prompts.py`](https://raw.githubusercontent.com/mem0ai/mem0/main/mem0/configs/prompts.py)

That is the opposite of an admission test. The most-deployed OSS memory layer has explicitly chosen
recall over precision and accepted redundancy as the price. Its "categories" (Personal Preferences,
Health, Professional Details, …) are **extraction guidance only, not storage classification** — memories
are stored flat as `{id, text, linked_memory_ids}`.

### Zep rates, then declines to gate on the rating

Zep is the closest thing to a quality signal in production: a `fact_rating_instruction` with a
high/medium/low rubric, supplied at session creation, producing a [0,1] rating per fact. But the rating
is spent at **retrieval**, via the `min_fact_rating` search parameter — low-rated facts are **still
stored**, merely filtered on the way out
([Zep search docs](https://help.getzep.com/v2/searching-the-graph),
[announcement](https://blog.getzep.com/announcing-zep-fact-ratings/)). Even the system that computes a
relevance judgement at ingest does not use it to refuse a write.

### Anthropic's memory tool has no gate at all — and punts it

Six commands: `view`, `create`, `str_replace`, `insert`, `delete`, `rename`. No type, no category, no
schema, no size limit in the protocol. Admission control is explicitly delegated to the integrator
under _Security considerations_: "Track memory file sizes and **cap how large a file can grow**" and
"Periodically **delete memory files that haven't been accessed** in a long time"
([spec](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)).

And the documented remedy for clutter is **more prompting** — the spec's own suggested fix is to add
"always try to keep its content up-to-date, coherent and organized… Do not create new files unless
necessary." **This is precisely the regime this repo is in, and precisely the failure the operator is
reporting.** Prompt-only admission control is a known-insufficient design, documented as such by its
own vendor's need to suggest a mitigation prompt.

### The two mechanisms that _do_ work are both mechanical, and neither judges quality

1. **A hard capacity bound that forces rewrite-in-place.** Letta blocks carry a character `limit`:
   `CORE_MEMORY_BLOCK_CHAR_LIMIT = 100000`, `CORE_MEMORY_PERSONA_CHAR_LIMIT = 20000`,
   `CORE_MEMORY_HUMAN_CHAR_LIMIT = 20000`
   ([letta/constants.py](https://raw.githubusercontent.com/letta-ai/letta/main/letta/constants.py)).
   A bounded block cannot bloat. Growth is converted from an append into an **eviction decision** —
   the agent must choose what to drop to make room. Note the limit is a property of the _block_, not
   of the incoming memory: it needs no judgement about the write.
2. **An accumulator threshold on a cheap write-time scalar.** Generative Agents trigger reflection when
   the **sum of importance scores of recent events exceeds 150**
   ([Park et al.](https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763)). Fully deterministic, and it
   spends the expensive consolidation pass only when accumulated significance warrants it.

### And mechanical tests carry more weight than expected

From the control-plane study: deterministic primitives — plain string and vector operations, no LLM —
score **100% on temporal qualifiers, 92% on substring traps, 82% on prefix collisions**, for a **70.7%
aggregate**. Adding an inscription-time LLM moves that to only **76.2%**. The whole write-time
apparatus buys **~5.5 points** over mechanism ([2606.15903](https://arxiv.org/html/2606.15903v2)).

**Conclusion for Q3.** The census fact that there is "no mechanical admission test" is a real defect,
but the remedy the prior art supports is **not** a smarter admission judgement. Nobody has one and
mem0 argues against having one. The remedy is a **bound on the store** — a capacity limit that converts
unbounded append into forced eviction — plus cheap deterministic tests, which the evidence says do
most of the work. `nico/PROCEDURAL.md` at 102 lines is not a classification failure; it is an
**unbounded-container failure**.

---

## Q4 — How is duplication detected?

The answer is a **cost ladder**, and Graphiti's is the one to copy because it is readable and it puts
the LLM last.

**Graphiti's resolution order**, from
[`node_operations.py`](https://raw.githubusercontent.com/getzep/graphiti/main/graphiti_core/utils/maintenance/node_operations.py):

1. **Exact normalized-string match** — `_collapse_exact_duplicate_extracted_nodes()` calls
   `_normalize_string_exact(node.name)` to collapse duplicates within a single extraction pass. No LLM.
2. **Cosine-similarity shortcut** — `_resolve_with_similarity()`. Resolved candidates **commit and
   `continue`, skipping the LLM entirely**.
3. **LLM adjudication** — `_resolve_with_llm()`, reached _only_ by candidates that survive both cheaper
   tests.

Elsewhere:

- **mem0** — no hash, no key. Similar memories are retrieved by embedding and handed to the LLM, which
  picks ADD/UPDATE/DELETE/NONE. Its dedup instruction: _"If the retrieved fact contains information that
  conveys the same thing as the elements present in the memory, then you have to keep the fact which has
  the most information."_ Inference-only
  ([source](https://raw.githubusercontent.com/mem0ai/mem0/main/mem0/configs/prompts.py)).
- **Zep/Graphiti edges** — same shape as nodes, with hybrid search **constrained to edges between the
  same entity pair**, i.e. a structural key narrowing the candidate set before comparison.
  Contradiction is handled by setting `invalid_at` rather than deleting, preserving history
  ([Zep paper](https://arxiv.org/html/2501.13956v1)).
- **Letta** — deduplication is a **sleep-time agent responsibility**, not a write-path check
  ([docs](https://docs.letta.com/guides/agents/architectures/sleeptime/)).
- **Anthropic memory tool** — none whatsoever. `create` on an existing path is documented as
  "creates or overwrites"; there is no content-level duplicate detection in the protocol.

**Conclusion for Q4.** The census observation that there is "nothing to dedup _on_" is correct and is
the actual duplication defect — but the fix does not require a write-time type tag. Graphiti dedups
against a **normalized name**, which is derived from content at drain, not declared by the writer.

---

## Q5 — Verdict

**Build — but build the bound, not the router; and demote the operator's hypothesis rather than adopt
it.** No named system is adoptable wholesale: mem0 is untyped and explicitly pro-redundancy, MIRIX is
the right shape but its routing is a queued async worker pool rather than anything portable, and
Letta's answer is a _product architecture_, not a component. What the prior art does supply is two
mechanisms worth lifting directly, and one hypothesis worth refusing. Lift **Letta's hard character
limit per store** — a bounded container cannot bloat, and it converts unbounded append into a forced
eviction decision without requiring any judgement about the incoming memory, which is the only
mechanism in the entire survey that demonstrably fixes the operator's 102-line `PROCEDURAL.md`. Lift
**Graphiti's cheap-to-expensive resolution ladder** — exact normalized match, then cosine similarity,
then LLM only for survivors — which gives duplication a mechanical basis derived from content at drain
rather than declared by the writer, answering "nothing to dedup on" without touching `tags`. Refuse the
hypothesis in its strong form: write-time classification buys only ~5.5 points over pure mechanism
(70.7% → 76.2%) while drain-time mutation buys 22.6 (→ 93.3%), it _regresses_ 50 points below plain
string matching on prefix collisions (82% → 31%), it taxes every write to pay for a decision taken with
strictly less information than the drain has, and — decisively — the contractual ban on `tags` routing
that framed this shard is **vindicated, not indicted**, because a writer-declared category is the one
signal the evidence shows is worse than no signal. Keep the write-time channel open only in its
demoted, cheap, non-authoritative form: a **scalar**, in the shape of Generative Agents' poignancy
integer and Zep's fact rating — it costs the writer nothing, it cannot mis-file anything because a
magnitude has no target, and Generative Agents shows the deterministic use for it (accumulate; trigger
consolidation on threshold, theirs at 150) that gives the drain a principled schedule instead of a
guess. Mechanism design is S3's; this shard's contribution is the constraint that the router stays at
drain and the bound moves to the store.

---

## Disconfirming evidence for the write-time hypothesis — consolidated

Carried explicitly, per the shard's constraint.

1. **Write-time classification is beaten by _no_ classification on a real category.** `prefix_collision`:
   deterministic 82%, inscription-time LLM 31%. ([2606.15903](https://arxiv.org/html/2606.15903v2),
   medium confidence per caveat 1)
2. **Its aggregate lift over mechanism is marginal** — 70.7% → 76.2% — while deferring to mutation-time
   yields 93.3%. (ibid.)
3. **mem0, the most-deployed OSS memory layer, defers 100% of classification and stores flat**, having
   concluded redundancy is cheaper than loss. ([source](https://raw.githubusercontent.com/mem0ai/mem0/main/mem0/configs/prompts.py))
4. **Zep computes a relevance judgement at ingest and still refuses to gate admission on it** — it is a
   retrieval filter. ([Zep](https://help.getzep.com/v2/searching-the-graph))
5. **LangMem locates memory type at _configuration_ time**, demonstrating a typed store needs no runtime
   classifier at all. ([LangMem](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/))
6. **Letta — the strongest write-time exemplar — found write-time placement insufficient** and added
   sleep-time agents to reorganize and deduplicate what the writer placed.
   ([Letta](https://docs.letta.com/guides/agents/architectures/sleeptime/))
7. **Write-time cost falls on every write; drain-time cost falls only on mutations.**
   ([2606.15903](https://arxiv.org/html/2606.15903v2))
8. **The writer is structurally information-poor** — it sees neither the subsequent stream nor the
   existing store, which is exactly what a duplicate/redundancy judgement requires.

**Surviving support for the hypothesis** (stated so the refusal is not overstated): inscription-time is
the _only_ regime that solves canonicalization — 100% on identifier obfuscation and cross-lingual
identity, versus 5% and 0% deterministic. If this project ever needs cross-surface identity resolution,
that capability lives at write time and nowhere else. It is not what the operator's symptoms are about.

---

## Sources

- [mem0 `configs/prompts.py`](https://raw.githubusercontent.com/mem0ai/mem0/main/mem0/configs/prompts.py)
- [Graphiti `node_operations.py`](https://raw.githubusercontent.com/getzep/graphiti/main/graphiti_core/utils/maintenance/node_operations.py)
- [Letta `constants.py`](https://raw.githubusercontent.com/letta-ai/letta/main/letta/constants.py)
- [Letta — memory](https://docs.letta.com/letta-agent/memory) · [sleep-time agents](https://docs.letta.com/guides/agents/architectures/sleeptime/) · [agent memory blog](https://www.letta.com/blog/agent-memory/)
- [Anthropic memory tool spec](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
- [LangMem conceptual guide](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)
- [Zep — searching the graph (`min_fact_rating`)](https://help.getzep.com/v2/searching-the-graph) · [fact ratings announcement](https://blog.getzep.com/announcing-zep-fact-ratings/) · [Zep paper](https://arxiv.org/html/2501.13956v1) · [mem0 benchmark rebuttal](https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/)
- [Yang, _Control-Plane Placement Shapes Forgetting_](https://arxiv.org/abs/2606.15903) · [HTML body](https://arxiv.org/html/2606.15903v2)
- [Park et al., _Generative Agents_](https://dl.acm.org/doi/fullHtml/10.1145/3586183.3606763)
- [A-MEM](https://arxiv.org/html/2502.12110v1)
- [MIRIX](https://arxiv.org/abs/2507.07957) · [DeepWiki](https://deepwiki.com/Mirix-AI/MIRIX)
- [Cognee — grounding AI memory](https://www.cognee.ai/blog/deep-dives/grounding-ai-memory)
