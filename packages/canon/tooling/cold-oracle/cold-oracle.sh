#!/usr/bin/env bash
# cold-oracle.sh — the warm≡cold acceptance ORACLE.
#
# Computes R_cold(f): the decode of a fragment by a naive, ISOLATED LLM with ZERO
# project context. This is the party-invariant source of truth for the acceptance
# criterion  ∀f · decode_warm(f | K) ≡ R_cold(f) ≡ intent.
#
# ISOLATION IS LOAD-BEARING (the crux of this whole plan):
#   1. cwd = a fresh scratch dir OUTSIDE ~/workspaces/cratylus  → the repo's
#      CLAUDE.md / AGENTS.md / MEMORY never load (cwd-relative discovery misses them).
#   2. CLAUDE_CONFIG_DIR = a fresh dir holding ONLY .credentials.json  → the deployed
#      ~/.claude registry (agents, skills, user CLAUDE.md) never loads, so an
#      ecosystem-coined token (e.g. `principal-ic`, `signify`) decodes to its GENERIC
#      latent-prior meaning, NOT its project/registry gloss. Auth survives; context does not.
#
# A spawned SUBAGENT IS NOT COLD — it inherits the session's project context + the
# local agent-registry name-aliases. Only process-level isolation (this script) yields a
# true cold read. Never substitute a subagent for this harness.
#
# Usage:
#   cold-oracle.sh --file <path>        decode the file's contents
#   cold-oracle.sh --text '<fragment>'  decode the literal text
#   echo '<fragment>' | cold-oracle.sh  decode stdin
# Options:
#   --model <id>   model to pin (default: sonnet) — pin for reproducibility
#   --raw          emit only R_cold (no metadata banner)
set -euo pipefail

REPO_GUARD="$HOME/workspaces/cratylus"
MODEL="sonnet"
RAW=0
FRAGMENT=""
SRC=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)  FRAGMENT="$(cat "$2")"; SRC="file:$2"; shift 2 ;;
    --text)  FRAGMENT="$2"; SRC="text"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --raw)   RAW=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
if [[ -z "$FRAGMENT" ]]; then FRAGMENT="$(cat)"; SRC="stdin"; fi
if [[ -z "$FRAGMENT" ]]; then echo "empty fragment" >&2; exit 2; fi

# --- build the isolated environment -----------------------------------------
SCRATCH="$(mktemp -d /tmp/cold-oracle.XXXXXX)"
CFG="$(mktemp -d /tmp/cold-cfg.XXXXXX)"
cleanup() { rm -rf "$SCRATCH" "$CFG"; }
trap cleanup EXIT
# Pull FRESH credentials from the macOS Keychain (the authoritative live store) per
# run — the on-disk ~/.claude/.credentials.json snapshot is often expired (its
# short-lived accessToken rotates and only the keychain is kept current). Overriding
# CLAUDE_CONFIG_DIR cuts the default keychain lookup, so we must seed creds explicitly.
# Only .credentials.json lands in CFG; agents/skills/CLAUDE.md/repo stay absent → cold.
if ! security find-generic-password -s "Claude Code-credentials" -w \
     > "$CFG/.credentials.json" 2>/dev/null; then
  # fallback to the on-disk snapshot (may be stale)
  cp "$HOME/.claude/.credentials.json" "$CFG/.credentials.json"
fi
chmod 600 "$CFG/.credentials.json"

# guard: scratch must be OUTSIDE the repo (isolation invariant)
case "$SCRATCH" in
  "$REPO_GUARD"*) echo "FATAL: scratch dir inside repo — isolation would leak" >&2; exit 3 ;;
esac

# --- run the cold decode -----------------------------------------------------
# TOOL-LESS is load-bearing: R_cold decodes from the fragment's OWN signifiers
# (+ inline ≜) alone. A tool-enabled reader greps the repo and becomes warm-by-
# investigation (observed: it cited an exact repo path from /tmp). Deny the
# exploration/mutation tools so the decode is pure latent-prior, not research.
# --disallowedTools is variadic (greedy) — it would swallow a positional prompt,
# so the prompt goes via STDIN. Tool list uses only known tool names.
# Prompt is MOOD-NEUTRAL: "explain:\n\n<f>" is confounded for imperative-mood
# fragments (a skill description starting "use this skill to…" reads as a request to
# INVOKE a skill, so a naive reader hunts its skill list instead of decoding meaning —
# a false divergence). "Restate what it means" measures the fragment's meaning
# regardless of grammatical mood, without leading toward any answer. That was measured,
# not assumed: the imperative-mood confound showed up in a corpus-wide sweep.
DECODE="$(printf 'The text below is a fragment from a knowledge corpus — a definition, rule, or role description. Restate what it means in plain language:\n\n%s\n' "$FRAGMENT" | \
  (cd "$SCRATCH" && CLAUDE_CONFIG_DIR="$CFG" claude -p --model "$MODEL" \
    --disallowedTools Read Grep Glob Bash WebFetch WebSearch Task Edit Write NotebookEdit \
    2>/dev/null))"

if [[ "$RAW" -eq 1 ]]; then
  printf '%s\n' "$DECODE"
else
  cat <<EOF
=== R_cold ===================================================================
source        : $SRC
model         : $MODEL
cwd_used      : $SCRATCH   (outside repo: yes)
context_loaded: ∅   (config = credentials-only; no agents/skills/CLAUDE.md/repo)
------------------------------------------------------------------------------
$DECODE
==============================================================================
EOF
fi
