# RETURN — continue-adapter-truth (wave 5) · judged PASS

commit `4d81308` (executor died at the account-limit before writing this sheet; reconstructed from the landed commit + judge pass at wave close).

- **Graduated (owned 9/9):** E8.S9×8 (MCP emit target · no map-clobber · LIST lift no phantom `0` · rules→`.continue/rules/*.md` · root AGENTS.md gone · `~/.continue/AGENTS.md` gone · invokable prompts · fabricated-shape import zero phantom rules) + E9.S4 continue call-site row (config.yaml key-merge, foreign blocks survive).
- **Tracked:** 179→170/42. Judge: 9 removed ≡ owned; 7-file footprint clean.
- **Gates:** 4×0 in isolated worktree of the commit.
- **Design:** MCP scope-split (config.yaml `mergeYamlKeys` LIST vs project `.continue/mcpServers/mcp.json`); `commands` none→partial (honest per [CT3]); remote `headers` dropped with warning (block schema has no field).
- **Race incident (this shard's executor):** its first commit `1e20d48` was swept by a sibling's git-add race; recovered via soft-reset + read-tree + exact-blob restage. Motivated the mandatory post-commit blob-verification rule for the rest of the wave.
- **Residue:** `.continuerc.json` overlay + hub `uses:` unmodeled [CT5][CT7] (no tracked ids).
