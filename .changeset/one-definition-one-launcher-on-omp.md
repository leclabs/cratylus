---
'@cratylus/forge': minor
---

An omp agent is ONE definition omp itself discovers, read back by ONE launcher

`cratylus project --harness omp` projected each persona to `~/.agents/<name>/APPEND_SYSTEM.md` — a
file omp reads only when a flag names it — plus a per-agent `omp-launch` script to name it. Two
consequences, both silent:

- **The composed agent could be launched and could not be DISPATCHED.** omp discovers user-level
  task agents from `~/.omp/agent/agents/*.md` and nowhere else, so a persona carried as a launch
  ARGUMENT was invisible to `task`. The same name meant an agent in one direction and nothing in
  the other.
- **N agents shipped N byte-identical launchers.** Every `omp-launch` differed only in the
  directory it happened to sit in, so each one was a copy the deploy had to keep converging, and
  each new agent added another.

Both close on the same artifact. The definition is now `~/.omp/agent/agents/<name>.md`: YAML
front-matter carrying the `name` and `description` omp requires, and a body that IS the system
prompt. Dispatched as a subagent, omp parses it natively. Launched as a MAIN session — for which
omp has no `--agent` flag at all — the generic `~/.omp/agent/omp-agent` reads the same bytes.

The launcher resolves the agent at RUN time, from `$1` or, when reached through a symlink named
after the agent, from argv[0] itself (busybox-style, and it does not consume `$1`, so
`mav --model x` passes the flag through). It splits the front-matter off, prepends the identity
assertion omp's own base prompt would otherwise win, renders any `autoloadSkills` as required
reading — omp honours that field ONLY for a spawned subagent, so without this one definition would
mean two different things depending on how it was reached — and hands the result to
`--append-system-prompt` as an argument. A definition that is not there is a named refusal and a
nonzero exit, never a fall-through to a bare `omp` wearing the persona's name.

**The description is now a quoted YAML scalar.** A plain one may not contain `: `, and `nico`'s
description does ("its conceptual architecture and canon: dimension catalogs") — unquoted, the
document is a scanner error omp survives only by falling back to a naive `key: value` line parser,
warning once per discovery pass and invisible until a description grows something the fallback
loses too.

**Per-persona scopes moved in with the harness**, from `~/.agents/<name>/` to
`~/.omp/agent/personas/<name>/`. What was left out there once the persona file moved was an
`omp.yml` and a TypeScript module omp alone loads — harness-specific bytes in a harness-NEUTRAL
root, and a directory the one launcher could only reach by hard-coding the harness home's own depth
into shell. The scoping guarantee is unchanged and is still the whole point: nothing scans
`personas/`, so a mechanism module there loads under that persona's own `--config` overlay and
under no other, and a bare `omp` reads only the session root's own `extensions/`.

Skills are untouched: still one copy at `~/.agents/skills/<name>`, which omp reads natively on
every launch.
