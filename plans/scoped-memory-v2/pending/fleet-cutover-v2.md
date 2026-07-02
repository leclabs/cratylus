# fleet-cutover-v2 — atomic deploy: runtime + rituals

**Lane** Mav (deploy) + Nico (judge) · **wave(1)** · deps: ⊳runtime-lattice · ⊳corpus-rituals-v2 ·
HELD.

## Static

Both wave(0) completed task-files. Deploy: `pnpm anatomy:deploy --fleet` (all kinds; no literal
`--`; read the log for FLEET-vs-LOCAL blocks). Coupling: SOULs + memory skill (new bundle) land
atomically per host. upmav carries locally-diverged memory/wake/dream skill files (restore point
`~/.claude/skills/memory/.bak/01KWHXHMY6AC5C0162786DR1YT/`) — this deploy supersedes them.

## Scope

Build → project → fleet deploy → verify. No store migration (next wave).

## Accept (falsifiers)

- Per reachable host: sha256(sample ≥3 SOULs) = render; deployed `episodic.mjs` answers all of
  `node`, `fold`, `read --under`, `lock status`; a scratch encode on one host derives cwd (record
  shows the derived value, not a caller-passed one).
- upmav: deployed bundle contains no verb outside the v2 surface; skill texts match the render tree
  byte-for-byte.
- Log shows FLEET blocks ×7 or named unreachable-deferred; content-verify ≥3 hosts incl. one
  `lcaraccioli` host.
