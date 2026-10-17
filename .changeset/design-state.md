---
"@cratylus/runtime": minor
"cratylus": minor
"@cratylus/forge": patch
---

The concept journal gives the design state alone (decision 0294). `cratylus concepts state` answers only `purpose` (and `competingPurposes` while they compete), the delivered `practice` apart, and per context its `name`, `subject`, `relation`, `competingDescriptions` only when any, `concepts`, each live concept as one line `"<name> ≜ <residue>"`, and `competing`, `[{ "name", "versions" }]`, each version such a line or `"<name> retired"`. It no longer carries the `reading` legend, decisions, `builtFrom`, reasons or recorded effort, and takes no `--history`.

`concepts overview` is gone, with its prose account, and is refused as an unknown verb; read `state` instead. `concepts design` is unchanged: each context's live concepts with their wording and `builtFrom`, and with `--history` the retired concepts and reasons.

Decisions record realization only. `concepts decide` takes no `--kind` and marks every new decision `"decisionKind": "realization"`; `concepts classify` is gone and refused as an unknown verb. Standing decisions are read with `concepts decisions` alone. `concepts leakage` inspects concept wordings, context descriptions and examples, never a decision, and takes no `--history`; `decide` never carries `warnings`.

The effort recorded for past work (`efficiency`) is read with a context's own history: `concepts history --context <name>` without a concept carries it. Entries already recorded, decisions with a kind, classifications and efficiency entries, are still read as recorded; `decisions --history` keeps each decision's `kinds`.

The journal's explanation and every verb's purpose speak of the design state: a session reads the design state of the delivered practice and of each context its work touches first, then the standing decisions its work needs.

The capabilities speak of the concepts by their established names (decision 0296). `concepts state` and `concepts design` act on the `conceptual model` (no longer `conceptual design`), and the journal's summary, `when` and the `design` purpose say conceptual model; the version skew summary, and the help of `install`, `uninstall`, `project` and `deploy`, say agent harness. The `cratylus` and `@cratylus/runtime` READMEs follow: agent harness, agent definition, code review, version history, and `design/examples/<context>/<user-story>.md`. Every verb of every capability acts on a concept live in cratylus's own journal.

The journal's explanation follows the restated concepts (decision 0296): `concepts leakage` and `concepts purpose` act on the `event-sourced conceptual model`, while the capability keeps its name, `concept journal`. The right side of `name ≜ …` is the concept's residue (decision 0302), what the concept means that its name, read in its bounded context, does not invoke and what the name invokes that the concept does not have: the journal's summary, the `state` and `leakage` purposes, the `--wording` description of `define` and `supersede`, the refusal of a missing `--wording` and both READMEs say so; the `--wording` flag and the `wording` field keep their names.
