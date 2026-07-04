# T5 · wire-standing-gate

**Wave** 3 · **Deps** T4 ⊳dep (ratified) · **State** pending

## Objective

Make the warm≡cold criterion a STANDING pre-operation gate, not a one-time cleanup: any future edit to
agent-factory's source (a new/changed context fragment) must pass the oracle before it lands. This is
what converts the law (T0) from a written principle into an enforced invariant.

## Steps

1. Wire the gate at the point where source changes are admitted (pre-commit hook / CI check / a
   required step in the authoring skills — invoke T1's oracle harness on each changed fragment).
2. Gate condition: a changed fragment f admits iff `R_cold(f) ≡ intent` (m1) AND
   `decode_warm(f | K) ≡ R_cold(f)` (m2). Divergence ⇒ reject with the failing mode named.
3. Reference the law (T0) as the gate's authority; the gate is the law's teeth.

## Acceptance (falsifier)

- FAIL if a deliberately-noised fragment (a planted m1 non-self-sufficient fragment, and a planted m2
  fragment contradicted by an ambient home) is ADMITTED by the gate — the gate must REJECT both.
- FAIL if the gate is advisory-only (warns but admits) rather than blocking.
- FAIL if the gate re-implements a warm check (in-session) instead of invoking the isolated oracle.

## Return

The gate's wiring (hook/CI/skill path) + the invocation contract + a transcript showing it REJECTS both
planted-noise fragments and ADMITS a clean self-sufficient one.

---

## Outcome — corpus-side DONE + infra DELEGATED (2026-07-03, per Lex's T5 decision)

**Corpus-side (Nico, done):** exemplify's accept gate now EXECUTES the isolated oracle, not just cites it.
Added declared `coldpass(k) ⇔ R_cold(body(k)) ≅_R gloss(k) ∧ decode_warm(body(k)|K) ≅_R R_cold(body(k))`
to `valid(k)`; body rewritten from cite→execute ("accept executes the isolated cold oracle… refuses on
divergence; a PROCESS, never a subagent"). Used the DECLARED `≅_R` (reader-isomorphic) not a minted `≡`
(SYMBOLS gate + one-glyph-one-sense; `≡` would duplicate `≅_R`'s sense). Gates GREEN: typecheck·build·test
(incl. SYMBOLS)·lint·projection-stability. Author-time blocking; live in SOURCE only until next anatomy:deploy.
**Infra (Mav):** the enforced pre-commit/CI boundary gate → `completed/T5-infra-handoff-mav.md` (durable
harness home + headless CI auth + blocking hook). Split per the culture|substrate founders' boundary.
