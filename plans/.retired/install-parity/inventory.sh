#!/usr/bin/env sh
# install-parity clean-slate INVENTORY — read-only. Prints what a clean slate would remove
# on the host it runs on. Removes nothing. Run with MODE=purge to actually remove.
#
# PRESERVED ALWAYS (never touched, by design):
#   ~/.agents/**            agent memory homes — SelfAuthored, NOT a deploy Target (MODEL.md),
#                           untracked + irrecoverable. Not deployed, not reprojected ⇒ out of scope.
#   ~/.claude/settings.json non-hook keys (permissions, env, model, …) — only OUR hook entries drop.
#   any skill/agent not in the project lists below (e.g. graphify).

set -u
MODE="${MODE:-inventory}"
C="$HOME/.claude"

OUR_AGENTS="arch-doc-writer boz developer investigator mav nico planner principal-engineer-reviewer principal-ic tester"
OUR_SKILLS="carry-on conceptualize create-agent create-skill dream elicit exemplify formalize handoff introspect materialize praxis probe signify wake memory"
OUR_HOOKS="memory-consolidation-nudge stance-guardrail stance-guardrail-pre"

echo "=== HOST $(hostname) ($MODE) ==="

echo "--- agents (~/.claude/agents) ---"
for a in $OUR_AGENTS; do
  f="$C/agents/$a.md"
  [ -e "$f" ] && { echo "  HIT  $f"; [ "$MODE" = purge ] && rm -f "$f"; }
  d="$C/agents/$a"
  [ -d "$d" ] && echo "  DIR  $d  (legacy sidecar — inspect, NOT auto-removed)"
done

echo "--- skills (~/.claude/skills) ---"
for s in $OUR_SKILLS; do
  d="$C/skills/$s"
  [ -d "$d" ] && { echo "  HIT  $d"; [ "$MODE" = purge ] && rm -rf "$d"; }
done
echo "  (retained, not ours):"
[ -d "$C/skills" ] && for d in "$C/skills"/*; do
  [ -d "$d" ] || continue
  b=$(basename "$d"); keep=1
  for s in $OUR_SKILLS; do [ "$b" = "$s" ] && keep=0; done
  [ $keep = 1 ] && echo "    KEEP $d"
done

echo "--- hooks (~/.claude/hooks) ---"
for h in $OUR_HOOKS; do
  d="$C/hooks/$h"
  [ -d "$d" ] && { echo "  HIT  $d"; [ "$MODE" = purge ] && rm -rf "$d"; }
done

echo "--- settings.json hook entries ---"
if [ -f "$C/settings.json" ]; then
  if command -v jq >/dev/null 2>&1; then
    jq -r '.hooks // {} | to_entries[] | .key as $e | .value[]? | .hooks[]? | "  HIT  \($e): \(.command)"' \
      "$C/settings.json" 2>/dev/null || echo "  (unparseable)"
    if [ "$MODE" = purge ]; then
      cp "$C/settings.json" "$C/settings.json.pre-clean-slate.bak"
      tmp=$(mktemp)
      jq 'del(.hooks)' "$C/settings.json" > "$tmp" && mv "$tmp" "$C/settings.json"
      echo "  PURGED .hooks (backup: settings.json.pre-clean-slate.bak)"
    fi
  else
    echo "  (jq absent — hooks block left for manual review)"
  fi
else
  echo "  (no settings.json)"
fi

echo "--- runtime install (npm global prefix) ---"
P=$(npm prefix -g 2>/dev/null)
if [ -n "$P" ]; then
  echo "  prefix: $P"
  for pkg in runtime memory; do
    d="$P/lib/node_modules/@leclabs/$pkg"
    [ -e "$d" ] && { echo "  HIT  $d"; [ "$MODE" = purge ] && rm -rf "$d"; }
  done
  for b in runtime forge memory; do
    f="$P/bin/$b"
    [ -e "$f" ] && { echo "  HIT  $f"; [ "$MODE" = purge ] && rm -f "$f"; }
  done
  d="$P/lib/node_modules/@leclabs"
  [ -d "$d" ] && [ -z "$(ls -A "$d" 2>/dev/null)" ] && { echo "  EMPTY $d"; [ "$MODE" = purge ] && rmdir "$d"; }
fi

echo "--- PRESERVED (untouched) ---"
[ -d "$HOME/.agents" ] && echo "  ~/.agents: $(ls -1 "$HOME/.agents" 2>/dev/null | tr '\n' ' ')"
echo "=== END $(hostname) ==="
