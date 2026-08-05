# S7 · deploy-runtime-install

**Objective.** Make the per-host **runtime install** a guaranteed deploy step: after projecting/placing artifacts, deploy ensures each target host has `@leclabs/runtime` (+ the declared capability plugins: memory, event-tap) installed and its branded bin on PATH — so a deployed thin-shim's `runtime <cap> <verb>` resolves. This DISSOLVES the memory-on-PATH gate (the E6a invocation-continuity hole) as a normal package install; resolve FORK-3 (publish/install strategy).

**Static inputs (pinned):**

- `packages/forge/src/deploy/{local.ts, ssh.ts, deploy.ts:120-203}` — the local + ssh placers where a runtime-install step slots in (per-host, idempotent).
- `packages/runtime/package.json` + `packages/memory/package.json` — the packages to install (bin, exports; publish/private state from FORK-3).
- `.cratylus.config` (fleet topology) — the hosts; per-host user/hostname resolution already in `deploy/config.ts`.
- The c13e911 history-migration context (this session): homes already at `~/.agents/<name>` fleet-wide; the install must not disturb them.

**Constraints.**

- FORK-3 decides the install mechanism: publish → `npx @leclabs/runtime` / global install; OR private-registry; OR monorepo-bundled tarball scp'd + installed. Whatever is chosen, the host ends with `runtime` (branded, S9) on PATH — NOT a hand-symlink (the category error from this session).
- `memory install` (the old no-op self-check) is RETIRED — the runtime install replaces it. Remove/replace the orphaned `~/.claude/skills/memory/episodic.mjs` per host.
- Idempotent + guarded (like the c13e911 migration): re-deploy is a no-op when the correct runtime version is present; version-pin so a stale host is detected.
- Local (`fire`) + ssh (remote fleet) paths both covered. Fleet push RESERVED (operator) — S7 delivers the mechanism; the fleet-wide RUN is operator-gated.

**Dependencies.** S3 (the runtime pkg + bin), S4 (memory plugin), S5 (event-tap plugin), S6 (deploy build changes).

**Outputs.** deploy gains a per-host runtime-install step (local + ssh); `memory install` retired; orphan `episodic.mjs` removal; a documented install mechanism (FORK-3 resolved); version-pin check.

**Completion criteria (falsifier).** On a test/local target, deploy leaves `runtime` resolvable on PATH and `cratylus-run memory home --name <x>` works POST-deploy without any hand-symlink; re-deploy is a no-op (idempotent); no `memory` bin and no orphan `episodic.mjs` remain. REJECTED if the install is a hand-symlink, if a host lacks the bin after deploy, if it clobbers an existing `~/.agents/<name>` home, or if the fleet was pushed without operator gate.
