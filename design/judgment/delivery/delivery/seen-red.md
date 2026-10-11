# Delivery judgment checks seen red

These cases run only in judgment. They were bound and seen red before the build, under the check-writer's freeze assignment. No model ran. The package test configuration does not include this directory.

```sh
pnpm --filter cratylus exec vitest run --config ../../design/judgment/delivery/delivery/vitest.config.ts --reporter verbose
```

| Example    | Check                                                                                                                 | Observed failing reason                                                                                                                                                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delivery/1 | newer artifacts still warn about an older reached command, never select another available build                       | Artifacts were installed by declared 3.1.0, the reached command changed to declared 3.0.0, and another 3.1.0 build remained available. Startup emitted no warning: expected one warning naming both roles' versions, received zero.                                                                                                      |
| delivery/2 | two changing upgrades followed by uninstall leave no generation of material or references and keep the host extension | Restored the real pre-cut corpus-variant installation, then installed the middle corpus variant at declared 2.5.0. Its agent was absent from the owned root (`false` instead of `true`). The check continues through the 2.6.0 variant and uninstall once this required placement exists; it rejects residue from all three generations. |
| delivery/3 | uninstall preserves a host replacement reference and its outside target while removing remaining root references      | Today's install offers no replaceable owned-root reference: it installs copies instead. The preservation assertion was separately proved with golden and negative result records, below; deleting the replacement fails even when the target survives and the root is removed.                                                           |
| delivery/4 | the same session reports and calls a replaced command rather than caching its startup version or runtime              | The loaded extension does not register `version_skew`, so versions are unavailable even at startup. The test keeps the same extension alive across the command replacement and traces the actual installed entry point to bind the subsequent capability call to 2.5.0.                                                                  |

## Replacement-preservation proof

The real uninstall test and the proof use the same `assertReplacement` assertion. The golden records a surviving host reference and target with the owned root removed; the negative differs only in deletion of that reference.

```sh
pnpm --filter cratylus exec vitest run --config ../../design/judgment/delivery/delivery/vitest.config.ts replacement-proof.test.ts --reporter verbose
env DELIVERY_REPLACEMENT_RED=1 pnpm --filter cratylus exec vitest run --config ../../design/judgment/delivery/delivery/vitest.config.ts replacement-proof.test.ts --reporter verbose
```

Observed: golden passes; negative fails `host replacement survives uninstall: expected undefined to deeply equal { link: '/fixture/home/mira/skills' }`.

The initial installation in the multi-upgrade case is the captured real earlier install, not a synthetic manifest or unowned stale file. Its next two generations are real additive corpus variants, each replacing the other, installed by the packed command. Shared infrastructure contains no judgment case. Version changes edit the installed package's declared version; the trace observes rather than replaces the installed implementation. No source workspace is added to PATH.

## Decision 0112: preserve earlier host answers through both upgrades and uninstall

`delivery/2 — two changing upgrades followed by uninstall leave no generation of material or references and keep the host extension` now requires every captured earlier model-role answer to survive both upgrades and uninstall, including `obsolete-agent`. Old material still must disappear: only the host-owned model-role values are omitted from the residual-projection name scan.

```sh
pnpm --filter cratylus exec vitest run --config ../../design/judgment/delivery/delivery/vitest.config.ts -t 'delivery/2 —' --reporter verbose
```

Observed red against the pre-0112 build: the first upgrade deleted `.omp/agent/config.yml`, and `preserved(h, bindings)` failed with `ENOENT` before the second upgrade. The captured earlier answers are read before migration; no synthetic replacement answers are used. An initial attempt from the workspace root with `pnpm exec vitest` could not resolve Vitest and is not counted as evidence.
