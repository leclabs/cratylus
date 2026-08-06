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
#   retire <plan>       DELETE the plan dir; refuses unless terminal(P)
#
# POSIX sh, no deps beyond git/coreutils. Run from anywhere in the repo.

set -e

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
PLANS="$ROOT/plans"

die() { printf 'praxis: %s\n' "$1" >&2; exit 2; }

# AN ABSENT `plans/` IS THE EMPTY PLAN SET, NOT AN ERROR. This guard was
# `[ -d "$PLANS" ] || die`, which was true right up until the last plan retired:
# `retire` MEANS DELETE, git cannot track an empty directory, so `plans/` vanishes
# from every fresh clone the moment the set empties — and the tool that reports the
# plan set died on the state it exists to report. Measured on a cold clone:
# `praxis: no plans/ under <root>`, exit 2.
#
# Same shape as the three gates this corpus repaired the same day: a mechanism whose
# subject is the live tree breaks when the live tree empties. `cmd_status` already
# says the right thing for zero plans ("none is owed … vacuously satisfied"); it
# simply never got the chance.
#
# NOTHING REPLACES THE GUARD. Every read verb globs `"$PLANS"/*/` and skips what is
# not a directory, so an absent parent yields the empty set on its own. Every write
# verb already requires `[ -d "$PLANS/<plan>" ]`, which subsumes the parent check and
# fails with the more useful message ("no such plan: x"). Creating the directory here
# would be a mkdir no verb needs.

# done(P) at a commit — every task-file under `completed/`, and at least one.
# The shell twin of `plan-set.ts:doneAt`. A bare file in the plan dir (`PLAN.md`,
# `.bound`) has one path segment and is NOT a task-file, so it is skipped rather
# than counted against done-ness.
done_at() {
	sha="$1"
	plan="$2"
	files=$(git -C "$ROOT" ls-tree -r --name-only "$sha" -- "plans/$plan" 2>/dev/null) || return 1
	has_completed=0
	for f in $files; do
		rest=${f#"plans/$plan/"}
		[ "$rest" = "$f" ] && continue # not under this plan
		state=${rest%%/*}
		[ "$state" = "$rest" ] && continue # bare file, no state segment
		case "$state" in
		completed) has_completed=1 ;;
		pending | ready | active) return 1 ;; # a shard is still open ⇒ ¬done
		*) ;;                                 # not a state folder; ignore
		esac
	done
	[ "$has_completed" = "1" ]
}

# Any task-file still OPEN on disk. NOT `done`: `done` requires at least one COMPLETED
# task, so it is false for a plan whose deletion is merely STAGED — and a staged retirement
# must still read `landed`, because the carrier of retirement is the commit. "Has open work"
# is false for both the finished plan and the staged deletion, and true only for the case
# this repairs.
has_open() {
	p="$1"
	for s in pending ready active; do
		[ -n "$(ls -A "$p/$s" 2>/dev/null || true)" ] && return 0
	done
	return 1
}

# landing(P) — the FIRST trunk commit at which done(P) holds; prints the sha, or
# returns non-zero if P has not landed. One `git log --first-parent` folded over,
# exactly as `plan-set.ts:landing` does it. Nothing is written.
landing_of() {
	plan=$(basename "$1")
	for sha in $(git -C "$ROOT" log --first-parent --reverse --format=%H -- "plans/$plan" 2>/dev/null); do
		if done_at "$sha" "$plan"; then
			printf '%s' "$sha"
			return 0
		fi
	done
	return 1
}

# phase(P) — the readout the skill defines, from disk, never stored.
phase_of() {
	p="$1"
	[ -e "$p/.superseded-by" ] && { printf 'superseded'; return; }
	# landed(P) ⇔ landing(P) defined — COMPUTED FROM GIT, stored nowhere.
	#
	# This read a `.landed` dotfile, written by a `land` verb, and argued for it
	# on the premise that "landing is a commit relation, and a relation with no
	# on-disk carrier is not readable". THAT PREMISE IS FALSE, and
	# `toolkit/plan-set.ts` disproves it by working: `landing(P)` is the first
	# trunk commit at which every task-file sits under `completed/`, folded out
	# of one `git log --first-parent`. The cell says so outright —
	# `∀ P : stored(P) = ∅ ⟨landing ∧ retirement alike : recomputed from VCS
	# every call, written nowhere⟩` — so the dotfile was a SECOND HOME for a law
	# that already had one, and the two disagreed: `retire` refused a plan the
	# TS mechanism correctly reported as landed, because nobody had run `land`.
	#
	# A carrier that must be maintained by hand is not a readout of the world,
	# it is a claim about it that rots the moment someone forgets the verb.
	# landed ⇔ landing defined ∧ DONE NOW. `landing` is the FIRST trunk commit at which
	# done held, and it is monotone — but done is NOT absorbing: a plan that briefly
	# emptied its open states and then gained a shard has a landing commit and open work
	# at the same time. Reading landing alone reported such a plan `landed`, and since
	# `terminal ⇒ retire` is an OBLIGATION, the tool then demanded the retirement of work
	# in flight. Measured twice in one session, both times on a plan whose PLAN.md
	# declared shards that had not yet been written to a state folder.
	if landing_of "$p" >/dev/null && ! has_open "$p"; then printf 'landed'; return; fi
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
		# `∃ P ∈ Plans : ¬terminal(P) ⇒ ∃! P : bound(P)`. With no plan in scope
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

# `land` IS GONE, and its absence is the point. It existed to WRITE `.landed`, and
# a verb whose whole job is to record something derivable is an invitation to a
# second, disagreeing home — which is exactly what it became. `landing(P)` is now
# read from git wherever it is needed, so a plan is landed the moment its last
# shard reaches `completed/` and is committed, whether or not anyone remembered to
# say so. `terminal(P) ⇒ retire(P)` stays an obligation; `praxis status` reports it.

# retire — pre terminal(P), and it DELETES. There is no `.retired/` container: the
# cell only lets a plan retire once `drained(yield(P))` holds, i.e. once every intent
# the execution established is already authored into its strongest seam. An archive
# of a drained plan preserves nothing the corpus does not already hold, and git holds
# the bytes either way. The deletion is staged; committing it is what makes
# `retirement(P)` — and so `phase(P) = retired` — readable.
cmd_retire() {
	[ -n "$1" ] || die 'retire needs a plan name'
	p="$PLANS/$1"
	[ -d "$p" ] || die "no such plan: $1"
	ph=$(phase_of "$p")
	case "$ph" in
	landed | superseded) ;;
	*) die "retire(P) requires terminal(P); $1 is $ph" ;;
	esac
	rm -rf "$p"
	git add -A -- "$p" 2>/dev/null || true
	printf 'retired: %s (was %s). Deleted; git holds every byte.\n' "$1" "$ph"
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
retire) cmd_retire "$@" ;;
bind) cmd_bind "$@" ;;
elect) cmd_elect ;;
file) cmd_file "$@" ;;
frontier) cmd_frontier ;;
*) die "usage: praxis {status|bind <plan>|elect|file <plan> <symptom>|frontier|retire <plan>}" ;;
esac
