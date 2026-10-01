---
'@cratylus/forge': patch
'cratylus': patch
---

`install`, `uninstall` and `deploy` now place and remove Claude Code's files where Claude Code reads them. Claude Code reads its settings, agents, skills and hooks from `$CLAUDE_CONFIG_DIR` when that is set, and from `~/.claude` otherwise; cratylus put them under `~/.claude` whatever the environment, so with the variable set a session ran whatever hooks and status line sat in the real home, not the deployed ones. Given no `--home`, a run for Claude Code now uses `$CLAUDE_CONFIG_DIR` when it is set and not empty, and `~/.claude` otherwise. A `--home` given still means `<home>/.claude`, and omp is unchanged.

Every command the Claude Code adapter writes into `settings.json` (the guard hook commands, the persona status line, and the hook that prints a persona's skills into a `--agent` session) now resolves that directory when Claude Code runs it, the way Claude Code does: `$CLAUDE_CONFIG_DIR` when set, else `$HOME/.claude`. The size of the skills hook, which `install` weighs against the cap on what one hook may print, is that of the directory the hook will print. The variable's name is declared on the Claude Code adapter beside its `home` (`HarnessAdapter.homeEnv`), and the deploy engine reads it from there.

A host installed before this change uninstalls as before: uninstall removes the hook commands and status line its deploy record holds, as they were written.

Running `install` again over a host installed before this change converges: the status line command that host's deploy record says install placed is install's own, and becomes the current worker command in place, over the same host command if it wrapped one, where it used to be taken for the host's and wrapped, leaving a command that failed once uninstall removed the worker.
