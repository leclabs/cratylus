---
"@cratylus/forge": minor
---

An omp main session starts with its skills' bodies, as a dispatched subagent does

`omp-agent <name>` used to append only `skill://<name>` references for the
definition's `autoloadSkills`. It now asks omp for each, in listed order, with
`omp read skill://<name>` run from the launch directory, and inlines the
`SKILL.md` omp resolves without its front matter, so user and project roots and
omp's own settings all apply. Each skill arrives as a `# Skill: <name>` section
that opens with one line per shim, saying the CLI command its route runs as
(`scripts/plan.mjs <verb>` runs as `cratylus plan <verb>`), in place of a base
directory omp does not expose. A skill omp cannot resolve is named under
`## Required reading` instead, and the launcher prints one `omp-agent:` line to
stderr for each one. The launcher's doc now names the real size limit, the
per-argument `MAX_ARG_STRLEN` of 128 KiB.
