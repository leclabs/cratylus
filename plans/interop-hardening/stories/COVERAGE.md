# COVERAGE — stories × capabilities (CE over the floor)

Library: 10 epics · 74 stories, shards `E1-…` – `E10-…` in this dir. ρ=LLM.
Floor capabilities (task contract, Operator-pinned): **F1** import any harness → IR · **F2**
output IR to `.{namespace}/` across scopes · **F3** reimport (harness or own format) · **F4**
accurate re-export / round-trip, losses loud · **F5** plugin-arch adapters (agents+skills floor;
hooks nice-to-have; tools/MCP FUTURE) · **F6** exemplify optimization to R=LLM artifacts.
Research categories: **R-std** (standards output/reach) · **R-div** (fabricated-shape fixes) ·
**R-ir** (IR expressiveness) · **R-roster** (adapter gaps/renames).

## Actor legend

OWNER — human owning existing harness config(s) · AUTHOR — hand-authors IR · FLEET — operates N
harnesses from one IR · DEV — adapter/engine developer + CI · CURATOR — corpus curator driving
the exemplify pipeline · OPERATOR — the polis Operator (ELICIT oracle, roster decisions).

## Floor matrix (capability → stories; CE check: no floor row empty)

| Floor | Stories                                           |
| ----- | ------------------------------------------------- |
| F1    | E1.S1 E1.S2 E1.S3 E1.S4 E1.S5 E1.S6 E1.S7 · E7.S9 |
| F2    | E2.S1 E2.S2 E2.S3 E2.S4 E2.S5 E2.S6 E2.S7         |
| F3    | E3.S1 E3.S2 E3.S3 E3.S4 E3.S5 E3.S6               |
| F4    | E4.S1 E4.S2 E4.S3 E4.S4 E4.S5 E4.S6 E4.S7 · E9.S4 |
| F5    | E5.S1 E5.S2 E5.S3 E5.S4 E5.S5 E5.S6(FUTURE) E5.S7 |
| F6    | E6.S1 E6.S2 E6.S3 E6.S4 E6.S5 E6.S6 E6.S7         |

## Story matrix (story → capabilities; primary bold; CE check: no story capability-less)

| Story | Caps         | Story | Caps           | Story  | Caps               |
| ----- | ------------ | ----- | -------------- | ------ | ------------------ |
| E1.S1 | **F1**       | E4.S6 | **F4**         | E7.S10 | **R-std** R-roster |
| E1.S2 | **F1** F4    | E4.S7 | **F4** R-std   | E8.S1  | **R-div** F2 F4    |
| E1.S3 | **F1** R-div | E5.S1 | **F5**         | E8.S2  | **R-div** F2 F4    |
| E1.S4 | **F1** F4    | E5.S2 | **F5**         | E8.S3  | **R-div** F2 F4    |
| E1.S5 | **F1**       | E5.S3 | **F5** R-std   | E8.S4  | **R-div** F2 F4    |
| E1.S6 | **F1** F2    | E5.S4 | **F5**         | E8.S5  | **R-div** F2 F4    |
| E1.S7 | **F1** R-div | E5.S5 | **F5** R-div   | E8.S6  | **R-div** F2 F4    |
| E2.S1 | **F2**       | E5.S6 | **F5** FUTURE  | E8.S7  | **R-div** F2 F4    |
| E2.S2 | **F2** F3    | E5.S7 | **F5** F4      | E8.S8  | **R-div** F2 F4    |
| E2.S3 | **F2**       | E6.S1 | **F6**         | E8.S9  | **R-div** F2 F4    |
| E2.S4 | **F2**       | E6.S2 | **F6**         | E8.S10 | **R-div** F2       |
| E2.S5 | **F2**       | E6.S3 | **F6**         | E9.S1  | **R-ir** F4        |
| E2.S6 | **F2**       | E6.S4 | **F6**         | E9.S2  | **R-ir** R-std     |
| E2.S7 | **F2**       | E6.S5 | **F6**         | E9.S3  | **R-ir** F4        |
| E3.S1 | **F3**       | E6.S6 | **F6**         | E9.S4  | **R-ir** F4 F3     |
| E3.S2 | **F3** F4    | E6.S7 | **F6** F4      | E9.S5  | **R-ir** FUTURE    |
| E3.S3 | **F3**       | E7.S1 | **R-std** F2   | E9.S6  | **R-ir** F4        |
| E3.S4 | **F3**       | E7.S2 | **R-std**      | E10.S1 | **R-roster** F1 F2 |
| E3.S5 | **F3** F4    | E7.S3 | **R-std** F2   | E10.S2 | **R-roster** F1 F2 |
| E3.S6 | **F3**       | E7.S4 | **R-std**      | E10.S3 | **R-roster** F1 F2 |
| E4.S1 | **F4**       | E7.S5 | **R-std** F2   | E10.S4 | **R-roster** F1 F2 |
| E4.S2 | **F4**       | E7.S6 | **R-std** F4   | E10.S5 | **R-roster**       |
| E4.S3 | **F4** R-div | E7.S7 | **R-std** R-ir | E10.S6 | **R-roster** R-std |
| E4.S4 | **F4** R-div | E7.S8 | **R-std**      | E10.S7 | **R-roster**       |
| E4.S5 | **F4** R-div | E7.S9 | **R-std** F1   |        |                    |

FUTURE-status stories (excluded from the coverage-test wave, on the record): E5.S6 (tools +
MCP-delivery via plugins) · E9.S5 (Lsp, permission DSLs, plugins-as-deliverable,
context-file-name knob, skill file-tree semantics).

## Research stories — count + ledger refs

36 research-compelled stories (E7×10, E8×10, E9×6, E10×7, plus in-floor E1.S3, E1.S7, E4.S3).
Ledger refs cited (resolve in the two RETURNs):

- E7 ← standards RETURN §3 R1–R6 + §1 cautions: [S1][S2][S3][S6][S7][S9][S11][S19][S22][S44]
  [S45][S46][S47][S49][S57][S59][S60][S62]; matrix rows §2.
- E8 ← harness RETURN §3 per-adapter divergences: claude [CC1][CC6][CC7][CC8] · codex [CX1][CX2]
  [CX3][CX4][CX6][CX7] · gemini [GM1][GM4][GM5] · copilot [CP1][CP2][CP4][CP5][CP8] · cursor
  [CU1][CU2][CU3][CU5][CU6] · opencode [OC1][OC2][OC4][OC5][OC7][OC8] · cline [CL1][CL2][CL3]
  [CL4][CL5][CL6] · crush [CR1][CR2][CR3] · continue [CT1][CT2][CT3][CT4] · aider [AI1][AI2].
- E9 ← harness RETURN §3 cross-cutting: [OC7][KL5][GM1][CX7][CL6][CU5][CU9][OC8][KL1][AM2][ZD5]
  [CR1][S3][CC2][CC3][CU4][CP1][GM2][KL1]; E9.S2 dialect table [S19][WS1][CL1][CP3][CT2][CC1].
- E10 ← harness RETURN §0 consolidation + §3 roster: [AM1][AM2][AM3][AM4][AM9] · [ZD1][ZD2][ZD3]
  [ZD4][ZD5][ZD6][ZD8] · [WS1][WS2][WS3][WS4][WS5][WS7] · [KL1][KL2][KL3][KL5][KL6][KL7] ·
  [GM7][RO5] · [FS1]–[FS9][S54].
- In-floor: E1.S3 [OC7][CL2][CP8][CP2][CL1][CR1][CU1] · E1.S7 [CX3][CC1][OC3][CL1][CR2] ·
  E4.S3 (stale-`none` set) [OC2][OC4][CL4][CL5][CU3][CU6][CP1][CP5][CR3][CT3].

## Accept self-check (task falsifiers)

- CE over floor: every F1–F6 row non-empty ✓ (table above); every story carries ≥1 capability ✓.
- Observable acceptance: every story's `✓:` bullets name fixture/command/path/exact check — a
  blind test author derives pass/fail without asking; stories that defer a semantic fork do so
  via a named ELICIT, not interpretation.
- No invented answers: every intent-level unknown is an `ELICIT:` line below.

## ELICIT — intent-level unknowns for the Operator (verbatim, collected tail)

ELICIT: F2 names "a conventional `.{namespace}/` folder" with `.claude/`/`.agents/`/`.cursor/`-class examples — is the IR's own home to remain `.agent-forge/`, or move/alias to the vendor-neutral `.agents/` the standards research crowns? E2 stories assume `.agent-forge/` stands; an `.agents/` alias would touch E2.S1/S2/S7 and E7.S3's tree layout.

ELICIT: "local" scope on harnesses with no documented local tier (most non-Claude targets) — skip loudly (E2.S5 as written) or emulate via a gitignored file convention per harness? Value-dependent: emulation invents a convention foreign users may trip over.

ELICIT: F5's example plugin-arch harness "Pi" appears in neither research RETURN (nearest known referent: badlogic's `pi` minimal agent). Is Pi a required adapter target (⇒ needs its own research + E10-class story) or illustrative only? E5 is written harness-generic with verified plugin archs (Amp/opencode/Kilo/Cline/Claude/Gemini/Zed) as instances.

ELICIT: F6 says optimized output goes "to any harness that supports it" — skills/agents-bearing harnesses only, or should rule-only harnesses also receive exemplify-optimized (R=LLM set-builder) AGENTS.md bodies? E6.S6 currently covers resource-bearing targets only.

ELICIT: roster consolidation calls — (a) aider: implement the read:-wiring fix (E8.S10) or retire the target; (b) gemini: rename/alias the adapter id to antigravity or keep gemini as canonical id; (c) windsurf: ship as devin id from the start? E8.S10 and E10.S5 are written for the fix/alias branch.

ELICIT: two Agent shapes exist (anatomy 24-organ vector vs config-IR Agent). For F6, is the anatomy vector the required optimized form for ALL imported agents fleet-wide, or only for polis-born agents while foreign agents optimize into the config-IR shape with organ-vector opt-in? E6.S3/S6 assume the vector is the optimized form and project it into config-IR for compile.
