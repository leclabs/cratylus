---
'@cratylus/runtime': minor
'cratylus': minor
---

The concept journal can now be read by a runtime older than the entries it holds. An entry of a kind the runtime does not know (one written by a newer runtime) is skipped instead of refusing the whole journal. Every reading (`concepts overview`, `state`, `design`, `history`, `decisions` and `leakage`) is worked out from the remaining entries as before. Its answer then also carries `uninterpreted`: each unknown kind with how many entries of it were skipped, and `mayBeIncomplete: true`. For example: `{ "kinds": { "annotation": 2, "review": 1 }, "mayBeIncomplete": true }`.

Appending still works on such a journal. The new entry's id is minted after the journal's last entry, whatever its kind, and no existing entry is rewritten or removed. The work package capability's `record` reads and appends the same way.

A known entry the runtime cannot read is still refused, and the refusal names the entry's file and the fields that are wrong. One example is a `define` entry missing its `wording`. Each known kind now has a declared shape that every entry of that kind must match. A file whose id doesn't match its name, or that names no kind, is still not an entry of the journal and is refused. A journal of known kinds only carries no `uninterpreted` report, and reading never appends. The capability's explanation states this once, in what it says about when to use it.
