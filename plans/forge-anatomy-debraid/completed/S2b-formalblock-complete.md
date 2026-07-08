# S2b · FORMALBLOCK-COMPLETE — the sole payload must carry all operative content

**Objective.** With `body` dropped and the adapter generating SKILL.md from `formalBlock`, the `formalBlock` is
now the SOLE σ\* payload of each skill. But the old markdown bodies carried OPERATIVE content beyond the fenced
formal block (preconditions, concurrency rules, cascades). Audit all 15 migrated skill cells old-body-vs-
formalBlock; **fold operative content the formalBlock lacks INTO it**; drop decorative/redundant prose. Gate
each with the cold-oracle.

## Ground state (READ FIRST)

- Post-S2: the 15 `skills/*.ts` cells are migrated (import forge's `Skill`, `body` dropped, `formalBlock` = the
  OLD fenced block verbatim). S2 preserved formalBlocks byte-verbatim and dropped the markdown bodies — so any
  operative content that lived in the markdown PROSE (not the fenced block) is currently LOST.
- **CONFIRMED loss (calibration case): `dream`** — the old body carried (a) the `dream.lock` O_EXCL write-
  exclusion precondition on the shared `{SEMANTIC,PROCEDURAL}` partition (same-host cross-project mutual
  exclusion), and (b) the periodic `SEMANTIC ──dream──→ {SEMANTIC,PROCEDURAL,vault}` depalimpsest cascade.
  NEITHER is in the kept formalBlock. Both are operative. They must be folded into `dream`'s formalBlock.
- **S2-flagged for scrutiny:** `introspect` (old `## Procedure`/`## Boundary` steps), `handoff` /
  `create-agent` / `create-skill` (formalBlock MINTED from prose — verify faithful + complete).
- Branch `tmp-illustrate-conceptual-architecture`. Do NOT commit. Do NOT push/deploy (Operator-reserved).

## Inputs

- `packages/agent-anatomy/src/skills/*.ts` (15, post-S2) — the current formalBlocks.
- The OLD markdown bodies, recoverable per file via `git show HEAD:packages/agent-anatomy/src/skills/<name>.ts`
  (HEAD `00d19f5` predates S2; its second `body:` field is the full markdown). This is the completeness oracle.
- `packages/agent-anatomy/src/toolkit/cold-oracle/` — the `accept()`/residue gate (retyped by S4);
  `COLD_ORACLE_LIVE=1` for the live isolated blind decode of a formalBlock.
- ⊳dep S2 (migrated cells). Reads S4's retyped gate.

## Constraints (design decisions)

1. **Operative vs decorative — the fold criterion.** Fold in only OPERATIVE content: a step, law, precondition,
   concurrency rule, cascade, or gate that changes what the skill DOES. DROP decorative content: restatements,
   verbose glosses of terms the formalBlock's DECLARATIONS already define, motivating prose, `## See also`
   cross-refs (composition/composed-from covers those). When unsure, fold (completeness > brevity here).
2. **Fold INTO `formalBlock`, never restore `body`.** The enriched formalBlock stays a single self-sufficient
   set-builder block (declarations-above / laws-below, R=LLM density). Use the **`formalize`** skill
   (invoke-the-canonical) to render folded prose into σ\* form — do not hand-wave prose into the block.
3. **Relocation option:** if an operative item genuinely belongs to another cell's scope (e.g. a memory-system
   rule that is the genus `memory.md`'s, not the skill's), relocate it there instead of folding — and SAY so.
   Default is fold into the skill's own formalBlock.
4. **Gate each enriched cell** with the cold-oracle: `COLD_ORACLE_LIVE=1` blind-decode of the formalBlock must
   pass (self-sufficient · canonical). If the gate cannot run on the still-broken tree (`cell.ts:229` dies at
   S5), note it per-cell and leave the completeness-audit as the binding check; S6 runs the full `accept()`.
5. `dream` MUST end with the lock-precondition + the periodic cascade in its formalBlock (the calibration case).

## Dependencies

- S2 ⊳dep. (Runs parallel to S3 — disjoint territory: S2b = `skills/*` content, S3 = forge adapter.)

## Outputs

- 15 audited cells; the operative-loss subset enriched. A return: per cell — a dense DELTA (operative items
  folded in ↦ where; decorative items dropped; relocations with target), and the cold-oracle verdict (or
  "deferred to S6, tree broken") per enriched cell.

## Acceptance (falsifier)

- FAIL if any OPERATIVE element in a cell's old body (`git show HEAD:<file>`) is absent from BOTH the new
  formalBlock AND a named relocation target — i.e. silently lost.
- FAIL specifically if `dream`'s formalBlock lacks the `dream.lock` write-exclusion precondition OR the periodic
  SEMANTIC→PROCEDURAL cascade.
- FAIL if a `body` field was restored on any cell.
- FAIL if `COLD_ORACLE_LIVE=1` rejects an enriched formalBlock (where the gate was runnable).
- FAIL if the return is not a dense per-cell operative/decorative delta (ρ=LLM), or is human-register prose.
