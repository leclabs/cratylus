# Delivery journal checks — seen red

The checks execute the packed, npm-installed `cratylus` command, reached through the existing capability-port `host()` fixture. HOME is temporary. Each journal is a fresh temporary git repository; direct entry files stand for a newer writer. No production code was changed and no model was run.

## Commands

```sh
pnpm --filter cratylus exec vitest run test/delivery-journal/structural.test.ts --reporter=verbose
```

Observed before the build on 2026-10-11: **11 failed, 2 passed**. This was the full set before adding the report-checker proof below. Every failure was an assertion over command behavior, not a fixture setup failure. The known-only scenario passed, establishing that the direct-written known entries are readable.

| Example    | Check in `structural.test.ts`                                                                             | Observed failing reason                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| workflow/1 | `design` and `history` read past an unknown entry                                                         | Both commands exited 1, refusing unknown entry `01ARZ3NDEKTSV4RRFFQ69G5F04.json` as “not an entry of this journal”, instead of returning the later known version and reporting the unknown entry.                                                                                                                                                                                                                                            |
| workflow/2 | Each of overview, state, design, concept history, context history, decisions and leakage, requested twice | All fourteen requests exited 1 on unknown entry `01ARZ3NDEKTSV4RRFFQ69G5F02.json`. Each view refused the journal rather than computing its known entries and reporting annotation ×2, review ×1, and incompleteness. Both requests are made before assertions; one refusal cannot prevent the repeat from running.                                                                                                                           |
| workflow/3 | Append preserves every old byte and the next view reports unknown entries                                 | `concepts define receipt` exited 1 on unknown entry `01ARZ3NDEKTSV4RRFFQ69G5F04.json`. The existing-file byte comparison passed, but the required append was forbidden because the unknown entry was present.                                                                                                                                                                                                                                |
| workflow/4 | Malformed known entry is refused by identity                                                              | The refusal named unknown entry `01ARZ3NDEKTSV4RRFFQ69G5F02`, not malformed known define entry `01ARZ3NDEKTSV4RRFFQ69G5F04`. The assertion requiring the malformed entry's identity failed.                                                                                                                                                                                                                                                  |
| workflow/5 | Understood journals retain meanings and histories without warnings or writes                              | Today's command satisfies the scenario. The companion negative-recording check observed assertion failures for a stale meaning, reversed concept history, reversed context history, unaccepted decision, a false unknown/incomplete report, and an appended file during reading. It uses the same `assertKnownViews` and snapshot equality assertions as the scenario; each negative must throw, and the actual known-only output must pass. |

## Report-checker proof

```sh
pnpm --filter cratylus exec vitest run test/delivery-journal/structural.test.ts -t 'report assertions' --reporter=verbose
```

Observed: **1 passed, 13 skipped**. The assertion helper accepted equivalent keyed-map, record-list and prose reports with different field names, and an incompleteness statement expressed as text or a true incompleteness flag. It threw on each negative: missing incompleteness, counting only one annotation, omitting review, and swapped annotation/review counts. No report field name is fixed by these checks.

The final checks retain the observed failing command assertions. Post-proof refinements only avoid constraining diagnostic metadata: ordinary-view comparisons select established view data, and invention checks inspect computed content rather than the unknown-entry report.

## Frozen coverage

- workflow/1: later known design, both ordered known versions and reasons, count and incomplete report, no invented computed meaning.
- workflow/2: all seven views, both requests, all known content, both unknown-kind counts, incomplete report, no writes.
- workflow/3: append succeeds, exactly one new entry, every pre-existing file byte-identical, next design includes both old and new concepts and still reports the unknown entry.
- workflow/4: unsuccessful read identifies the malformed known entry, not merely the unknown entry; no writes.
- workflow/5: current context and concept, ordered context and concept histories, accepted decision, no unknown/incomplete warning, journal unchanged while reading; negative variants prove the assertions can fail.

After the build, run the first command against freshly built package artifacts. This evidence claims no post-build pass and no whole-check run.
