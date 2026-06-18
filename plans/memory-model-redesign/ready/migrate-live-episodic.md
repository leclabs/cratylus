# migrate-live-episodic

**Owner.** Mav (build) + Nico (verify). **Deps.** jsonl-episodic-store, dream-routing-engine. **Consent-gated** —
touches live agent memory.

**What.** Convert the existing live agents' markdown `EPISODIC.md` → `EPISODIC.jsonl` across the fleet (nico, mav,
and the other 9 agents). Preserve content; lose nothing in the conversion.

**Exit criteria.**

- Every live agent's EPISODIC is valid JSONL; a wake + dream cycle works post-migration.
- No content dropped — diff the distilled residue before/after.
- Operator consent obtained before touching live memory; Nico verifies the no-loss gate himself.
