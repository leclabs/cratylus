# R1 · memory-prior-art

**Objective.** Answer one question with evidence: **should routing signal be emitted at write time,
or inferred at drain time?** The operator floated write-time signals as a hypothesis. Carry it as a
hypothesis. Return a verdict, not a literature list.

## Why this survives when the bug-fixes did not need it

V2 and V3 fix three defects that are deterministic and have zero design dependency. What they do
**not** touch is the architecture behind the operator's other symptoms — procedural bloat, duplicate
memories, memories restating what source context already carries. Those need a design decision, and
the census established the fact that frames it:

> There is **no write-time routing signal, by design**. `tags` is the obvious carrier and is
> contractually forbidden from routing — `record.ts:26` "Refine, never route (SPEC D2/D4)". Every
> routing decision is therefore 100% deferred inference over free-form prose, at drain, with no
> structured input.

That single fact explains mis-routing, duplication (nothing to dedup _on_), and unbounded
`PROCEDURAL` growth (no mechanical admission test). It makes the operator's hypothesis
architecturally well-founded — but well-founded is not the same as right, and "obvious" is exactly
when to check.

## Live corpus facts (measured — do not re-derive)

- Real homes are `~/.agents/{mav,nico}`. `mav/EPISODIC.jsonl` 6 records, `nico` 10. All 16 bodies are
  strings; no double-wrapped records currently resident.
- Bloat is real by size: `nico/PROCEDURAL.md` **102 lines** of dense multi-clause prose vs
  `SEMANTIC.md` 13. `mav` 53/59. Baseline agents sit at 11/14 — seed only.
- Restatement is real: `mav/SEMANTIC.md` "Facts I carry" restates `.cratylus.config`,
  `.claude/settings.json worktree.bgIsolation`, and repo layout — content the projection already
  carries. **No admission test exists to reject it.**

## Questions

1. In shipped long-term-memory systems, **who classifies, and when** — the writer at write time, a
   background consolidator, or the reader at recall? Name systems on **both** sides; a survey that
   finds only agreement has not looked hard enough.
2. What structured signal, if any, does the writer emit? What does it cost the writer to emit it, and
   what breaks when the writer is wrong?
3. How is **admission** to a durable store gated — is there a mechanical test, or is it inference all
   the way down? This is the bloat question; it is the one that matters most.
4. How is **duplication** detected — embedding similarity, content hash, structured key, or not at all?
5. **Verdict**: adopt a named approach, or build. Which, and why. One paragraph, committed.

## Constraints

- Every claim sourced. An unsourced claim is worse than a gap because it looks like evidence.
- Prefer systems whose implementation can be read over papers describing systems that cannot.
- Report **disconfirming** evidence for the write-time hypothesis if it exists. The operator asked
  for it to be carried as a hypothesis; returning only support is not carrying it.
- Do not design the remedy. That is S3.

## Outputs

`plans/close-out/ready/R1-findings.md`

## Acceptance

1. `R1-findings.md` exists and answers all five questions.
2. Q1 names systems on **both** sides of the write-time/drain-time split, or states with evidence
   that one side is empty.
3. Q5 is a verdict with a reason, not a list.
4. Every factual claim carries a source.
