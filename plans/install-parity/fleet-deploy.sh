#!/usr/bin/env sh
# fleet-deploy.sh — the consumer-path fleet deploy, run ON each leclabs host.
#
# PROVENANCE: hand-rolled in /tmp during the install-parity session (2026-07-23/24) and
# rescued into source so the workflow is not lost. This is the PRAGMATIC fleet form of the
# consumer path: pack the packages centrally, ship the tarballs, then on each host run the
# REAL consumer sequence (npm install -> init -> project -> deploy) with no monorepo present.
# It is the concrete replacement for runtime-install.ts's retired scp path; first-classing
# it as an `agent-forge fleet-deploy` command is the open distribution tail (DESIGN §4).
#
# TWO LESSONS BAKED IN (do not remove): (1) a stale bin symlink from a prior layout makes
# npm abort the whole install with EEXIST, so clear our own footprint FIRST. (2) a mise/asdf
# reshim taints npm's exit code even when the install landed, so the success oracle is
# artifact RESOLVABILITY, never rc (documented in runtime-install.ts).
#
# USAGE: ship this + the packed .tgz files to $HOME/.agent-tars on each host, then run it
# through the host's INTERACTIVE shell so mise is sourced:
#   scp fleet-deploy.sh <pkgs>.tgz host:~/.agent-tars/
#   ssh host "${SHELL:-zsh} -ic 'sh ~/.agent-tars/fleet-deploy.sh'"

# NO `set -e`: rc is tainted by a mise/asdf reshim (LESSON 2 above) — the
# success oracle is artifact RESOLVABILITY, not rc.
T="$HOME/.agent-tars"; S="$HOME/.agent-site"
# Idempotency: a bin symlink left by an earlier layout (when agent-runtime owned
# the bin) makes npm abort the whole install with EEXIST rather than replace it.
# Clear our own footprint first so a re-run is never blocked by its predecessor.
P="$(npm prefix -g 2>/dev/null)"
if [ -n "$P" ]; then
  rm -f "$P/bin/agent-runtime" "$P/bin/agent-forge" "$P/bin/memory"
  rm -rf "$P/lib/node_modules/@leclabs"
fi
npm install -g "$T/leclabs-agent-runtime-0.0.0.tgz" "$T/leclabs-agent-memory-0.0.0.tgz" "$T/leclabs-agent-cli-0.0.0.tgz" >/dev/null 2>&1
command -v agent-runtime >/dev/null 2>&1 || { echo "FAIL: agent-runtime not on PATH"; exit 1; }

rm -rf "$S"; mkdir -p "$S"; cd "$S" || exit 1
printf '{"name":"agent-site","private":true,"version":"1.0.0"}\n' > package.json
npm install --no-audit --no-fund "$T/leclabs-agent-runtime-0.0.0.tgz" "$T/leclabs-agent-memory-0.0.0.tgz" "$T/leclabs-agent-forge-0.0.0.tgz" "$T/leclabs-agent-canon-0.0.0.tgz" >/dev/null 2>&1
[ -x node_modules/.bin/agent-forge ] || { echo "FAIL: agent-forge not installed"; exit 1; }
PATH="$S/node_modules/.bin:$PATH"; export PATH

agent-forge init >/dev/null 2>&1
agent-forge project >/dev/null 2>&1
[ -d .render/agents ] || { echo "FAIL: no render tree"; exit 1; }
agent-forge deploy --agents-dir .render/agents --skills-dir .render/skills --hooks-dir .render --no-runtime-install >/dev/null 2>&1

printf 'agents=%s skills=%s hooks=%s runtime=%s shim=%s\n' \
  "$(ls "$HOME"/.claude/agents/*.md 2>/dev/null|wc -l|tr -d ' ')" \
  "$(ls -d "$HOME"/.claude/skills/*/ 2>/dev/null|wc -l|tr -d ' ')" \
  "$(ls -d "$HOME"/.claude/hooks/*/ 2>/dev/null|wc -l|tr -d ' ')" \
  "$(command -v agent-runtime >/dev/null 2>&1 && echo yes || echo no)" \
  "$(agent-runtime memory home --name nico >/dev/null 2>&1 && echo ok || echo broken)"
