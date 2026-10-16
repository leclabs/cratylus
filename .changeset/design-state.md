---
"@cratylus/runtime": minor
"cratylus": minor
---

The concept journal gives the design state alone (decision 0294). `cratylus concepts state` answers only `purpose` (and `competingPurposes` while they compete), the delivered `practice` apart, and per context its `name`, `subject`, `relation`, `competingDescriptions` only when any, `concepts`, each live concept as one line `"<name> ≜ <wording>"`, and `competing`, `[{ "name", "versions" }]`, each version such a line or `"<name> retired"`. It no longer carries the `reading` legend, decisions, `builtFrom`, reasons or recorded effort, and takes no `--history`.

`concepts overview` is gone, with its prose account, and is refused as an unknown verb; read `state` instead. `concepts design` is unchanged: each context's live concepts with their wording and `builtFrom`, and with `--history` the retired concepts and reasons.

Decisions record realization only. `concepts decide` takes no `--kind` and marks every new decision `"decisionKind": "realization"`; `concepts classify` is gone and refused as an unknown verb. Standing decisions are read with `concepts decisions` alone. `concepts leakage` inspects concept wordings, context descriptions and examples, never a decision, and takes no `--history`; `decide` never carries `warnings`.

The effort recorded for past work (`efficiency`) is read with a context's own history: `concepts history --context <name>` without a concept carries it. Entries already recorded, decisions with a kind, classifications and efficiency entries, are still read as recorded; `decisions --history` keeps each decision's `kinds`.

The journal's explanation and every verb's purpose speak of the design state: a session reads the design state of the delivered practice and of each context its work touches first, then the standing decisions its work needs.
