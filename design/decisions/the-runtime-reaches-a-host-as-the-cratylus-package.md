# The runtime reaches a host as the cratylus package

The runtime is published to the npm registry as the unscoped `cratylus` package, which provides the `cratylus` command and depends on the scoped canon, forge and runtime packages; a release on `main` publishes it, and any ref can be published as a prerelease. It reaches a host installed by the host's package manager; `cratylus install` then projects the agents, skills, rules and the harness adapter, and every adapter calls that installed command. Nothing else places the runtime on a host.

Inside this workspace the command is reached as `pnpm cratylus`, through the root's workspace dependency on the package. An unreleased build is tried by installing the package globally from its directory (`pnpm add -g .`) or by installing a prerelease, then running `cratylus install`.
