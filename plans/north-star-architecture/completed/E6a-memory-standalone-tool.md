# E6a — R6: memory as a standalone installed tool (packaging + session-id)

**static:** `packages/agent-memory/{package.json, src/**}` · `packages/agent-forge/src/deploy/{bundle.ts,
local.ts:63-73, ssh.ts, seeds.ts}` · `../census/{C2,C4}` · `../NORTH-STAR.md §3.2, §3.3`.
**scope:** rename `episodic`→`memory` (the built `.mjs` + CLI name); add a `bin` to `agent-memory/package.json`

- a human host-bootstrap install (`memory install`, uv-tool style); the store home resolves to
  `~/.agents/<name>/` (bare, from the agent NAME); `memory session register` BINDS a session id (harness-native
  env if present, else tool-minted uuid — no sessionless records). Delete the stranded bundle-staging mechanism
  (`stageBundle`/`BundleMissingError`/`baseRoot`) — memory was its SOLE `bundle:` consumer.
  **accept:** `agent-memory/package.json` has `bin`; `memory --version` runs; a fresh `~/.agents/<name>`
  provisions; `store.ts` no longer derives the session ONLY from `CLAUDE_SESSION_ID` (bound at register);
  `git grep "^bundle:" packages` = empty AND `stageBundle` deleted; core stays dependency-free (no npm deps
  added); memory tests + repo typecheck green.
  **dep:** none (own package).
