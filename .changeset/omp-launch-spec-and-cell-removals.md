---
'@cratylus/forge': minor
---

the omp persona is a launch spec under `~/.agents/`, not a profile

**The profile carrier is withdrawn.** Projecting a persona into `~/.omp/profiles/<n>/agent/`
carried identity in an ENVIRONMENT: an omp profile silos auth, MCP, model prefs, sessions and
config, inheriting nothing from the default profile but keybindings. Measured — ten
deploy-created profiles on one host held zero credential rows each and could not see that
host's own MCP servers, and on another the persona's `mcp.json` was a byte-duplicate of a
17-server org config, copied by hand because profile scope silos it.

Identity is now the LAUNCH SPEC and environment stays the profile:

| artifact         | destination                                     |
| ---------------- | ----------------------------------------------- |
| skills           | `~/.agents/skills/<skill>` (read natively)      |
| face             | `~/.agents/<agent>/APPEND_SYSTEM.md`            |
| overlay          | `~/.agents/<agent>/omp.yml`                     |
| mechanism module | `~/.agents/<agent>/extensions/<bin>-session.ts` |
| session module   | `~/.omp/agent/extensions/<bin>-session.ts`      |
| launcher         | `~/.agents/<agent>/omp-launch` (0755)           |

`~/.agents/` is not cratylus's invention: omp reads it through a vendor-neutral `.agent[s]`
provider, and Cursor reads `~/.agents/skills/` too. So skills land ONCE instead of being fanned
into every profile scope, and `omp --profile work` goes back to meaning what it says.

**Two runtime defects in the emitted mechanism, both caught by running the real binary.** The
module called `pi.exec(cmd, { shell: true })`, but `HookAPI.exec(command, args, options?)`
requires `args` and spreads it — so every registration in every module threw at load; it now
calls `pi.exec("sh", ["-c", cmd])`. And a missing worker exited 127, which the blocking branch
read as a refusal, so `ask` and `task` were blocked with `No such file` as the reason; 127 now
fails open, as the cells themselves specify.

Port changes, breaking for anyone implementing `HarnessAdapter` outside this package:
`enforcingRel` is now **`scopedRel`** (it places modules, overlays and launchers),
`HarnessProjection` gained `executable?`, and `skillRel` returns a single destination for omp.

**Deploy no longer seeds memory sidecars.** The canon's memory cells are gone, so
`SEMANTIC.md` / `PROCEDURAL.md` / `EPISODIC.jsonl` are no longer written into `~/.agents/<name>/`.
Files a previous deploy already seeded are LEFT IN PLACE — deploy never recorded them in its
prune manifest, deliberately, and an operator's stored memory is not ours to delete.
