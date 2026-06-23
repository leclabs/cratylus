# 0002 — R3 routing-manifest producer + organ-scoped home resolution

status: LANDED (nico-principal, 2026-06-22 entry-frontier session). R=LLM.

## problem

The entry-frontier tasks (`exemplify-agents`, `exemplify-skills`) name `.manifests/<source>.json` as their
artifact, but the R3 manifest **producer did not exist** — toolkit AGENTS.md: _"The producer (resolve/
exemplify emit) and the digest values are **Nico's follow-on** — the toolkit only reads digests."_ With no
producer, 14 delegated agents each hand-rolled a different JSON shape (some `{c,kind,alpha,op}`, some the
firm `{fragment_digest,home_slug,…}`, some missing `fragment_digest`) → 29 `verify.py` R3 failures.

Worse, the firm `home_slug` is a **bare global anchor**, but the re-individuation made agent organ refs
**organ-scoped** `(organ, value)` pairs (a value token recurs across organs — `emit-fenced-review` ∈ both
`effectors/` and `enaction/`, so the bare slug is ambiguous). The schema + verify's global `_home_index`
could neither express nor validate an agent route; agent refs fell to `delta[]` and **vacuously passed** R3.

## decision

Build the producer; do NOT re-dispatch agents to hand-roll again (the laxer, root-leaving path).

1. **`toolkit/emit_manifest.py`** — the producer. Division of labour: the exemplify AGENT is the
   _certifier_ (runs produce→name→accept, proves meaning(D) ≡ the composite, fixes drops IN the cell);
   this recorder runs DOWNSTREAM and emits the manifest from the certified cell's authored factorization.
   - AGENT cells: routes are organ-scoped — `home_slug = <organ>/<value>`, parsed via
     `compose.agent.parse_selection` (cite-don't-copy at the code grain).
   - SKILL cells: routes are the authored fence-immune `[[ ]]` prose refs.
   - homed ref → `route` (reuse); unhomed → `delta` (homed-nowhere-by-design). `fragment_digest` via
     `core.digest.fragment_digest` over the homed cell body.
2. **verify.py R3 consumer** — a `home_slug` containing `/` resolves by the `(organ, value)` pair
   (`value_cell_path`), mirroring `gate_agent_organ_refs`; a bare slug still uses `_home_index`.
   Gated by a new `test_reconstruct.py` organ-scoped fixture (live pair PASS / dead pair FAIL).

result: verify PASS **R1+R2+R3 mechanical** (no longer the audit-line NOTE), 17/17 toolkit tests + the
new case, 24 manifests emitted (11 agents + 13 skills).

## boundary note

`emit_manifest.py` + the verify.py R3 edit touch toolkit machinery (nominally Mav's "tooling" lane), but
the R3 producer is explicitly Nico's per toolkit AGENTS.md, and organ-scoped resolution is tied to the
organ-anatomy corpus structure (Nico's). Flagged for Mav's awareness; reversible (test-gated).

## open — 2 soft notes for an Operator/principal call (not blockers)

- **corpus-wide primitive citation policy:** `arch-doc-writer`'s legacy cited `[[context-not-prose]]`
  directly; the landed composite folds it into agent-fitted organ cells. Equivalent by round-trip, but: do
  corpus-wide primitives stay cited by their canonical anchor in composites, or fold? (recorded, judged
  equivalent.)
- **`CVE` token soft-drop:** `principal-engineer-reviewer`'s legacy listed CVE/CWE example tags; landed
  grounds findings in CWE/OWASP/CAPEC and omits the literal `CVE` token. The requirement is homed; only
  the example token is absent. Low severity; left as-is pending a call.
