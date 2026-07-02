# fleet-cutover — deploy the scoped-memory corpus + runtime

**Lane** Mav (deploy) + Nico (judge) · **wave(2)** · deps: ⊳corpus-scope-laws · ⊳runtime-scope-audit ·
**Status** pending (HELD).

## Static

Both wave(1) completed task-files. Deploy path: `pnpm anatomy:deploy --fleet` (all kinds atomic; NO
literal `--` separator — it reaches cac and the flag is silently dropped to LOCAL). Coupling law:
SOULs + `memory` skill dir (with the rebuilt `episodic.mjs` bundle) land atomically.

## Scope

Build → project → fleet deploy only. No migration (next wave). upgoose: attempt; if unreachable,
defer idempotently (standing pattern).

## Accept (falsifiers)

- Per reachable host: sha256(deployed agent .md) = sha256(render tree) for a sample ≥3 agents; the
  deployed `episodic.mjs` answers `audit --help`-class invocation (verb exists on-host); SOUL Memory
  Protocol contains the scope clause (grep). Log shows FLEET blocks, not LOCAL.
- Read the deploy LOG, never the exit code; verify by content on ≥3 hosts incl. one `lcaraccioli` host.
