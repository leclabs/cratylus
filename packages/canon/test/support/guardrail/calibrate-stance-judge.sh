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
# agents' declared `checkIn` laws without anyone noticing.
#
# The fixtures are not synthetic. Each is byte-identical to a payload `stance-guardrail.sh` built
# and handed the judge at a real Stop event, and each is a collapse that SHIPPED PAST the gate.
# `expected.json` records the law each should trip and the verdict production actually returned.
#
# USAGE:  sh calibrate-stance-judge.sh [samples]        (default 5)
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

[ -d "$FIXTURES" ] || { echo "no fixtures at $FIXTURES"; exit 0; }
command -v claude >/dev/null 2>&1 || { echo "SKIP: claude not on PATH (calibration needs the live judge)"; exit 0; }

printf 'stance-judge calibration — %s samples/fixture\n  rubric: %s\n\n' "$N" "$RUBRIC"
printf '  %-12s %-8s %-9s %s\n' fixture expect observed law
printf '  %-12s %-8s %-9s %s\n' ------- ------ -------- ---

flips=0
misses=0
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

	b=0
	i=0
	while [ "$i" -lt "$N" ]; do
		v="$($JUDGE "$RUBRIC" < "$f" 2>/dev/null | sed -n 's/^VERDICT:[[:space:]]*//p' | head -1)"
		[ "$v" = "BLOCK" ] && b=$((b + 1))
		i=$((i + 1))
	done

	# A fixture that agrees with itself every time is CALIBRATED; one that splits is a FLIP, and a
	# flip is not noise to be averaged away — it is an unreconciled boundary in the rubric, and it
	# gets named as one. Silent averaging is how turn-282 sat at 4/8 while reading as "mostly fine".
	if [ "$expect" = "BLOCK" ]; then hit=$b; else hit=$((N - b)); fi
	if [ "$hit" -eq "$N" ]; then
		mark="ok"
	elif [ "$hit" -eq 0 ]; then
		mark="MISS"; misses=$((misses + 1))
	else
		mark="FLIP"; flips=$((flips + 1))
	fi
	printf '  %-12s %-8s %-9s %s  %s\n' "$name" "$expect" "$b/$N BLOCK" "$mark" "$law"
done

printf '\n  %d flip(s), %d miss(es).\n' "$flips" "$misses"
[ "$flips" -gt 0 ] && printf '  A FLIP is an unreconciled boundary between two rubric rules, not noise. Name it or fix it.\n'
[ "$misses" -gt 0 ] && printf '  A MISS is a rule the rubric does not encode at all.\n'
exit 0
