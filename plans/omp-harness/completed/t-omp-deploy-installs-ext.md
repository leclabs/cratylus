# t-omp-deploy-installs-ext

**Wave 3.** `cratylus deploy --harness omp` installs the extension.

## Intent

Dogfooding is the point: cratylus development happens in omp, so a cratylus install for the
omp harness must leave a working omp. That means the agent-launch extension is placed by
deploy, not by a human following a README.

## Constraints

- **Deploy owns what it writes, and only that.** The manifest records every placed path so the
  pruner can account for it — an extension installed outside that record is the
  second-manifest hazard this corpus already paid for once.
- **`omp plugin install|link` is omp's own mechanism.** Prefer it over copying files into
  `~/.omp`, for the same reason `cratylus-run install` beat a hand-made symlink: a binding no
  artifact authored is a binding nothing can repair.
- **Refuse loudly if the extension cannot be placed**, the way `assertShimsResolvable` refuses
  rather than shipping inert shims. A deployed agent whose launcher is missing is worse than a
  failed deploy, because it looks like success.
- The render oracle covers `.cratylus/<harness>/`; adding a harness adds a tree to it.

## Deps

`t-omp-agent-extension`

## Accept

1. `cratylus deploy --harness omp` on a clean host yields a working `omp` launch-as-agent.
2. The deploy manifest accounts for every path written, and prune removes them.
3. A failed extension install fails the deploy, loudly, naming what was not placed.

---

# Result — 2026-08-07

## The premise changed, and the shard survives it

This shard was cut expecting `t-omp-agent-extension` to produce an **extension** that
deploy would then install. It did not: the persona turned out to need no code at all,
because omp auto-discovers `APPEND_SYSTEM.md` in a profile-scoped agent dir. **The
projected FACE is the launcher.** So "installs the extension" reads as "places the face
and leaves a working omp", and every constraint above still bites on that subject —
deploy still owns what it writes, still records it, still must refuse rather than look
successful.

## Accept — MET, each verified rather than argued

**1. `cratylus deploy --harness omp` on a clean host yields a working launch-as-agent.**
Done on `coal`, from the published package, with no corpus on disk: `npm i -g
cratylus@latest` → `bun add -g @oh-my-pi/pi-coding-agent` → `cratylus install --harness
omp`, then `omp --profile <name>` answering as that agent for four different agents.
Evidence in `completed/t-omp-agent-extension.md` §7.

**2. The manifest accounts for every path written, and prune removes them.**
This was the real risk in the `agentRel` change and it is the leg worth having. The
manifest records the harness's OWN layout, not the render tree's:

```
boz -> ['profiles/boz/agent/APPEND_SYSTEM.md']
```

Convergence tested in a sandbox `--home` rather than argued: deploy 10 agents, remove
`boz` from the render tree, redeploy. Output:

```
prune: removed 1 orphan(s):
  - profiles/boz/agent/APPEND_SYSTEM.md
```

and the file is gone from disk. **A record naming a path nothing writes can never
converge** — that failure mode is exactly what a per-agent-directory layout invites, and
it does not occur here because the placer's testimony and the pruner's candidate set are
one derivation.

**3. A failed placement fails the deploy, loudly, naming what was not placed.**
With `tester`'s face removed from the render tree:

```
cratylus deploy: --only: unknown agent(s) ['tester']; known: [...9 others]
```

**exit code 1.** Both halves — it names the missing subject AND lists what it does know,
so the operator can see whether the render tree or the request is wrong.

**A note on how that was measured, because it nearly went in backwards.** The first run
piped the command into `tail` and read `$?` from the pipeline, which reported `0` — the
status of `tail`, not of `cratylus`. Re-run with the output redirected and the status
read directly, it is `1`. A criterion about whether a failure LOOKS like success is
exactly the wrong place to trust a masked exit code.
