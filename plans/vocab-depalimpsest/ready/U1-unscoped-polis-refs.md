# U1 — retire the unscoped `polis` references (surfaces no other shard owns)

Surfaced 2026-07-21 by a comprehensive `git grep -in polis` (after an earlier `rg -nwE` false-green missed them).
These carry the old project name `polis`; no existing shard (B1 narrative, P6 identifiers, A2 fixture) covers them.

**static (censused, verify at dispatch):**

- `packages/agent-anatomy/src/toolkit/cold-oracle/cold-oracle.sh` — `REPO_GUARD="$HOME/workspaces/polis"` (L29) +
  the L9 comment. **This is a live functional ref**: the isolation guard's repo-path is the OLD repo name; the
  current repo is `agent-factory`, so the guard checks the wrong path (latent leak-guard bug). → the current repo.
- `packages/agent-forge/README.md` (L3 "part of [polis]") · `packages/agent-forge/docs/writing-an-adapter.md`
  (L206 "leclabs/polis") — external-facing project/repo links. Confirm the current GitHub repo name first (if the
  remote is still `leclabs/polis`, these are correct; if renamed, update). This is the ONE surface with a possible
  external/rename dependency — do not blindly rewrite a live URL.
- `packages/agent-forge/test/deploy/{cli,config}.test.ts` — `tmp('polis-empty-')`, `tmp('polis-cfg-')` temp-dir
  name prefixes (cosmetic, test-internal).

**scope:** replace the `polis` token with the current project name (`agent-factory` / the concrete concept) per
site. FIRST resolve the REPO_GUARD (functional) and confirm the GitHub repo name for the README/docs links.
EXCLUDE the `policy.ts` palimpsest guard (it ENFORCES the retirement — stays).

**accept (falsifier):** `git grep -in polis -- packages ':!*policy.ts'` returns EMPTY (all live polis retired;
only the intentional palimpsest guard remains); `cold-oracle.sh` REPO_GUARD points at the current repo; the
isolation positive-control still passes (a coined token decodes to its generic prior); `pnpm -C packages/agent-forge test` green.

**dep:** none (independent). Coordinate the README/docs external links with the actual repo-rename state.
