#!/usr/bin/env sh
# praxis — the plan-set mechanism, at the cost the laws require.
#
# WHY THIS EXISTS. The `praxis` skill declares `cost(file) < cost(fix)` and calls it
# "the load-bearing law". It is load-bearing because the failure it prevents is a
# GRADIENT, not a lapse: filing a discovered defect used to mean authoring a
# census-grounded shard, wiring the wave table, formatting and committing — ten
# minutes — while fixing the defect in front of you took two. Under that ratio every
# rule saying "file it, don't chase it" loses to arithmetic, every time. This script
# makes filing a single sub-second command so the law can actually bind.
#
# It also realizes `bound` — the plan-level commitment the skill introduces. Before
# it, the only bindable predicate was shard-level `active`, which is TRANSIENT (set by
# dispatch, cleared on completion). Wake bound on that transient, so between
# dispatches nothing was bindable and an unanchored wake was the system's normal
# resting state. `.bound` is a persistent marker; exactly one plan carries it.
#
# VERBS
#   status              the plan set: phase, shard counts, which is bound
#   bind <plan>         commit to a plan (releases any other; WIP=1 is enforced here)
#   elect               print the plan the election order picks, bind nothing
#   file <plan> <symptom>...   stub a pending shard; no census, no re-slice, no re-mirror
#   frontier            the shards workable right now in the bound plan
#   land <plan>         record landing(P) — the carrier that makes `terminal` readable
#   retire <plan>       relocate under .retired/; refuses unless terminal(P)
#
# POSIX sh, no deps beyond git/coreutils. Run from anywhere in the repo.

set -e

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
PLANS="$ROOT/plans"

die() { printf 'praxis: %s\n' "$1" >&2; exit 2; }
[ -d "$PLANS" ] || die "no plans/ under $ROOT"

# phase(P) — the readout the skill defines, from disk, never stored.
phase_of() {
	p="$1"
	[ -e "$p/.superseded-by" ] && { printf 'superseded'; return; }
	# landed(P) ⇔ landing(P) defined. `landing` is a commit relation, and a
	# relation with no on-disk carrier is not readable — which is why this
	# readout could previously only ever say proposed or in-flight. `.landed`
	# is that carrier, exactly parallel to `.superseded-by`, and it is what
	# makes `terminal(P) ⇒ retire(P)` mechanically checkable instead of a rule
	# someone has to remember.
	[ -e "$p/.landed" ] && { printf 'landed'; return; }
	# dispatched(P) ⇔ ∃ t : state(t) ∈ {active, completed}. Test each folder alone:
	# `ls -A a b` prints "a:" headers, so a two-arg test reads empty dirs as non-empty.
	if [ -n "$(ls -A "$p/active" 2>/dev/null || true)" ] ||
		[ -n "$(ls -A "$p/completed" 2>/dev/null || true)" ]; then
		printf 'in-flight'
	else
		printf 'proposed'
	fi
}

count() { ls -A "$1" 2>/dev/null | grep -c . || true; }

bound_plan() {
	for p in "$PLANS"/*/; do
		[ -e "$p.bound" ] && { basename "$p"; return; }
	done
}

cmd_status() {
	b=$(bound_plan || true)
	printf '%-28s %-11s %s\n' PLAN PHASE 'pending/ready/active/completed'
	for p in "$PLANS"/*/; do
		# An unmatched glob stays literal in sh, so an empty plan set would print a
		# phantom `*` row. Skip it — reporting a plan that does not exist is worse
		# than reporting none.
		[ -d "$p" ] || continue
		n=$(basename "$p")
		mark=' '
		[ "$n" = "$b" ] && mark='*'
		printf '%s%-27s %-11s %s/%s/%s/%s\n' "$mark" "$n" "$(phase_of "$p")" \
			"$(count "$p/pending")" "$(count "$p/ready")" "$(count "$p/active")" "$(count "$p/completed")"
	done
	printf '\n'
	if [ -n "$b" ]; then
		printf 'bound: %s\n' "$b"
	elif [ -n "$(cmd_elect)" ] || [ -n "$(ls -d "$PLANS"/*/ 2>/dev/null)" ]; then
		printf 'bound: NONE — the always-bind law is violated; run `praxis elect` then `praxis bind <plan>`.\n'
	else
		# `∃ P : inscope(P) ∧ ¬terminal(P) ⇒ ∃! P : bound(P)`. With no plan in scope
		# the antecedent is FALSE, so the law is SATISFIED, not violated. Reporting a
		# violation here would train the reader to ignore the real one.
		printf 'bound: none — and none is owed: the plan set is empty, so always-bind is vacuously satisfied.\n'
	fi
}

# elect — in-flight ≻ gating ≻ operator-intent. This script can decide the first key
# mechanically; `gating` needs R across plans and `operator-intent` is not on disk, so
# it prints the in-flight candidates and defers the rest rather than guessing.
cmd_elect() {
	for p in "$PLANS"/*/; do
		[ "$(phase_of "$p")" = 'in-flight' ] && basename "$p"
	done
}

cmd_bind() {
	[ -n "$1" ] || die 'bind needs a plan name'
	[ -d "$PLANS/$1" ] || die "no such plan: $1"
	# WIP=1 — releasing the incumbent is the mechanism, not a courtesy.
	for p in "$PLANS"/*/; do
		[ -e "$p.bound" ] && rm -f "$p.bound"
	done
	date -u +%Y-%m-%dT%H:%M:%SZ > "$PLANS/$1/.bound"
	printf 'bound: %s\n' "$1"
}

# land — record landing(P). `terminal(P) ⇒ retire(P)` is an OBLIGATION in the
# cell, so landing a plan tells you immediately that a retire is owed.
cmd_land() {
	[ -n "$1" ] || die 'land needs a plan name'
	[ -d "$PLANS/$1" ] || die "no such plan: $1"
	done_count=$(count "$PLANS/$1/pending")
	done_count=$((done_count + $(count "$PLANS/$1/ready") + $(count "$PLANS/$1/active")))
	[ "$done_count" = "0" ] || printf 'warning: %s has %s unfinished shard(s); landing anyway\n' "$1" "$done_count" >&2
	git rev-parse HEAD > "$PLANS/$1/.landed" 2>/dev/null || printf 'unknown\n' > "$PLANS/$1/.landed"
	printf 'landed: %s at %s\n' "$1" "$(cut -c1-8 < "$PLANS/$1/.landed")"
	printf '  terminal(P) ⇒ retire(P) — run `praxis retire %s` to discharge it.\n' "$1"
}

# retire — pre terminal(P). The precondition is now checkable, which is the point.
cmd_retire() {
	[ -n "$1" ] || die 'retire needs a plan name'
	p="$PLANS/$1"
	[ -d "$p" ] || die "no such plan: $1"
	ph=$(phase_of "$p")
	case "$ph" in
	landed | superseded) ;;
	*) die "retire(P) requires terminal(P); $1 is $ph" ;;
	esac
	mkdir -p "$PLANS/.retired"
	rm -f "$p/.bound"
	git mv "$p" "$PLANS/.retired/$1" 2>/dev/null || mv "$p" "$PLANS/.retired/$1"
	printf 'retired: %s (was %s)\n' "$1" "$ph"
}

cmd_frontier() {
	b=$(bound_plan || true)
	[ -n "$b" ] || die 'no bound plan'
	for s in active ready; do
		for f in "$PLANS/$b/$s"/*; do
			[ -e "$f" ] && printf '%-9s %s\n' "$s" "$(basename "$f")"
		done
	done
}

# file — the whole point. A stub carries symptom, locus and provenance and NOTHING
# else: census, slicing and the mirror are deliberately not done here, because doing
# them is what made filing lose to fixing.
cmd_file() {
	plan="$1"; shift || true
	[ -n "$plan" ] || die 'file needs a plan name'
	[ -d "$PLANS/$plan" ] || die "no such plan: $plan"
	sym="$*"
	[ -n "$sym" ] || die 'file needs a symptom'
	mkdir -p "$PLANS/$plan/pending"
	slug=$(printf '%s' "$sym" | tr '[:upper:]' '[:lower:]' \
		| sed -e 's/[^a-z0-9]\{1,\}/-/g' -e 's/^-//' -e 's/-$//' | cut -c1-48)
	f="$PLANS/$plan/pending/x-$slug.md"
	i=2
	while [ -e "$f" ]; do f="$PLANS/$plan/pending/x-$slug-$i.md"; i=$((i + 1)); done
	{
		printf '# %s\n\n' "$sym"
		printf '> FILED, not specified. A stub: symptom + locus + provenance, no census, no\n'
		printf '> acceptance. It exists so the defect was not chased when it was found. Whoever\n'
		printf '> promotes it to `ready` owes it a real spec (`/praxis upsert`).\n\n'
		printf '**Symptom.** %s\n\n' "$sym"
		printf '**Locus.** _(unfilled — the filer may not have known)_\n\n'
		printf '**Provenance.** Filed %s from `%s`' "$(date -u +%Y-%m-%d)" "$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
		[ -n "$PRAXIS_WHILE" ] && printf ', while executing `%s`' "$PRAXIS_WHILE"
		printf '.\n'
	} > "$f"
	printf '%s\n' "${f#"$ROOT"/}"
}

verb="${1:-status}"
[ $# -gt 0 ] && shift
case "$verb" in
status) cmd_status ;;
land) cmd_land "$@" ;;
retire) cmd_retire "$@" ;;
bind) cmd_bind "$@" ;;
elect) cmd_elect ;;
file) cmd_file "$@" ;;
frontier) cmd_frontier ;;
*) die "usage: praxis {status|bind <plan>|elect|file <plan> <symptom>|frontier|land <plan>|retire <plan>}" ;;
esac
