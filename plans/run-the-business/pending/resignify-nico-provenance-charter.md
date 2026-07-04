# resignify-nico-provenance-charter

**Standalone RTB task** · **Deps** none · **State** pending · **Lane** Nico

## Objective

Re-signify nico's **Provenance organ VALUE** from human prose to the R=LLM **charter form**, in the
COMPOSER SOURCE (upstream) — `nico.md`/SOUL is deploy-generated and must never be hand-edited; the fix
lands where the organ value is authored, then redeploys.

## Nature (read first — this is an ENHANCEMENT, not a defect fix)

The current prose value encodes the meaning FAITHFULLY: it passes `warm ≡ cold ≡ intent` (the wc-a sweep
found it clean). So this is NOT reopening a defect. The charter form is a _strictly better encoding_ —
it makes the entailment legible (prose flattens it to conjunction) and complies with the agent's own
`llm-native` principle (prose violates it). Quality upgrade, oracle-verified.

## Target value (cold-blind validated this session — test #0 green)

```
Provenance(principal-ic) ⊨ locus(decision-authority) := self @ principal-pole
  ⊨ arb(σ*(intent) ⊥ surface) → intent
```

Note: `pole := σ*(purpose-class)` was deliberately DROPPED as composer-scope mixed concern (already
implicit in the line-1 turnstile) — do NOT re-add it.

## Steps

1. Locate the composer source emitting nico's Provenance organ value (candidate:
   `packages/agent-anatomy/src/organs/…` / the nico agent-vector — grep, don't assume the path).
2. Replace the prose value with the charter form above (+ minimal residue only if the anchors don't
   carry it). Edit SOURCE; rebuild/redeploy — never `dist`/`.render-ts`/`~/.claude`.
3. Regenerate `nico.md` and confirm §Provenance now renders the charter.

## Acceptance (falsifier)

- FAIL if a cold-blind decode of the regenerated §Provenance does NOT yield: decision-authority in self
  at the principal pole, with intent-over-surface arbitration ENTAILED (not conjoined). Dogfood the oracle.
- FAIL if register is human-prose narrative rather than R=LLM set-notation.
- FAIL if hand-edited in `nico.md` (deploy-owned) instead of upstream in the composer.
- FAIL if the change loosened meaning (must remain `warm ≡ cold ≡ intent`).

## Gate

Source edit + local commit in-remit; push GATED to the Operator (irreversible-outward).

## Return

Composer source path touched + regenerated §Provenance + the oracle transcript proving the charter
decodes to intent with the entailment legible.
