---
'@cratylus/runtime': minor
'cratylus': minor
---

The concept journal and the work package ledger can now be read by a runtime older than the entries they hold. An entry of a kind the runtime does not know (one written by a newer runtime) is skipped instead of refusing the whole ledger. So is a journal entry of a known kind holding a value the runtime does not know: a newer decision status (`decide` with `status: deferred`), or a newer decision kind on `decide` or `classify` (`decisionKind: policy`). Every reading is worked out from the remaining entries as before: the journal's `concepts overview`, `state`, `design`, `history`, `decisions` and `leakage`, and the ledger's `workPackage state`, `inventory`, `assignment`, `levels`, `history` and `efficiency`. Its answer then also carries `uninterpreted`, with:

- `kinds`: each skipped kind with how many entries of it were skipped;
- `values`: present when an entry was skipped for a value; for each `<kind>.<field>`, every value not known with how many entries hold it;
- `mayBeIncomplete: true`;
- `reading`: a sentence saying how the reading was made.

For example: `{ "kinds": { "annotation": 2, "decide": 1 }, "values": { "decide.status": { "deferred": 1 } }, "mayBeIncomplete": true, "reading": "…" }`. `concepts overview` also reads the ledger for the cuts in flight, so its report counts what it skipped in both. When the post-commit completion check warns that a cut is not complete, its warning also names each ledger kind it skipped.

Appending still works on such a journal or ledger, and no existing entry is rewritten or removed. The new entry's id is minted after the last entry, whatever its kind. A ledger append is still refused when its transition is already recorded, even by an entry of an unknown kind. The work package capability's `record` reads and appends the journal the same way.

A known journal entry the runtime cannot read is still refused, and the refusal names the entry's file and the fields that are wrong. One example is a `define` entry missing its `wording`. A file whose id doesn't match its name, or that names no kind, is still not an entry of the journal or ledger and is refused. A journal or ledger holding only what the runtime knows carries no `uninterpreted` report, and reading never appends.

The concept journal's explanation now says only when to use it. How a reading treats entries it can't interpret is stated in the reading's own answer, in `uninterpreted.reading`.

`@cratylus/runtime`: `cutView` also returns `readPast`, the ledger entries it skipped. `cutsInLedger` returns `{ cuts, readPast }` where it returned the list of cuts.
