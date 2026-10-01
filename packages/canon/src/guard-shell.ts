// The shell every guard worker shares. It lives outside `hooks/` because every file there is
// loaded as a hook cell (tooling/project-targets.ts), and a fragment is not a cell.

/** The one cap on what a guard's judge is sent, in bytes: the size of what crosses to the judge.
 *  A judgement has to fit the time its harness allows a guard (omp kills an extension handler
 *  at 30 s, a Claude Code cell runs 60 s) and the text a turn or a dispatch carries has no bound. */
export const judgePayloadCapBytes = 12_000;

/** Bounds the judged text to `JUDGE_PAYLOAD_CAP` bytes. `jq` does the cutting because every
 *  worker already depends on it and it counts bytes (`utf8bytelength`), so a cut never lands
 *  inside a character. Text over its share is cut and MARKED where it was cut, so the judge
 *  cannot take the seam for the agent's own words. Written with `String.raw` so its
 *  backslashes reach the worker verbatim. */
export const judgeClipShell = String.raw`JUDGE_PAYLOAD_CAP=${judgePayloadCapBytes}
judge_bytes() { printf '%s' "$1" | wc -c | tr -d ' '; }
JUDGE_JQ='
def pre($n): . as $s | if $n <= 0 then "" else {lo: 0, hi: ($s | length)} | until(.lo >= .hi;
((.lo + .hi + 1) / 2 | floor) as $m | if ($s[:$m] | utf8bytelength) <= $n then .lo = $m else .hi = $m - 1 end) | $s[:.lo] end;
def suf($n): . as $s | if $n <= 0 then "" else {lo: 0, hi: ($s | length)} | until(.lo >= .hi;
((.lo + .hi + 1) / 2 | floor) as $m | if ($s[-$m:] | utf8bytelength) <= $n then .lo = $m else .hi = $m - 1 end)
| if .lo == 0 then "" else $s[-.lo:] end end;
'
# --rawfile, never -R: jq 1.7's raw reader corrupts a multibyte character straddling a read boundary.
judge_keep() { jq -n -j --rawfile text /dev/stdin --argjson n "$1" "$JUDGE_JQ"' $text | suf($n)'; }
judge_ends() {
jq -n -j --rawfile text /dev/stdin --argjson n "$1" "$JUDGE_JQ"'
$text | . as $s | ($s | utf8bytelength) as $t | if $t <= $n then $s else
((($n - 200) / 2) | floor) as $k | ($s | pre($k)) as $h | ($s | suf($k)) as $e
| ($t - ($h | utf8bytelength) - ($e | utf8bytelength)) as $gone
| $h + "\n[ELIDED: \($gone) of \($t) bytes from the middle are not shown]\n" + $e end'
}
judge_cut() { printf '[ELIDED: the first %s of %s bytes of %s are not shown; what follows is its final part]' "$(($2 - $3))" "$2" "$1"; }
`;

/**
 * A refusal never strands the agent: every refusal names a way on, and an agent that holds
 * one wrong contests it by stating why, the act then proceeding with the contest logged for
 * the operator.
 *
 * Interpolate AFTER the worker has defined `say` and `jq` is known to be present, and set
 * these first:
 *   GUARD_ID       the cell id (`purview-guardrail`)
 *   GUARD_NAME     what the operator reads as the guard (`PURVIEW GUARDRAIL`)
 *   GUARD_SESSION  the payload's session id, as received
 *   GUARD_AGENT    the agent the guard judges
 *   GUARD_ACT      the tool name, or `stop` at the turn end
 *   GUARD_CALL     the call's compact `tool_input` (unset at the turn end)
 *   NEUTRAL_ROOT   the `.agents` root, home of the default contest log
 *
 * It then offers `contest_heard` (call before judging: a contested fire is reported and
 * exits 0) and `contest_refused REASON` (call on a standing refusal: records REASON and
 * prints the way forward, to be placed after the judge's reason in what is returned).
 * Contest files live in `$CONTEST_DIR`, named `<key>.refused` and `<key>.contest`, `<key>`
 * being the cksum of the call's tool name and tool input, or `stop`. The functions use the
 * shell names `contest`, `refusal`, `log`, `kept` and `again`; a worker leaves them alone.
 *
 * Regular template: `\${` and `\\n` are the shell's `${` and `\n`.
 */
export const contestShell = `case "$GUARD_SESSION" in '' | */* | . | ..) GUARD_SESSION=nosession ;; esac
CONTEST_DIR="\${TMPDIR:-/tmp}/guardrail-contest/$GUARD_ID/$GUARD_SESSION"
CONTEST_AT="$CONTEST_DIR/stop"
[ "$GUARD_ACT" = stop ] || CONTEST_AT="$CONTEST_DIR/$(printf '%s %s' "$GUARD_ACT" "\${GUARD_CALL:-}" | cksum | cut -d' ' -f1)"
contest_heard() {
	contest="$(cat "$CONTEST_AT.contest" 2>/dev/null || true)"
	[ -n "$contest" ] || return 0
	refusal="$(cat "$CONTEST_AT.refused" 2>/dev/null || true)"
	rm -f "$CONTEST_AT.contest" "$CONTEST_AT.refused"
	log="\${GUARD_CONTEST_LOG:-$NEUTRAL_ROOT/guardrail/contests.log}"
	mkdir -p "$(dirname -- "$log")" 2>/dev/null && jq -cn --arg time "$(date -u +%FT%TZ)" --arg guard "$GUARD_ID" \\
		--arg session "$GUARD_SESSION" --arg agent "$GUARD_AGENT" --arg act "$GUARD_ACT" --arg refusal "$refusal" \\
		--arg contest "$contest" '$ARGS.named' 2>/dev/null >> "$log" && kept="logged in $log" || kept="the contest was not recorded: $log is not writable"
	say "$GUARD_NAME — contested: this $GUARD_ACT went through unjudged on the agent's reason: $(printf '%s' "$contest" | tr '\\n' ' ') ($kept)"
	exit 0
}
contest_refused() {
	mkdir -p "$CONTEST_DIR" 2>/dev/null && printf '%s\\n' "$1" > "$CONTEST_AT.refused" 2>/dev/null || true
	[ "$GUARD_ACT" = stop ] && again="end the turn again" || again="repeat the same call"
	printf '%s' "Act on that reason, or if you hold it wrong state why with this command, then $again; it then goes through unjudged, your reason logged for the operator: printf '%s\\\\n' 'why' > '$CONTEST_AT.contest'"
}
`;
