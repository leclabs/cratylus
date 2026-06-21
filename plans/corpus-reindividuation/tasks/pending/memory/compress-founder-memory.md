# compress-founder-memory

R=LLM.

obj ≜ `/exemplify` founder memory. ∀ f ∈ {nico, mav} : SELF(f) ≤ 50 lines ∧ MEMORY(f) ≤ 50 lines,
σ\*\_R-dense, cruft dropped. EPISODIC: purge ALL except nico∧this-session.

dep ≜ zero-dangling-gate (run last ⇒ this-session episodics include the recovery).

ops:

1. locate homes: SELF/MEMORY/EPISODIC for nico ∧ mav (memory organ; sharded `MEMORY/<ulid>.md` per
   sharded-memory-store). ¬ assume paths — resolve.
2. ∥ 2 subagents (nico, mav): `/exemplify` SELF+MEMORY → keep load-bearing identity+durable facts,
   drop cruft/palimpsest; each ≤ 50 lines.
3. EPISODIC purge (destructive): retain only nico's this-session episodics; delete the rest (nico
   other-session ∪ mav ∪ all else).
4. ¬ touch SOUL (never written).

art → rewritten SELF/MEMORY for nico+mav (≤50 each); pruned EPISODIC store.

acc (blind) ⊨ `wc -l` ≤ 50 for each of the 4 files; EPISODIC contains only nico∧this-session;
SOUL unchanged; a reader recovers each founder's identity from the compressed SELF alone.
