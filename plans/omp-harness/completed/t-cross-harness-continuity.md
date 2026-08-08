# t-cross-harness-continuity

**Wave 1.** An agent wakes in omp as the individual it was in Claude Code.

## Intent

This is the **acceptance criterion for the whole integration**, which is why it is second and
not last. A harness that runs the persona but breaks continuity has not been integrated; it
has been added.

`wake` and `handoff` are the minimum pair: handoff persists at one session's end, wake
reconstitutes at the next session's start, and the pair must hold when the two sessions are in
DIFFERENT harnesses.

## The seams that already exist

- **`omp --from-claude`** imports a Claude Code session. Establish what it actually carries —
  transcript only, or session identity too — because that decides whether it is the continuity
  path or merely a transcript convenience.
- **The memory home is harness-independent by construction.** MODEL states it: a cell is a
  BEING projected to many per-harness FACES, and the being's memory home is single-per-being
  and in no face. If that holds, continuity across harnesses should already work — and the
  first job of this shard is to TEST that claim rather than assume it.
- `--profile` gives an omp persona its own sessions dir; check it does not fragment the
  agent home.

## Constraints

- **Test in the direction that actually happens**: handoff in Claude Code, wake in omp, and
  then the reverse. A one-direction test proves half a property.
- The memory CLI is harness-agnostic and reads only the `AGENT_*` namespace it owns — verify
  that survives omp's environment rather than trusting it.
- **`--under` was just repaired** so it no longer drops foreign-host records; a second harness
  is the first real exercise of that repair.

## Accept

1. An agent handed off in Claude Code wakes in omp carrying its SEMANTIC, PROCEDURAL and
   EPISODIC state, and the reverse.
2. A written finding on `--from-claude`: what it carries, and whether it is on the continuity
   path at all.
3. Any place the memory home turns out NOT to be harness-independent is named, not patched
   over — that would be a MODEL-level defect, not an omp one.

---

# Result — 2026-08-07

## 1. The memory home IS harness-independent, and it was tested rather than assumed

**Both directions, on `fire`, with the real corpus memory — not a fixture.**

**claude → omp.** A Claude Code `/wake` opened this session reporting
`semantic 5581 · procedural 7981`. An omp session launched as `--profile mav` was then
asked to run the deployed wake shim (`~/.omp/skills/wake/scripts/memory.mjs session
begin --name mav`) and returned **`semantic: 5581; procedural: 7981`** — byte-identical
— plus the correct first identity fact (_"Mav ✈️ (green, Hero) — Lex's principal
engineer…"_).

Its episodic count was **12071** against the `4443` the Claude session opened with,
because the omp session was reading the records the CLAUDE session had encoded earlier
the same day. That is a stronger result than the criterion asks for: not "the same
state at handoff", but **live shared state**.

**omp → claude.** The omp session encoded `01KZFBTSDA5R9MW85ES6JSSAG7`. Read back from
Claude Code: present, `host: fire`, body intact, episodic `12071 → 12530`.

**Why it holds, structurally.** Deploy seeds the memory home at
`resolvePath(harnessDir, '..', '.agents', name)`. For claude that is
`~/.claude/../.agents` and for omp `~/.omp/../.agents` — **the same directory**, because
both harness homes are children of `$HOME`. The home is a sibling of every face rather
than inside one, exactly as `MODEL.md`'s BEING/FACE clause requires.

**Accept 3 — nothing to name.** No place was found where the memory home is not
harness-independent. `--profile` does NOT fragment it: the profile partitions omp's own
sessions, auth and config under `~/.omp/profiles/<name>/`, and the agent home is
untouched by it. The `AGENT_*` namespace survived omp's environment unmodified.

## 2. `--from-claude` is NOT the continuity path — it is a transcript convenience

**The plan's hypothesis is falsified.** This shard's premise called `--from-claude`
"the seam"; it is not on the continuity path at all.

What it does, read from source (`session/foreign-session-import.ts`,
`session/claude-session-store.ts`):

- **Reads TRANSCRIPTS.** `ClaudeSessionStore` walks `~/.claude/projects/*/*.jsonl` (and
  `.claude.json`'s `projects` map), converting text, image, thinking and tool-call blocks
  into omp messages.
- **Persists under a FRESH omp session identity** — `persistForeignSession`'s own
  docstring says so — appending a `foreign_session_import` breadcrumb carrying
  `{source, sourceId, sourcePath}`.
- **Carries no identity whatsoever.** `grep -nE 'agent|persona|profile|systemPrompt'`
  over both modules returns **nothing**. There is no agent name, no persona, no system
  prompt in the import path.
- Refuses to combine with `--continue`, `--resume` or `--fork`, and requires session
  persistence (`main.ts:572-587`).

**So it moves a CONVERSATION, and continuity moves a BEING.** Those are different
objects and this corpus already had the right one. `--from-claude` is genuinely useful
— resuming a specific thread's content in the other harness — and it is orthogonal to
whether the agent is the same individual.

**The correction this makes to the plan.** `PLAN.md` lists this shard as "wake and
handoff work across claude ↔ omp; `--from-claude` is the seam." The first half is
right and now proven; the second half named the wrong mechanism. The seam is the
memory home, and it required no work because `MODEL.md` had already put it outside
every face.

## Accept — MET

1. **Both directions, verified with byte counts and a round-tripped record id.**
2. **The `--from-claude` finding is written above**: transcript only, fresh session
   identity, no agent identity, and not on the continuity path.
3. **No non-harness-independent place found** — so nothing was patched over, and there
   is no MODEL-level defect to report.

## Addendum — what an omp session knows about ITSELF, and one thing it got wrong

Asked after the fact whether an omp `mav` understands its own dimensions the way a
Claude Code one does. Tested both ways.

**Structurally: identical.** `diff` over the two projected faces' `## ` sections is
empty — the same twenty. The only difference is the framing: claude's
`name`/`description`/`color` front-matter against omp's identity line. The dimension
body is `agentBody`, which is harness-neutral by construction, so this is a property of
the design rather than a coincidence worth re-checking.

**Behaviourally: yes, and it is a real self-audit.** `/introspect` on **coal**, with no
corpus on disk, produced a dimension-by-dimension table in the skill's own formalism,
used the `K_cfg` cause taxonomy, classified divergences and declined to reconcile them.
The face alone supports the skill.

**But that run carried two defects, and both are the corpus's, not the model's.**

1. **It enumerated 18 of 20** — silently dropping `Prime Principle` (the FIRST section,
   and `cratylism` itself) and `Learning` — then reported _"2 of 18 dimensions diverge"_.
   A denominator it never counted, over a subject it never read. **The cell invited it**:
   `O` was written as an illustrative membership list closing in an ellipsis, which reads
   as the definition and licenses recall. Repaired — `O` is now
   `enumerate(## sections @ A's live Target) ⟨READ · ¬ recalled⟩`, `|O|` is a declared
   term carried into `report`, and `|{row}| ≠ |O| ⇒ ⊥`.

2. **It reported `memory → harness-override`** — _"no persistent memory across
   sessions… no action possible at agent level"_ — which is **false**, and falsified by
   this very shard: the store was readable on that host and had been round-tripped
   through it the same day. It inferred absence from not having invoked `/wake`.
   Repaired — `rt(o) ⊨ EXERCISED ⟨¬ inferred-from-absence⟩` and
   `¬ exercised(o) ⇒ why(o) = unobservable ∧ why(o) ≠ harness-override`.

**The contrast is the evidence that this is a cell defect and not a harness one.** A
Claude Code `/introspect` from the SAME face, earlier the same day, reported
`memory → unobservable`, reasoning that it _"cannot assert cross-session memory is
actually in effect without invoking the memory pathway."_ Same declaration, same
dimension — one said "I cannot know without checking", the other said "the harness took
it away". The cell now forbids the second.

**And the operational consequence for omp.** An agent that does not `wake` on omp will
conclude it has no memory, because nothing in the session contradicts that. `wake`
matters MORE on this harness, not less — the record proving continuity works is itself
in the store that `wake` opens.
