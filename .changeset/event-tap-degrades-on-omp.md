---
'@cratylus/runtime': minor
'@cratylus/forge': minor
---

The event tap no longer pretends to attach to omp.

`@cratylus/runtime`: `cratylus eventTap <verb>` now resolves which harness invoked it and refuses when that harness has no tap strategy. Only Claude Code has one today, so from an omp session every verb exits non-zero, names omp and Claude Code, and writes nothing. Before, `install` wrote `<cwd>/.claude/settings.json`, a file omp never reads, and `status` reported `attached: true` for a tap that captured nothing. The harness is read from the invoking environment, not the host config: the config holds one stanza per deployed harness, so on a host with both it cannot say which is calling. omp exports `OMPCODE` and also Claude Code's `CLAUDECODE`, so omp is tested first. A caller whose environment names no harness still gets Claude Code, as before. New exports from `@cratylus/runtime/capabilities/event-tap`: `EVENT_TAP_HARNESSES`, `hasEventTapStrategy`, `invokingHarness`; `EventTapDispatchOpts` gains `harness` and `env`.

`@cratylus/forge`: `project` warns once when a corpus declares the `eventTap` capability and the target harness has no tap strategy, naming the skill, the capability and the harness and saying no events are captured there. The skill and its shim still ship as a declaration.
