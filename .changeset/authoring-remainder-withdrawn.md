---
"@cratylus/forge": minor
"@cratylus/schema": minor
---

forge no longer carries the consumer-patch fold or value provenance, which only the removed configuration file and `explain` reached. `install` still discovers the canon's values, and discovery still refuses a shared namespace and a reference graph that dangles or cycles. The schema package's README now addresses cratylus's contributors rather than a canon's author.

BREAKING CHANGE: forge's `./resolve` subpath is removed, with `resolve`, `ResolveConfig`, `ResolvedAgentSet`, `ResolvedFragment`, `FragmentContribution`, `ContributionSource`, `LoadedPlugin`, `PatchEntry`, `PatchOp`, `MissingExtendsTargetError`, `IllegalOpForValueShapeError`, `ForcePriorityTieError` and its re-export of `AgentPlugin` and `defineAgentPlugin` (import those from `@cratylus/schema`). `@cratylus/forge/project` loses `resolveFragmentBodies`, `AmbiguousFragmentBodyError` and `ProjectOpts.resolvedBodies`. `@cratylus/schema` loses `withBody`, which only the fold used.
