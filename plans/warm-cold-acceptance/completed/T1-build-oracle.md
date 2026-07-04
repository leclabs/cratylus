# T1 · build-oracle

**Wave** 0 · **Deps** none · **State** ready

## Objective

Build the **cold-blind oracle harness**: a reproducible, mechanical procedure that computes
`R_cold(f)` — the decode of any fragment by a naive, ISOLATED LLM with zero project context —
and packages it as a project skill/tool so every acceptance gate is decidable, not a matter of
opinion. Institutionalizes _reproduce-not-assert_: no party's authority substitutes for a cold read.

## Method (the isolation is load-bearing)

- Spawn a fresh model process with NO agent-factory context in scope: `claude -p` invoked from a
  scratch working dir OUTSIDE `~/workspaces/polis` (so the project's MEMORY.md / AGENTS.md / CLAUDE.md
  do NOT load). Minimal prose prompt: `explain:\n\n<fragment>`.
- A spawned SUBAGENT is NOT cold — it inherits project context + local agent-registry name-aliases.
  The harness MUST use process-level isolation (separate cwd outside the repo), never an in-session
  subagent. This distinction is the crux; encode it in the tool + its doc.
- Emit the decode verbatim as `R_cold(f)`. Optionally also capture `decode_warm(f | K)` (an in-repo
  read) so the two can be diffed by the gate.

## Steps

1. Author the harness as a project skill/tool (canonical skill register if a skill; else a scripted
   tool). Inputs: a fragment (text or path). Output: `{ R_cold, warm?, cwd_used, context_loaded:∅ }`.
2. Prove isolation: the harness must demonstrably load zero project context (context_loaded = ∅).
3. Document the subagent-is-warm caveat inline so no future caller substitutes a subagent for it.

## Acceptance (falsifier)

- FAIL if the harness loads ANY project context (run it on a fragment containing a project-coined
  token; if the decode reflects the project's private meaning rather than the naive latent-prior
  meaning, isolation leaked → FAIL). Positive control: on a known ecosystem token (e.g. an agent
  name that aliases a local registry entry), a correct cold harness returns the GENERIC prior, not
  the registry gloss.
- FAIL if it is non-reproducible (two runs on the same fragment yield materially different decodes
  beyond sampling noise) or requires a human to interpret rather than emitting `R_cold` directly.
- FAIL if implemented as an in-session subagent (warm) rather than an isolated process.

## Return

The harness path + invocation contract + a transcript on two fragments (one plain, one carrying an
ecosystem-coined token) showing generic-prior decode and `context_loaded = ∅`.

---

## Outcome — PASS (2026-07-03)

**Harness:** `plans/warm-cold-acceptance/bin/cold-oracle.sh`
**Invocation contract:** `cold-oracle.sh {--file <path>|--text '<f>'|<stdin>} [--model sonnet] [--raw]`
→ emits `R_cold` + metadata `{cwd_used (outside repo), context_loaded:∅}`.
**Isolation recipe (the crux):**

1. cwd = fresh `/tmp` scratch OUTSIDE the repo → repo AGENTS/CLAUDE/MEMORY never load.
2. `CLAUDE_CONFIG_DIR` = fresh dir seeded with ONLY `.credentials.json`, pulled FRESH from the
   macOS Keychain per run (`security find-generic-password -s "Claude Code-credentials" -w`) —
   the on-disk snapshot is expired; keychain is the live store. No agents/skills/CLAUDE.md.
3. `--disallowedTools Read Grep Glob Bash …` → TOOL-LESS, else the reader greps the repo and
   becomes warm-by-investigation (observed: default `claude -p` cited an exact repo path from /tmp).
4. prompt `explain:\n\n<f>` via STDIN (the variadic `--disallowedTools` would eat a positional arg).
   **Transcript (falsifiers pass):**

- `principal-ic` → "Principal Individual Contributor" (generic prior; NOT the "Ruler archetype" registry gloss).
- `signify` (bare token; a deployed skill) → OpenBSD signing tool (generic prior; NOT the corpus anchor gloss).
- plain `one canonical home per idea…` → SSOT/DRY. All decodes context_loaded=∅, no repo paths.
  **Caveat (encoded in-script):** a spawned subagent is NOT cold; only this process-level isolation is.

### Harness refinement (from T3, 2026-07-03)

The `explain:\n\n<f>` prompt was replaced with a MOOD-NEUTRAL framing ("The text below is a fragment
from a knowledge corpus… Restate what it means in plain language"). Reason: imperative-mood fragments
(a skill delineation starting "use this skill to…") made the naive reader treat the prompt as a
skill-INVOCATION request and hunt its skill list — a false divergence. The neutral prompt decodes the
fragment's MEANING regardless of grammatical mood, without leading the answer. All prior gates (T0 law,
Ts provenance) re-verified PASS under the new prompt. Companion sweep tool: `bin/sweep.mjs` (escape-aware
definiens/delineation extractor + oracle runner).
