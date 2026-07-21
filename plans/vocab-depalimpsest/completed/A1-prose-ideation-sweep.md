# A1 — depalimpsest the prose/ideation surface (retired founding vocab → concrete)

**static:** `docs/ideation/the-ambient-person.md` · `plans/vocab-depalimpsest/MAPPING.md` (the token map) ·
`packages/agent-anatomy/src/organs/**/README.md` (organ prose) · any `*.md` under `docs/` carrying a retired
token. Pin the live set at dispatch: `git grep -ilE '\bpolis\b|politeia|mind-society|\bcommons\b|\boikos\b|founder-charter' -- docs 'packages/**/*.md' ':!*/dist/*' ':!plans/**'`.

**scope:** rewrite each retired token to its `MAPPING.md` concrete per its LOCAL context (judgment, not blind
sed) in PROSE/DOCS only. EXCLUDE: (a) the founding-CLI code layer — `found.ts`, `cli/index.ts`,
`founding-template.ts`, `found-cli.ts`, `plan-states.ts` (owned by the plugin-cli redesign, `plans/plugin-cli/`);
(b) the `Genus`-axis `STANCE`/`CONATUS` tokens (deferred fork, MAPPING §FLAGGED); (c) plan RECORDS under
`plans/**` (git-historical, not net-current source); (d) the accept-gate palimpsest-token list itself (it is the
guard — leave it). A doc whose whole framing is the retired model (e.g. `the-ambient-person.md`) is rewritten to
the concrete model, not token-patched.

**accept (falsifier):** after the shard, `git grep -inE '\bpolis\b|politeia|mind-society|\bsociety\b|\bcommons\b|\boikos\b' -- docs 'packages/**/*.md' ':!*/dist/*' ':!plans/**'` returns ONLY the excluded-by-design sites
(none in the swept prose); a cold Ω\* read of each rewritten passage decodes the concrete component (e.g.
"catalog"/"project"/"fleet"), not the classical framing; no code/test touched (prose+docs only); `pnpm typecheck`
unaffected (green).

**dep:** none (prose is independent of the CLI redesign).
