# C2 decision 0001 — round-1 blind gap-audit of the open organs

**Method.** Four clean, unprimed blind `claude` instances each enumerated the model-native set for one open
organ (mandate · telos · competence · construal). Their fresh enumerations were diffed against the current
corpus values (read via `koine catalog`). Acceptance: mint only a **genuine gap** (a distinct distinction the
corpus lacks), R=LLM-dense + MECE; the corpus was **already** blind-derived (`canonical-organ-values`), so the
mint bar is high — most candidates are reframings or different-abstraction, not gaps.

## Per-organ finding

- **mandate** (corpus 11: implement·review·diagnose·plan·research·document·test·orchestrate·operate·curate·architect).
  Blind set (Answer·Generate·Transform·Extract·Decide·Act·Monitor·Evaluate·Converse·Learn·…) is mostly a
  more-primitive reframing of the dev-leaning corpus. **MINT `converse`** — a dialogue-as-deliverable agent
  (companion/coach/tutor) is a genuinely distinct agent type the corpus wholly lacked. **Deferred** (borderline):
  `monitor` (watch-and-fire; adjacent to `operate`), `answer` (Q&A-from-known; adjacent to `research`).

- **construal** (corpus 10: systems·analytical·diagnostic·exploratory·goal-directed·risk-oriented·user-centered·decompositional·first-principles·correctness-oriented).
  **MINT `adversarial`** — the break-it / attacker's-stance lens (red-team, security, counterexample-hunting) is
  distinct from `risk-oriented` (which weighs risk; adversarial actively attacks). **Deferred**: `synthesizing`
  (fuse-parts), `optimizing` (improve-against-metric) — plausible but need a MECE pass vs `decompositional` /
  `goal-directed`.

- **telos** (corpus 9). No clear gap — the set is solid. Blind families (intent-alignment, truth-seeking,
  safety, goal-completion, identity-coherence) map onto user-satisfaction / correctness / safety / delivery /
  insight. `truth-seeking` vs `correctness` is the only borderline; deferred (likely redundant).

- **competence** (corpus 10 domain skill-areas). **No gap from this audit** — the blind agent returned cognitive
  _capabilities_ (reasoning, language-understanding, tool-use, perception…), a **different abstraction level**
  than the corpus's _domain skill-areas_. A domain-framed re-audit (creative / conversational / security /
  design domains) is the right follow-up if broader coverage is wanted.

## Minted (round 1)

- `mandate/converse` — "Sustain an interactive dialogue as the deliverable itself…"
- `construal/adversarial` — "Frames work as a system to break — takes the attacker's stance…"

Both pass verify.py + byte-identical round-trip, and `koine catalog` surfaces them to `create-agent`
automatically (drift-proof, via C3) — no skill edit needed.

## Follow-ups (next round, if wanted)

- MECE-gate the deferred candidates: `monitor` (mandate), `synthesizing` / `optimizing` (construal).
- **Domain-framed competence re-audit** (the abstraction-mismatch finding above).
- Evaluate `human-in-command` as a **charter** value (carried in from C1 — the governance/HATL axis).
