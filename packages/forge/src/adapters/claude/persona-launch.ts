// The commands that carry a persona's composed skills into a Claude Code `--agent`
// MAIN session. Claude preloads an agent definition's `skills` only when that
// definition is DISPATCHED as a subagent; run as the main session it applies the
// definition's body as the system prompt and preloads nothing, so a persona
// launched by name would hold fewer skills than the same position dispatched.
//
// What carries them is the definition's own `SessionStart` hook. Measured on Claude
// Code 2.1.285: a front-matter hook of that event fires for the agent run as the
// main session and does NOT fire when the agent is dispatched as a subagent, so
// the two paths cannot load a skill twice; and its plain stdout reaches the
// model's context before the first turn. The alternative, `initialPrompt`, reads
// only its first slash command, so it cannot carry several skills.
//
// ONE COMMAND PER SKILL, NOT ONE FOR ALL. Claude caps a hook's plain stdout at
// 10,000 characters and, over that, replaces it with a 2,000-character preview and
// a path to a file it does not ask the model to read (measured: a single command
// printing a four-skill closure of 25,603 characters reached the model as that
// preview, and the model answered as if the skills were absent). Each hook's output
// is measured on its own, so one command per skill keeps every body whole — as long
// as no single skill body and its base-directory line exceed the cap. Nothing here
// trims a body to fit; a skill over the cap arrives as Claude's preview.
//
// Each command is a PURE function of (agent, skill name, where skills live). It
// reads the `SKILL.md` at RUN time, off the host's disk, exactly as the subagent
// preload does — so it holds no copy of a body to drift from the projected skill,
// and needs no worker file and no placement.

/** The `SessionStart` sources that start a context without the skills in it.
 *  `resume` is left out on purpose: a resumed session already holds them. */
export const PERSONA_LAUNCH_MATCHER = 'startup|clear|compact';

/** Where the skills are, as SHELL text read at run time on the host the definition
 *  lands on (so `home` is `$HOME/.claude`, never the projecting machine's path). */
export interface PersonaSkillRoots {
  /** The harness home, as a shell expression. */
  readonly home: string;
  /** A skill's directory relative to `home` — the harness's ONE skill layout. */
  readonly skillRel: (name: string) => string;
}

/** `s` as ONE POSIX shell word that no character can escape. */
function shellQuote(s: string): string {
  return `'${s.replaceAll("'", `'\\''`)}'`;
}

/** Text after a leading front-matter fence, leading blank lines dropped. Front
 *  matter is dispatch metadata and never reaches the model as literal text.
 *
 *  The fence is spelled `^-[-][-]$`, never `---`: this program travels inside the
 *  definition's own front matter, and a reader that closes that front matter at the
 *  first `---` it meets, in a string or not, would cut the definition there. */
const AFTER_FRONT_MATTER = [
  'NR == 1 && /^-[-][-]$/ { fm = 1; next }',
  'fm { if (/^-[-][-]$/) fm = 0; next }',
  '!started && $0 ~ /^[ \\t]*$/ { next }',
  '{ started = 1; print }',
].join(' ');

/**
 * The shell command a `SessionStart` hook runs to load skill `skill` for agent
 * `agent`: the line `Base directory for this skill: <dir>`, a blank line, and that
 * skill's `SKILL.md` with its front matter stripped — the form Claude's own
 * subagent preload injects.
 *
 * A skill whose `SKILL.md` is absent is not dropped. It is named under a
 * `## Required reading` heading, one stderr line names the agent and the skill, and
 * the command still exits 0 — a session that starts without a skill is worse than
 * one that says so, and one that will not start is worse still.
 *
 * Known difference: only the user-level skills root is read, so a project-level
 * `.claude/skills/<name>` that shadows it is not consulted.
 */
export function personaSkillCommand(
  agent: string,
  skill: string,
  roots: PersonaSkillRoots,
): string {
  return [
    `dir="${roots.home}"/${shellQuote(roots.skillRel(skill))}`,
    // The body is read, never sourced or evaluated.
    'if [ -f "$dir/SKILL.md" ]; then',
    `  printf 'Base directory for this skill: %s\\n\\n' "$dir"`,
    `  awk ${shellQuote(AFTER_FRONT_MATTER)} "$dir/SKILL.md"`,
    'else',
    `  printf '%s: no skill %s at %s; naming it as required reading instead\\n' ${shellQuote(agent)} ${shellQuote(skill)} "$dir" >&2`,
    `  printf '## Required reading\\n\\nThis skill is REQUIRED reading for this session, not background:\\nload it with the Skill tool and read it in full before you act.\\n\\n- \`%s\`\\n' ${shellQuote(skill)}`,
    'fi',
    'exit 0',
  ].join('\n');
}
