---
"@cratylus/forge": minor
---

An omp main session starts with its skills' bodies, as a dispatched subagent does

`omp-agent <name>` used to append only `skill://<name>` references for the
definition's `autoloadSkills`. It now inlines each skill's `SKILL.md`, in listed
order, from the first user-level root omp discovers it under: `~/.omp/agent/skills/`,
then `~/.agents/skills/`. Both roots are resolved from the launcher's own
directory. Each skill arrives as a `# Skill: <name>` section with a
`Base directory:` line and without its front matter. A skill found under
neither root is named under `## Required reading` instead, and the launcher
prints one `omp-agent:` line to stderr for each one. The launcher's doc now names
the real size limit, the per-argument `MAX_ARG_STRLEN` of 128 KiB.
