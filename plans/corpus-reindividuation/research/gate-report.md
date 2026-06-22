# zero-dangling-gate — report (infra half)

R=LLM. author: Mav (infra). lead: Nico (corpus). status: **GREEN** as of branch
`mav/sharded-memory-store`.

## obj

∀ ref ∈ `packages/mind/**` resolves to exactly one canonical home; residual prose stripped;
round-trip ⊨ equivalent-or-better. The authoritative oracle is **`verify.py`** (R1 one-home
totality · R2 cite-don't-copy · R3 routing-manifest), NOT a naive global-slug grep — the new
agent form resolves organ values by the **`(organ, value)` pair** (`<organ>/<value>.md`), so a
flat `[[a]] → {kind}/{a}.md` grep mis-reports organ-scoped refs as dangling. Resolution semantics
live in `cells._composite_index` + `compose.agent.value_cell_path` and are gated by
`verify.gate_agent_organ_refs`.

## evidence (one run reproduces)

```
cd packages/mind && python3 toolkit/verify.py
→ PASS schema + references + fences + symbols + verbatim-ref-free + operative
       + round-trip + reconstruct (R1+R2+R3)
```

- **organ-value refs:** 337 total, **0 dangling** (every agent selection-vector `organ value`
  resolves to `packages/mind/<organ>/<value>.md`; gated by `gate_agent_organ_refs`).
- **skill `[[lexicon]]` refs:** all resolve; the 4 corpus blockers found mid-pass
  (`skill/praxis.md` dangling `[[plan-commit-from-git]]`; `[[memory]]`/`[[dream]]`/`[[handoff]]`
  fenced in `skill/dream.md`,`skill/wake.md`) were fixed corpus-side by Nico and now PASS.
- **round-trip / R1+R2+R3:** PASS. `gate_reconstruct` walks the corpus dependency graph with
  agent organ-selection lines correctly excluded from the GLOBAL-anchor walk (gated per-pair
  instead).

## toolkit changes that close the gate (Mav)

- `core/cells.py` — composite loader sources singular `agent/`+`skill/`; retired plural+nested.
- `compose/agent.py` — new selection-vector composer inlines each organ value cell whole under a
  `## <Organ>` heading; accepts bare and `[[wikilink]]` value surfaces.
- `compose/skill.py` — Bindings matcher generalized to accept `Bindings (cite-once):` (else 5
  skills composed empty provenance).
- `verify.py` — SCHEMA exempts `kind:agent` (description is composed); `gate_agent_organ_refs`
  validates organ values by pair; REFERENCES + R1 skip organ-selection lines.
- `render/claude_code.py` — provenance header names the true source (`agent/<n>.md`).
- `GLOSSARY.md` regenerated (168 exemplars, freshness PASS).

## gates (all green)

`pnpm build` · `pnpm test` (126) · `pnpm lint` (128 files) · `python3 -m pytest -q` (3) ·
all 17 `toolkit/test_*.py` scripts · `verify.py` (R1+R2+R3).

## memory-home resolution (closed)

A deployed agent finds its memory-home by a **self-teaching SOUL + a coupled skill**, not a baked
path (`05ea924`): the `ledger` organ value cell `memory-home` projects three lines into every SOUL —
`memory-home` (the layers), `home-derivation` (`home = ~/.claude/agents/<name>`, `~`-resolved per host
from the agent's own `name` join-key), and `protocol` (the _where_ lives in the SOUL; the _how_ — the
`encode·dream·wake` verbs over `episodic.mjs --home <home>` — lives in the `memory` skill). The old
form dumped the whole `## Protocol` verbatim into all 11 defs; the new factorization is cite-once
(verb protocol has one home, the skill) and substance-over-accident (SOUL carries the portable rule,
not an absolute path). The earlier "new SOUL lacks the memory protocol" flag is RETRACTED.

## redeploy readiness

GO once the Operator authorizes the live cutover. Atomic per-host: `deploy.py --kind agent` **and**
`--kind skill` together — **coupling law** (the SOUL teaches the _where_, the `memory` skill the
_how_; an agent without the skill knows its home but not the verbs). Dry-runs clean (11 agents · 14
skills incl. bundled `episodic.mjs`). Recommended hardening (infra, mine): make the coupling an
enforced `deploy.py` gate, and prove resolution per host with a real `episodic.mjs read --home
~/.claude/agents/<name>` round-trip (verify-what-lands), not a doc claim. The live fleet was not
touched during this pass.
