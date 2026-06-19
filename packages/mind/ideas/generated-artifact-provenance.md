---
kind: principle
delineation: An artifact emitted from commons cells records its source cells + version (the `GENERATED from …` header); on regen that record is the common ancestor for three-way merge.
---

# Generated Artifact Provenance

```
GENERATED from <source-cells>@<version> by <resolver>
```

- The recorded source-version is the common-ancestor primitive [[regenerate-without-clobbering]] reconciles against, now keyed to upstream cell identity across scopes ([[commons-distribution]]).
- Generalizes [[regenerate-without-clobbering]] from single-emitter (self-hash of own output) to commons-sourced (any cells, any resolver): adds _which upstream cells_ produced the artifact, so it re-resolves when the commons moves.

The header on a resolved agent archetype reads `GENERATED from packages/mind/ideas/<agent>.md by projecting its composed cells at the recorded reader profile` — reader-neutral because density is the profile's ([[reader-prior-projection]]).

## See also

- [[regenerate-without-clobbering]] — the self-hash drift net this extends with upstream source identity.
- [[commons-distribution]] — the multi-scope sync this provenance enables.
