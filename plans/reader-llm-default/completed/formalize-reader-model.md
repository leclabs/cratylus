# formalize-reader-model

**Depends on** `root-cause`. Lift the reader model into the existing σ\*\_R formalism (R = the reader
parameter). Deliverable: a **formal** rule (set-builder, R=LLM), not a prose doc — extends `signify`.

## Inputs (read these — blind-dispatchable; paths from `packages/agent-anatomy/`)

- σ\*\_R spine to extend: `src/skills/signify.ts` (source) → projected `~/.claude/skills/signify/SKILL.md`.
- Symbol gate: `references/formal-symbolic-notation.md`.
- Adjacent principle organ: `src/organs/engineering-principles/llm-native.ts`.
- The `render: verbatim` sites to resolve: `ideas/memory.md`, `ideas/persona.md`.
- ⊳ `root-cause` — the confirmed dominant cause(s) + fix-class each implies (dep output; read its completed
  task-file).

## Scope

- **R per artifact class** — the mapping. Default **R=LLM**; **R=human iff the literal reader is human**:
  - R=LLM: source cells · projected SOULs / SKILL.md / hook-prompts · `AGENTS.md` / `CLAUDE.md` /
    `ideas/AGENTS.md` · praxis `PLAN.md` + task files · agent memory (SELF/MEMORY/EPISODIC) ·
    consumer-side skill-generated agent-artifacts · agent↔agent messages.
  - R=human: `README` + human docs · human-facing code comments · commit messages · human chat ·
    human-facing generated outputs (Slack/email/report). `docs/` is mixed (per-note R).
- **Signifier-carries-load reduction** — R=LLM body = σ\* + residue-the-priors-miss. A re-explaining
  definiens = ME violation. State the reduction rule and when a definiens **collapses to the slug**.
- **Resolve the `verbatim` category error** — content tagged `verbatim` MUST be R=LLM (`verbatim` = "settled
  σ\*, don't re-derive"); else the tag **retires** (a deterministic projector needs no density exemption).
- **σ\*** — blind-gate the initiative's own anchor (`reader-llm-default` is a working name).

## Acceptance

- Reader model is a formal artifact extending σ\*\_R, not prose; every artifact class has a declared R.
- **Blind test (falsifier):** a fresh reader, given the model + any artifact in the repo, resolves its R
  deterministically — an artifact the model leaves ambiguous fails the task.
- The `verbatim` rule is resolved (kept-with-R=LLM-constraint, or retired) with rationale.
- The initiative σ\* is blind-gated (cold subagent read, expr only — the standing σ\* protocol).

## Deliverable (accepted 2026-07-01; gates green)

- **Home = the `signify` cell** (`packages/agent-anatomy/src/skills/signify.ts`, formalBlock + body fence
  in sync; projects to `skills/signify/SKILL.md`). Rationale: the reader model is the **binding of the `R`
  parameter signify declares but leaves free** — a separate cell would re-declare `R · σ*_R · fired_R · D_R`
  to stay self-sufficient (DRY violation). One symbol table, one home, zero new projection surface.
- **The model (READER BINDING section):** `ρ : Art → {LLM, human}`; `ρ(a) ≜ human ⇔ readers(a) = {human}`,
  else **LLM** (ambiguity resolves to LLM ⇒ total ⇒ deterministic — the blind-test falsifier holds by
  construction); `readers(a)` excludes a human reading through an agent teacher; grain = finest
  separately-consumed artifact (mixed corpus ⇒ ρ per note); both class lists from scope declared as `⊆`
  constraints on `{ a | ρ(a) = LLM }` / `{ a | ρ(a) = human }`.
- **Reduction rule:** `residue(c) ≜ { d ∈ D_R(c) | d ∉ fired_R(α(c)) }`; an R=LLM body carries each concept
  as `⟨α(c), residue(c)⟩`; `residue = ∅ ⇒ collapse to the slug`; re-stating `fired_R(α(c))` = ME violation.
- **Gate predicate minted for task 4:** `conform(a) ⇔ register(a) = ρ(a)` — enforced on bodies, not names only.
- **`verbatim` resolution = KEPT-CONSTRAINED** (per ⊳root-cause fix-class, ground-truth-verified):
  `verbatim(a) ⇒ ρ(a) = LLM` (formal law) + the density-immunity READING retired at its home
  (`ideas/AGENTS.md` projection-directives bullet — "ship whole and density-immune" → ship-whole byte-exact,
  settled σ\*, **never a density exemption**). Ship-whole composition untouched.
- **σ\* blind-gated:** cold subagent (expr only, no candidates, no tools) returned `reader-llm-default`
  exactly — the working name IS the σ\*; anchor settled, no rename.
- **Residue (downstream, not this task):** `ideas/{memory,persona}.md` protocol bodies now formally
  non-conforming (`verbatim ∧ register=human`) — re-author at R=LLM in `remediation-fanout`;
  `llm-native`/`natural-language` organ contradiction = the anatomy fix-class task; delegation-register
  discipline = `extend-reach`.
