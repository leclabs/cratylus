# T5-infra — standing oracle gate (hand-off → Mav ✈️)

_ρ=LLM · blind-dispatchable · Nico owns the gate SEMANTICS (below); Mav owns the INFRA wiring
(hook/CI/auth/portability). Split per Lex's T5 decision + the founders' culture|substrate boundary._

## Objective

Convert the warm≡cold law ([[cold-decode-oracle]], `organs/engineering-principles/cold-decode-oracle.ts`)
into a STANDING, BLOCKING, pre-land gate: every changed context fragment must pass the isolated oracle
before it lands. The corpus-side author-time gate is DONE (exemplify accept executes the oracle); this
task is the enforced BOUNDARY gate that does not depend on an author remembering to run the skill.

## Gate semantics (Nico — fixed)

For each changed fragment `f` (organ definiens · skill delineation/formalBlock · agent vector body):

- **m1** `R_cold(f) ≅_R intent(f)` — cold-blind decode recovers intent (self-sufficient).
- **m2** `decode_warm(f | K) ≅_R R_cold(f)` — no competing home pulls the warm read off-truth.
- divergence ⇒ REJECT, naming the mode (m1 fix-f · m2 delete-n); correction is one-way project→cold-truth.
- authority = the T0 law fragment; the gate is its teeth.

## Instrument (exists; needs Mav-hardening)

`plans/warm-cold-acceptance/bin/cold-oracle.sh` + `bin/sweep.mjs` (escape-aware definiens/delineation
extractor). PROVEN isolation recipe:

1. cwd = scratch OUTSIDE repo; 2. `CLAUDE_CONFIG_DIR` = dir seeded ONLY with `.credentials.json`;
2. `--disallowedTools …` TOOL-LESS (else it greps the repo = warm-by-investigation); 4. MOOD-NEUTRAL prompt
   ("Restate what it means…", NOT "explain: …" — imperative fragments misread as skill-invocations); 5. prompt via stdin.

## Infra to build (Mav)

1. **Durable home** for the harness (out of `plans/`) — a project tool/skill (candidate: `toolkit/` or a
   `cold-oracle` skill). Nico owns naming/placement in the corpus; Mav owns the code.
2. **Portability + headless auth**: `cold-oracle.sh` pulls creds from the macOS Keychain — CI/Linux has no
   keychain. Provide an auth path (API key via env / `--settings` apiKeyHelper) so the isolated `claude -p`
   authenticates headless. This is the load-bearing infra problem.
3. **Wire the blocking gate** at the source-admission boundary: pre-commit hook (local) and/or a required CI
   check. Compute changed fragments (git diff → `.ts` → extract definiens/delineation via `sweep.mjs`),
   oracle each, block on divergence. Turbo content-cache to keep it fast (only changed fragments).
4. The gate must invoke the ISOLATED PROCESS, never an in-session subagent (a subagent is warm).

## Acceptance (T5 falsifiers — must hold)

- REJECTS a planted m1 fragment (non-self-sufficient: a bare coined slug, no inline ≜) AND a planted m2
  fragment (contradicted by an ambient second home). ADMITS a clean self-sufficient one. Transcript required.
- BLOCKING, not advisory (warn-and-admit = FAIL).
- Invokes the isolated oracle, not a re-implemented warm check (= FAIL).

## Meta-lesson to encode in the gate's doc (from T3)

The oracle is itself UNTRUSTED-until-verified: a confounded prompt manufactures FALSE divergences (cost us
4 phantom skill "defects" before the confound was caught). The gate's own harness must be calibrated
(positive control: an ecosystem token decodes to its GENERIC prior, not the registry gloss) before it judges.
