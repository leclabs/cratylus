# O · organ-residue-rebuild (per-organ; provenance EXCLUDED)

**Slice** CORPUS · **Wave** 2 · **Deps** E2a ⊳dep · **State** pending · **Executor** nico

Parameterized by `<organ> ∈` the 23 organs (24 minus `provenance`, which D3 deletes — M5). Each leaf edits ONLY
`organs/<organ>/**` → file-disjoint from agents and other organs → dispatch concurrently.

## Objective

Reduce each value from the codemod's verbatim residue to **true residue**: `body=⟨α,residue⟩`,
`residue = D ∖ fired(α)` — a composable σ\* expression or ∅. Surface partitions (D7). Meaning-preserving.

## Method (the fired-check — FIVE outcomes, survey-calibrated)

For each value: (a) anchor α = export/filename; (b) decode what α **cold-fires** (isolated oracle,
`toolkit/cold-oracle/cold-oracle.sh --raw --text "<α>"`); (c) classify by comparing `fired(α)` to the definiens D:

1. **`fired(α) ⊇ D`** → **residue ∅** (bare anchor). e.g. `satisfice`, `dry`, `mece`, `react`→wait: verify.
2. **`fired(α) ⊂ D`, leftover a nuance of the SAME concept** → **residue = a short σ\* expression** (the
   disambiguator). e.g. `curate ⟨the canonical corpus⟩`.
3. **leftover a DISTINCT concept** → **PARTITION** to its own home (MECE). e.g. human-on-the-loop → +mission-command.
4. **COLLISION: `fired(α) ≠ D`** — the anchor fires the WRONG concept (survey: `react` → React.js / the verb, NOT
   ReAct). **NEVER collapse to ∅.** Re-anchor to a σ\* that fires right (`ReAct` cased, or `reason ⊕ act`), or
   add a disambiguating residue. Flag for `signify`.
5. **COINED-WEAK: `fired(α) ≈ ∅`** — a genuinely novel project concept fires nothing generic (survey:
   `cold-decode-oracle`, `correction-consolidation`). residue = **~full D, but expressed as a composable σ\*
   expression** (not prose). This is CORRECT — the model can't fire the unseen; do NOT force ∅. Optionally flag
   for `signify` if a stronger anchor exists, but a novel concept legitimately carries its full body.

The survey (6-anchor sample) shows outcomes 1–2 dominate for well-chosen anchors, but 4–5 are real and MUST be
detected by the fired-check, not assumed away — a blind "reduce to ∅" would break outcome-4 anchors.

## Worked example — `organs/autonomy/human-on-the-loop.ts`

```
BEFORE (post-codemod): humanOnTheLoop = 'acts autonomously on the operator's behalf; the operator oversees
  and sets intent, never pre-approves each act. Mission command (Auftragstaktik): … own the how — serve intent
  over literal words, decide the reversible in-domain, never defer competent judgment; escalate only a genuine
  fork (irreversible · value-dependent · beyond competence).'

fired(human-on-the-loop)  [cold-oracle, PROVEN this session: an isolated oracle emits it verbatim as the
  in/on/out-of-loop rung] = "acts autonomously, operator oversees + sets intent + can interrupt/override, no
  per-act approval"  ⇒  that entire first clause is residue-∅ (delete it).

LEFTOVER = the mission-command doctrine (serve-intent≻literal · own-the-how · ¬defer-competent-judgment ·
  escalate⇔fork). The anchor `human-on-the-loop` does NOT cold-fire this (proven — the oracle gave the
  loop-level only). It is a DISTINCT σ*  ⇒  PARTITION.

AFTER (D8 naming — English handle files it; the strong anchor `auftragstaktik` stays in the formal notation):
  organs/autonomy/human-on-the-loop.ts →  export const humanOnTheLoop: Autonomy = 'human-on-the-loop'   // residue ∅
  organs/autonomy/mission-command.ts (NEW; carry-on.ts already cites mission-command) →
      export const missionCommand: Autonomy = 'auftragstaktik ⟨escalate ⇔ fork(irreversible|value|competence)⟩'
      // English filename/export; `auftragstaktik` = the strong σ* in formal notation (it cold-fires mission-command)
  agents/nico.ts autonomy → [icAuthority, humanOnTheLoop, missionCommand]   (scope ⊕ loop ⊕ doctrine)
```

## Acceptance (falsifier)

- FAIL if any value retains a clause its anchor cold-fires (strip clause → re-decode; meaning preserved ⇒ the
  clause was residue-∅ and MUST be gone). E2a REDs on prose.
- FAIL if a fused cell (≥2 distinct concepts in one body) is not partitioned to separate homes.
- FAIL if cold-decode(before) ≠ cold-decode(after) for the organ's composed contribution (meaning drift).
- FAIL if this task edits any file outside `organs/<organ>/`.
- FAIL (organ=`actions` specifically) if collapsing `delegation.ts` drops the **agent↔agent ρ=LLM codification**
  its definiens carries (dispatch/return dense · ρ=human only for a carried deliverable) — `reader-reach.test.ts`
  must stay green (D11). The residue keeps that discipline; it doesn't discard it.

## Return

Per-value `⟨α, residue⟩` table · partitions surfaced (new homes) · E2a pass · cold-decode before/after on the 2
least-obvious values.
