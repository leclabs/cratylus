# RETURN — claude-mcp-rehoming (wave 5) · judged PASS

commit `eca0068` (executor died at the account-limit before this sheet; reconstructed from the landed commit + judge pass at wave close).

- **Graduated (owned 7):** E8.S1×6 (`.mcp.json` + `~/.claude.json` homes, settings merge-safe) + E9.S4 claude call-site row. Net 7 (11 removed − 3 gap-note reflow re-adds − 1 E9.S4 pairing; E3.S5/E7.S6 rows edited for remaining clients, not graduated).
- **Tracked:** 170→162/42. Judge: net removals reconcile to owned set; consistent with the E9.S4-per-adapter pattern.
- **Gates:** green at wave-close full-suite (671→ green through the chain).
- **Residue:** claude/gemini native hook objects now carry `id` when the IR hook has one — fleet settings.json gains it on next anatomy deploy (flag if Claude Code doctor complains).
