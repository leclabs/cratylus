---
"@cratylus/runtime": minor
"cratylus": minor
---

An unknown flag on `eventTap` is refused, and nothing is written

Each `eventTap` verb declares, beside the verb, the flags it takes: `install`
takes `--events`, `--sink` and `--settings`; `uninstall`, `read` and `status`
take `--settings`. A flag the verb does not take used to be dropped without a
word, so `eventTap install --evnets turn.end` failed only on the missing
`--events`, and `eventTap status --sink x` ran as if the flag were not there.
Each such flag, and a single-dash token such as `-x`, is now refused through
`@cratylus/runtime/verb-flags` before the verb acts: before the host config is
read, and before any settings file or sink is touched, so the call exits `1`
whether or not the host is configured. The refusal names every such flag as
given, the verb's nearest flag to each when one is close, and every flag the
verb takes.

`eventTap` now reads `--flag=value` as `--flag value`, as `design`, `plan` and
`note` do: `install --events=turn.end` used to fail for want of `--events`, and
now installs. An undeclared `--evnets=turn.end` is refused as `--evnets`.
