---
"@cratylus/runtime": minor
"cratylus": minor
---

A note may block a concept

`note capture` and `note revise` take a concept for `--blocks` beside a plan
and a unit. It is written `concept <anchor>`, or bare by its anchor where no
plan or unit holds that name. A name no plan, unit or concept holds is refused
naming all three. `note show` and `plan show` print such a note among the owed
rulings with the concept as `concept <anchor>`, and `plan show <plan>` lists it
when the concept is in the closure of a concept the plan realizes.

A live note blocking a concept is an owed ruling that holds new planning on
it. `plan bind` refuses a plan that realizes a concept whose closure contains
it, and `plan add` refuses a unit that realizes such a concept. Each refusal
names the note and the concept. A unit authored before the note keeps its
readiness and its place on the frontier. Retracting the note, or revising it
to block nothing, lifts the refusals. A note blocking a concept outside a
plan's closure refuses neither.
