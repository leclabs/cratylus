#!/usr/bin/env sh
# calibrate-stance-judge — measure the LIVE judge against the real payloads it once got wrong.
#
# WHY THIS IS SEPARATE FROM THE TEST SUITE. `test-stance-guardrail.sh` is hermetic: synthetic
# transcripts, a deterministic fixture judge, no network. It proves the WORKER's control flow —
# gating, extraction, loop safety, evidence verification — and it must stay fast and offline.
#
# It cannot prove anything about the RUBRIC, because the rubric is only read by an LLM. A rubric
# edit is a change to a stochastic classifier, and the only honest way to know whether an edit
# helped is to measure block rates over repeated samples on payloads with known-correct verdicts.
# Without that you are tuning a classifier by vibes — which is how this rubric drifted from the
# agents' declared `handoff` laws without anyone noticing.
#
# The fixtures are not synthetic. Each is byte-identical to a payload `stance-guardrail.sh` built
# and handed the judge at a real Stop event, and each is a collapse that SHIPPED PAST the gate.
# `expected.json` records the law each should trip and the verdict production actually returned.
#
# USAGE:  sh calibrate-stance-judge.sh [samples]        (default 5)
#         STANCE_JUDGE_CMD=<cmd> names another judge, e.g. one on omp's advisor model where `claude`
#         cannot reach its API; a judge that cannot be reached prints "could not look: <why>".
#         STANCE_RUBRIC=<path> sh calibrate-stance-judge.sh 8    (measure a candidate rubric)
#
# Exit 0 always — this REPORTS, it does not gate. A flaky classifier must not fail the build; it
# must be visible. Read the rates and decide.

set -eu

SELF_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# The repo root is ASKED FOR, never counted — see tooling/repo-root.sh. The one
# relative hop below names this file's own package, which is what a source line
# must do; everything downstream derives from the answer.
. "$SELF_DIR/../../../../tooling/src/repo-root.sh"
CANON="$(require_repo_root "$SELF_DIR")/packages/canon"
WORKERS_DIR="$CANON/targets/guardrail"
RUBRIC="${STANCE_RUBRIC:-$WORKERS_DIR/stance-judge-prompt.md}"
JUDGE="${STANCE_JUDGE_CMD:-sh $WORKERS_DIR/stance-judge.sh}"
FIXTURES="$CANON/test/fixtures/guardrail"
N="${1:-5}"

[ -d "$FIXTURES" ] || { echo "could not look: no fixtures at $FIXTURES"; exit 0; }

# A JUDGE THAT COULD NOT BE REACHED IS NOT A JUDGE THAT FOUND NOTHING. Counting an empty answer as
# "no BLOCK" would report every control clean and every fixture a MISS, so the run says it could
# not look and stops, and a caller reads that line instead of a table of zeros.
could_not_look() {
	printf '\ncould not look: %s\n' "$1"
	exit 0
}
if [ -z "${STANCE_JUDGE_CMD:-}" ] && ! command -v claude >/dev/null 2>&1; then
	could_not_look "claude is not on PATH and STANCE_JUDGE_CMD names no other judge"
fi

# One judgement: prints PASS or BLOCK, and fails when the judge gave neither.
judged() {
	_out="$($JUDGE "$RUBRIC" < "$1" 2>/dev/null)" || return 1
	_v="$(printf '%s\n' "$_out" | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
	case "$_v" in
		PASS | BLOCK) printf '%s' "$_v" ;;
		*) return 1 ;;
	esac
}

# The BLOCK tally of N judgements of one payload.
blocks_of() {
	_b=0
	_i=0
	while [ "$_i" -lt "$N" ]; do
		_v="$(judged "$1")" || could_not_look "the judge command ($JUDGE) gave no verdict for $1"
		[ "$_v" = "BLOCK" ] && _b=$((_b + 1))
		_i=$((_i + 1))
	done
	printf '%s' "$_b"
}

printf 'stance-judge calibration — %s samples/payload\n  rubric: %s\n  judge:  %s\n\n' "$N" "$RUBRIC" "$JUDGE"
printf '  %-12s %-8s %-9s %s\n' fixture expect observed law
printf '  %-12s %-8s %-9s %s\n' ------- ------ -------- ---

flips=0
misses=0
total=0
oks=0
for f in "$FIXTURES"/turn-*.txt; do
	[ -f "$f" ] || continue
	name="$(basename "$f" .txt)"
	# expected verdict + law, read out of expected.json when jq is available.
	expect=BLOCK
	law=""
	if command -v jq >/dev/null 2>&1 && [ -f "$FIXTURES/expected.json" ]; then
		expect="$(jq -r --arg n "$name.txt" '.fixtures[]|select(.file==$n)|.expect // "BLOCK"' "$FIXTURES/expected.json" 2>/dev/null || echo BLOCK)"
		law="$(jq -r --arg n "$name.txt" '.fixtures[]|select(.file==$n)|.law // ""' "$FIXTURES/expected.json" 2>/dev/null || echo '')"
	fi

	b="$(blocks_of "$f")"
	total=$((total + 1))

	# A fixture that agrees with itself every time is CALIBRATED; one that splits is a FLIP, and a
	# flip is not noise to be averaged away — it is an unreconciled boundary in the rubric, and it
	# gets named as one. Silent averaging is how turn-282 sat at 4/8 while reading as "mostly fine".
	if [ "$expect" = "BLOCK" ]; then hit=$b; else hit=$((N - b)); fi
	if [ "$hit" -eq "$N" ]; then
		mark="ok"; oks=$((oks + 1))
	elif [ "$hit" -eq 0 ]; then
		mark="MISS"; misses=$((misses + 1))
	else
		mark="FLIP"; flips=$((flips + 1))
	fi
	printf '  %-12s %-8s %-9s %s  %s\n' "$name" "$expect" "$b/$N BLOCK" "$mark" "$law"
done

# THE NEGATIVE CONTROLS: payloads a judge must NOT block, held under controls/ so the turn-*.txt
# glob above never reads them as expected-BLOCK cases. A rubric cut that made every payload
# convict would still score 6/6 above, so the controls are what keeps the table honest.
overblocks=0
controls=0
printf '\n  %-28s %-8s %-9s\n' control expect observed
printf '  %-28s %-8s %-9s\n' ------- ------ --------
for f in "$FIXTURES"/controls/*.txt; do
	[ -f "$f" ] || continue
	b="$(blocks_of "$f")"
	controls=$((controls + 1))
	overblocks=$((overblocks + b))
	if [ "$b" -eq 0 ]; then mark="ok"; else mark="OVERBLOCK"; fi
	printf '  %-28s %-8s %-9s %s\n' "$(basename "$f" .txt)" PASS "$b/$N BLOCK" "$mark"
done

printf '\n  %d/%d fixtures ok, %d flips, %d misses.\n' "$oks" "$total" "$flips" "$misses"
printf '  %d control payloads, %d of %d judgements BLOCKed (0 expected).\n' "$controls" "$overblocks" "$((controls * N))"
[ "$flips" -gt 0 ] && printf '  A FLIP is an unreconciled boundary between two rubric rules, not noise. Name it or fix it.\n'
[ "$misses" -gt 0 ] && printf '  A MISS is a rule the rubric does not encode at all.\n'
[ "$overblocks" -gt 0 ] && printf '  An OVERBLOCK is a rubric that convicts what it must pass.\n'
exit 0
