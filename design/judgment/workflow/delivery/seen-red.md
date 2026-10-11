# Delivery journal judgment — seen red

Before-build check-writer proof only; these cases run after the build only in judgment and are absent from package test discovery.

```sh
pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/delivery/vitest.config.ts --reporter=verbose
```

Observed on 2026-10-11: **3 failed, 0 passed**.

| Example    | Check                                                                                                                      | Observed failing reason                                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| workflow/1 | `structural.test.ts`: design, state and decisions report an entirely uninterpreted journal without inventing known content | Each unscoped command exited 1, refusing `design/journal/01ARZ3NDEKTSV4RRFFQ69G5F01.json` as “not an entry of this journal”. It refused the whole journal instead of returning no known contexts/decisions together with annotation ×3 and the incompleteness report. |

The fixture contains exactly three annotation entries and no known entries. The checks require empty known content, a report associating annotation with three uninterpreted entries, and an incompleteness statement; a truly empty answer without that report cannot pass. Reading must leave every journal file unchanged. Diagnostic metadata is not mistaken for invented computed context content.

The suite uses the packed-install global setup and the existing isolated host and temporary git repository fixtures. It never touches the operator's HOME or installation, never calls a live model, and imports no runtime implementation. This is red proof of the frozen checks, not a post-build judgment or acceptance claim.
