# flatten-skills-and-assets

**Objective.** Skills are flat source `packages/mind/skills/<slug>.md`; companion scripts composite
via **front-matter path** (`bundle:`/`assets:`), retiring the co-located dir-form cell. The nested
`<slug>/SKILL.md` remains **only** as the render target, never source.

**Preconditions.** `toolkit/flat-storage-support` landed. The memory skill already proves
front-matter bundling (`bundle: ../episodic/dist/episodic.mjs`).

**Operations.**

1. Move any dir-form skill cell to flat `skills/<slug>.md`; relocate its committed `assets:` to a
   referenced home (e.g. `skills/<slug>.assets/…`) named by front-matter path.
2. Drop the dir-form branch from `cells.py`/`resolve._stage_assets` (flat + front-matter path only).
3. Byte-identity: each skill still renders the same `SKILL.md` (+ staged assets) to `.render`.

**Artifacts.** `packages/mind/skills/*.md`, asset homes, `toolkit/{cells,resolve}.py`, `test_place.py`.

**Acceptance (blind test).** No `ideas/<slug>/<slug>.md` dir-form remains; every skill renders its
prior `SKILL.md` + assets byte-identically; `pytest toolkit/test_place.py` green.
