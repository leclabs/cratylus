#!/usr/bin/env sh
# resume-availability-notice — a SessionStart note. Emits ONE fixed line telling
# the agent that memory skills exist and that /wake reconstitutes it.
#
# It calls NO memory verb. That is a hard requirement, not a style choice: every
# registry-touching verb registers the session, and registration is what marks a
# session as woken. A note that registered would make every session look woken
# and destroy the signal it exists to support.
#
# Reads nothing, writes nothing, derives no home. Always exits 0.

set -eu
trap 'exit 0' EXIT

printf 'MEMORY — this agent has persistent memory. /wake reconstitutes it (prior state, standing plan, continuity); /dream consolidates it. Neither runs automatically.\n'
exit 0
