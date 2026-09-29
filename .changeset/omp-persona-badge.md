---
"@cratylus/forge": minor
---

omp: the persona badge — the running persona's mark emoji and name in the status line

`cratylus project --harness omp` now emits one `cratylus-persona-badge.ts` extension module per projected persona, placed in that persona's own `agent/personas/<name>/extensions/`. In a top-level interactive session it sets the status line to the persona's mark emoji and name, or the name alone for an agent with no provenance; a subagent and a headless session show nothing. The text is baked at projection, and no hue is carried because omp strips color from an extension's status text.

**Breaking for out-of-tree `HarnessAdapter` implementers.** `launchSurface` now takes the composed agents, `launchSurface(agents: readonly Agent[])`, instead of their names, `launchSurface(agentNames: readonly string[])`. An implementation that only needs the names reads `agents.map((a) => a.name)`.
