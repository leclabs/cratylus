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
