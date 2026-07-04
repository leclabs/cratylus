# standing-oracle-gate — the warm≡cold law as an enforced pre-land boundary gate

**Lane** Mav (infra: hook/CI/auth/portability) + Nico (gate semantics — fixed below) · **Status** pending ·
**Deps** none (instrument exists) · **Kind** infra, spec-first.

## Objective

Convert the warm≡cold law ([[cold-decode-oracle]], `organs/engineering-principles/cold-decode-oracle.ts`)
into a **standing, blocking, pre-land gate**: every changed context fragment must pass the isolated cold
oracle before it lands — enforced at the source-admission boundary, **not** dependent on an author
remembering to invoke a skill.

## Verified state (2026-07-04)

- **Corpus-side author-time gate: DONE.** [[exemplify]]'s accept `valid(k)` includes `coldpass` and
  **executes** the isolated oracle on the realized body (refuses on divergence; a PROCESS, never a subagent).
- **Instrument: EXISTS**, relocated out of the retired plan to
  `packages/agent-anatomy/src/toolkit/cold-oracle/` (`cold-oracle.sh` + `sweep.mjs`), sibling to
  `toolkit/guardrail/`.
- **Boundary gate: OPEN** — this task. It is the enforced boundary the author-time gate does not cover.

## Gate semantics (Nico — fixed, not a hypothesis)

For each changed fragment `f` (organ definiens · skill delineation/formalBlock · agent-vector body):

- **m1** `R_cold(f) ≅_R intent(f)` — cold-blind decode recovers intent (self-sufficient).
- **m2** `decode_warm(f | K) ≅_R R_cold(f)` — no competing home pulls the warm read off-truth.
- divergence ⇒ **REJECT**, naming the mode (m1 → fix-f · m2 → delete-competing-home); correction is one-way
  project → cold-truth, never bend f → K.
- authority = the law fragment; the gate is its teeth.

## Prior findings — HYPOTHESES to verify cold, NOT authority

_(Carried from the retired `warm-cold-acceptance` T5 handoff; trust nothing on assertion — re-verify.)_

- **Headless auth is the load-bearing infra problem.** `cold-oracle.sh` pulls creds from the macOS
  Keychain; CI/Linux has none. Hypothesis: provide an API-key path (env / `--settings` apiKeyHelper) so the
  isolated `claude -p` authenticates headless.
- **Wiring**: pre-commit hook (local) and/or a required CI check. Compute changed fragments
  (git diff → `.ts` → extract definiens/delineation via `sweep.mjs`), oracle each, block on divergence.
  Turbo content-cache to keep it fast (only changed fragments).
- **Isolation is load-bearing**: the gate must invoke the ISOLATED PROCESS (scratch cwd outside repo,
  creds-only config, tool-less, mood-neutral prompt via stdin), never an in-session subagent (a subagent
  inherits project-K = warm).
- **Calibrate before trusting** (meta-lesson): the oracle is itself untrusted-until-verified — a confounded
  prompt manufactures FALSE divergences (cost 4 phantom skill "defects" once). The harness must pass a
  positive control (an ecosystem token decodes to its GENERIC prior, not the local registry gloss) before it
  may judge.

## Accept (falsifiers)

- REJECTS a planted m1 fragment (non-self-sufficient: bare coined slug, no inline `≜`) AND a planted m2
  fragment (contradicted by an ambient second home); ADMITS a clean self-sufficient one. Transcript required.
- BLOCKING, not advisory (warn-and-admit = FAIL).
- Invokes the isolated oracle, not a re-implemented warm check (= FAIL).
- Deployed-artifact mode proves the shipped gate bites (not only a source-tree run).

## Return

Gate wiring (hook/CI path) + invocation contract + a transcript rejecting both planted-noise fragments and
admitting a clean one; the headless-auth path documented.
