# A3 — align agent memory stores to the concrete vocabulary (dream-time, not bulk-edit)

**static:** `~/.agents/<name>/{SEMANTIC.md,PROCEDURAL.md}` for each deployed agent (host-local, NON-git) ·
`~/.claude/agents/<name>/{SEMANTIC,PROCEDURAL}.md` (pre-migration store path) · `MAPPING.md` ·
`~/.claude/skills/dream` (the consolidation ritual).

**context:** agent memory is SELF-AUTHORED durable content — NOT bulk-editable by another party
(`partition-then-prune`: another session's/agent's durable self-authored content is not mine to unilaterally
rewrite). nico's own stores are already clean of founding vocab (verified). The correct mechanism is
dream-time self-alignment, per agent, on its own home.

**scope:** (a) VERIFY nico's own stores stay clean (`grep -iE 'polis|politeia|society|commons|founder|oikos'
~/.agents/nico/*.md` → empty; re-home path per E6a `~/.agents/<name>`). (b) EMIT a standing dream-directive:
at each agent's next `dream`, if a resident SEMANTIC/PROCEDURAL entry carries a retired token, rewrite THAT
entry to its `MAPPING.md` concrete in place (supersede-not-layer) — the agent aligns its OWN memory. Do NOT
bulk-sed foreign agents' stores. (c) EXCLUDE the `Genus`-axis tokens (deferred fork).

**accept (falsifier):** nico's stores grep-clean of retired founding vocab; the dream ritual (or its shipped
protocol) carries the align-on-encounter directive so the fleet self-heals without a destructive cross-agent
bulk edit; no foreign agent's store hand-edited by this shard.

**dep:** none. (Lightweight — mostly a protocol note; the heavy vocab lives in source, not memory.)
