# t-omp-persona-bootstrap

**Wave 0.** Cheap, manual, throwaway — and it gates everything after it.

## Intent

Answer one question before any adapter is written: **does an omp session carrying a cratylus
persona behave like that agent?** Hand-adapt what is already projected for Claude Code, launch
omp with it, and judge.

## Method

- Take the projected `~/.claude/agents/mav.md` and one or two skills; adapt by hand into
  `~/.omp/agent/agents/` (or `--append-system-prompt` pointing at the agent body).
- Create the launcher with omp's own mechanism rather than a hand-rolled alias:
  `omp --profile <agent> --alias omp-<agent>` generates the shortcut, and `--profile` gives
  the persona isolated auth, sessions and settings — which is closer to "a being with its own
  home" than an alias would be.
- Run real work in it. Judge against the agent's declared dimensions, not against vibes.

## Constraints

- **Hand-adapted and throwaway.** Do NOT write a forge adapter here. The point is to learn
  what an omp-shaped agent artifact must contain; building the projector first would encode
  a guess.
- **Record the delta.** What did the Claude Code artifact assume that omp does not provide,
  and vice versa? That delta is the adapter's specification and is this shard's real output.
- Judge with `/introspect` if it survives the port — comparing declared dimensions against
  what is actually in effect is exactly this question.

## Accept

1. An omp session launches carrying a cratylus persona, by a documented command.
2. A written delta: what carried, what did not, what omp offers that Claude Code does not.
3. A verdict on whether the persona is recognisably the agent — and if not, WHY, because that
   answer redirects every shard after this one.
