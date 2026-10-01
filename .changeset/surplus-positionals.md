---
"@cratylus/runtime": patch
"cratylus": patch
---

A `design`, `note`, `plan` or `eventTap` verb no longer drops a word it does not take: a second positional where the verb declares one, any positional where it declares none, is refused before the verb acts, in one line naming the word, the verb's usage and its `--help`, together with any flag the verb does not take. Nothing is written.
