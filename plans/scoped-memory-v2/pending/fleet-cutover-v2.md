# fleet-cutover-v2 — atomic deploy: runtime + hook + rituals

**Lane** Mav (deploy) + Nico (judge) · **wave(1)** · deps: ⊳runtime-telemetry · ⊳telemetry-hook ·
⊳corpus-rituals-v2 · HELD.

## Static

All wave(0) completed task-files. Deploy: `pnpm anatomy:deploy --fleet` (all kinds; no literal `--`;
read the log for FLEET-vs-LOCAL blocks). Coupling: SOULs + memory skill (new bundle) + path-telemetry
hook land atomically per host. upmav carries locally-diverged memory/wake/dream skill files (restore
point `~/.claude/skills/memory/.bak/01KWHXHMY6AC5C0162786DR1YT/`) — this deploy supersedes them.

## Scope

Build → project → fleet deploy → verify. No store migration (next wave). Live-verify the D2a degrade
contract on one host: `encode` with no telemetry journal present succeeds cwd-only.

## Accept (falsifiers)

- Per reachable host: sha256(sample ≥3 SOULs) = render; deployed `episodic.mjs` answers all of
  `dream fold`, `--replay`, `read --under`, `lock status`; hook registered in `settings.json`
  (merged, nothing clobbered) with its worker present; a scratch Edit fires exactly one journal line
  (one host suffices for the live hook proof).
- upmav: deployed bundle contains no verb outside the v2 surface (`session`/manifest machinery
  absent); skill texts match the render tree byte-for-byte.
- Log shows FLEET blocks ×7 or named unreachable-deferred; content-verify ≥3 hosts incl. one
  `lcaraccioli` host.
