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
// as that skill's output fits the cap. Nothing here trims a body to fit. A skill
// whose output would not fit is not hooked at all: projection weighs it against the
// cap (`personaSkillOutputSize`), warns, and the definition names it under
// `## Required reading` (`requiredReadingSection`) for the Skill tool to load.
//
// Each command is a PURE function of (agent, skill name, where skills live). It
// reads the `SKILL.md` at RUN time, off the host's disk, exactly as the subagent
// preload does — so it holds no copy of a body to drift from the projected skill,
// and needs no worker file and no placement.

/** The `SessionStart` sources that start a context without the skills in it.
 *  `resume` is left out on purpose: a resumed session already holds them. */
export const PERSONA_LAUNCH_MATCHER = 'startup|clear|compact';

/** The most characters one hook's plain stdout may hold on Claude Code before it is
 *  replaced by a 2,000-character preview and a file path. Documented at
 *  <https://code.claude.com/docs/en/hooks.md> (hook output limits) and measured on
 *  2.1.285. The cap has no setting. */
export const CLAUDE_HOOK_OUTPUT_CAP = 10_000;

/** The line that opens each skill's output, the form Claude's own subagent preload
 *  uses. */
const BASE_DIRECTORY_LABEL = 'Base directory for this skill: ';

/** The notice a skill the hook cannot carry is named in, as a `printf` — one shared
 *  spelling for a skill that is missing from the host and for one too large to print.
 *  It goes to the session and not into the definition's body: a dispatched holder of
 *  the same position has the skill preloaded, and must not be told to fetch it. */
function requiredReadingPrintf(skill: string): string {
  return `printf '## Required reading\\n\\nThis skill is REQUIRED reading for this session, not background:\\nload it with the Skill tool and read it in full before you act.\\n\\n- \`%s\`\\n' ${shellQuote(skill)}`;
}

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
    `  printf '${BASE_DIRECTORY_LABEL}%s\\n\\n' "$dir"`,
    `  awk ${shellQuote(AFTER_FRONT_MATTER)} "$dir/SKILL.md"`,
    'else',
    `  printf '%s: no skill %s at %s; naming it as required reading instead\\n' ${shellQuote(agent)} ${shellQuote(skill)} "$dir" >&2`,
    `  ${requiredReadingPrintf(skill)}`,
    'fi',
    'exit 0',
  ].join('\n');
}

/** What the launch hook prints for a skill, minus the base-directory line: `text`
 *  after a leading front-matter fence, leading blank lines dropped, every line
 *  newline-terminated. The TypeScript twin of `AFTER_FRONT_MATTER`, kept so
 *  projection can weigh a skill against the cap without running a shell; the
 *  claude tests run both on the same text and require the same bytes. */
function afterFrontMatter(text: string): string {
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  let from = 0;
  if (lines[0] === '---') {
    from = lines.indexOf('---', 1) + 1;
    if (from === 0) from = lines.length;
  }
  while (from < lines.length && /^[ \t]*$/.test(lines[from] as string)) from++;
  return lines
    .slice(from)
    .map((l) => `${l}\n`)
    .join('');
}

/**
 * How many characters the launch hook prints for a skill whose projected `SKILL.md`
 * is `skillMd` and whose directory is `dir`: the base-directory line, the blank line
 * after it, and the body. Claude counts characters, not bytes.
 *
 * `dir` is the path as the hook will spell it. The adapter passes the `$HOME`
 * expression unexpanded, because the host's home is unknown at projection: a host
 * whose home is longer than `$HOME` adds the difference to every skill.
 */
export function personaSkillOutputSize(dir: string, skillMd: string): number {
  return (
    BASE_DIRECTORY_LABEL.length +
    dir.length +
    '\n\n'.length +
    afterFrontMatter(skillMd).length
  );
}

/**
 * The shell command a `SessionStart` hook runs for a skill the launch hook cannot
 * carry because its output would exceed the harness's cap: it names the skill under
 * `## Required reading`, so the Skill tool loads it on demand.
 *
 * It is a HOOK and not a section of the definition on purpose. The hook fires only
 * for a `--agent` main session; a dispatched holder of the same position preloads
 * the skill through `skills` at any size, and a notice in the definition body would
 * tell that holder to load what it already holds.
 */
export function personaRequiredReadingCommand(skill: string): string {
  return [requiredReadingPrintf(skill), 'exit 0'].join('\n');
}
