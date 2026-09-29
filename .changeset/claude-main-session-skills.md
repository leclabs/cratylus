---
'@cratylus/forge': minor
---

A Claude Code `--agent` main session now starts with the persona's composed skills, as a dispatched holder of the same position does. Claude preloads an agent definition's `skills` only for a subagent, so a persona launched by name (`claude --agent mav`) held none of them.

Every projected agent that has skills now carries a `SessionStart` entry, in the same single `hooks:` block as any enforcing entries, on the sources `startup|clear|compact` (a resumed session already holds them). The entry holds one command per skill, in the agent's `skills` order. Each prints the line `Base directory for this skill: <dir>` and that skill's `SKILL.md` with its front matter stripped, read from `$HOME/.claude/skills/<name>` when the session starts. The hook does not fire when the agent is dispatched as a subagent, so no skill loads twice. A skill whose `SKILL.md` is absent is named under `## Required reading`, one stderr line names the agent and the skill, and the command still exits 0. An agent with no skills gets no entry. A project-level `.claude/skills/<name>` that shadows the user-level copy is not consulted.

Each skill is its own command because Claude Code caps one hook's output at 10,000 characters and, over that, hands the model a 2,000-character preview and a file path instead: a single command printing mav's four-skill closure (25,603 characters) reached the model as that preview. The cap is measured per hook, so every body arrives whole while it fits alone. Two consequences hold: Claude runs an event's hooks in parallel, so the order the bodies reach the model in is not guaranteed to be the `skills` order (observed in one of four live runs); and a skill whose body and base-directory line exceed 10,000 characters arrives as Claude's preview. The largest today, `plan`, is 9,967.

`@cratylus/forge` adds `adapters/claude/persona-launch.ts` (`personaSkillCommand`, `PERSONA_LAUNCH_MATCHER`, `PersonaSkillRoots`).
