---
"@cratylus/forge": minor
---

An omp main session starts with its skills' bodies, as a dispatched subagent does

`omp-agent <name>` used to append only `skill://<name>` references for the
definition's `autoloadSkills`. It now inlines the `SKILL.md` omp itself would
resolve for each, in listed order: the first hit under the user-level roots
omp's skill loader keeps, in its precedence (`~/.omp/agent/skills/`,
`~/.claude/skills/`, `~/.agent/skills/`, `~/.agents/skills/`,
`~/.codex/skills/`), each gated as omp gates it by `disabledProviders`, its
`skills.enable*User` toggle and, for claude and codex, `enabledProviders`. The
settings come from one `omp config list`, with omp's defaults when it prints
nothing. Each skill arrives as a `# Skill: <name>` section with a
`Base directory:` line and without its front matter. A skill found under no
kept root is named under `## Required reading` instead, and the launcher prints
one `omp-agent:` line to stderr for each one. `skills.ignoredSkills`,
`skills.includeSkills`, `skills.customDirectories` and plugin skills are not
mirrored, and the launcher says so on stderr when any is set. The launcher's
doc now names the real size limit, the per-argument `MAX_ARG_STRLEN` of 128 KiB.
