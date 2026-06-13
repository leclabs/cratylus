---
kind: principle
delineation: An artifact emitted from commons cells records its source cells + version (the `GENERATED from …` header); on regen that record is the common ancestor for three-way merge.
---

# Generated Artifact Provenance

An artifact emitted by resolving commons cells must **record what it was generated from** — the source cells and their version — as a header on the artifact:

```
GENERATED from <source-cells>@<version> by <resolver>
```

- **Provenance makes regen safe across the commons boundary.** [[regenerate-without-clobbering]] hashes an emitter's own last output to detect hand-edits; provenance adds _which upstream cells_ produced it, so a downstream artifact can be re-resolved when the commons moves.
- **The record is the merge ancestor.** When both the upstream cell and the downstream artifact have changed, the recorded source-version is the common ancestor for a three-way merge ([[commons-distribution]]).
- **It generalizes regeneration** from single-emitter (its own output) to commons-sourced (any cells, any resolver).

This is the header carried by a resolved agent archetype (`GENERATED from packages/mind/ideas/<agent>.md by projecting its composed cells at the recorded reader profile`) — the wording is reader-neutral because the projection density is the profile's, not the operation's ([[reader-prior-projection]]).

## See also

- [[regenerate-without-clobbering]] — the self-hash drift net this extends with upstream source identity.
- [[commons-distribution]] — the multi-scope sync this provenance enables.
