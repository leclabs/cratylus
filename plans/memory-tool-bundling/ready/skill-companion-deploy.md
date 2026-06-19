# skill-companion-deploy

**Owner.** Mav. **Deps.** none. **State: READY.**

**What.** Teach the mind toolkit to deploy a skill's *companion assets* (scripts/binaries
beside its `SKILL.md`), so a skill's runtime arm can ride along to every host. This is a
general capability — `episodic` is its first consumer, but any skill gains it.

**Why it's needed.** Today a skill is a flat cell `ideas/<name>.md` and the placers copy
**only** `<name>/SKILL.md` (`place/local.py`, `place/ssh.py`). Sibling files do not deploy.
The render pipeline already emits dir-per-skill (`resolve.py` → `.render/skills/<name>/`), so
the output shape is already a directory — only the *input* (cell reader) and the *placers*
are flat-bound.

**Scope — 3 sites (Nico R1: promote-to-dir, on-demand).**
- `core/cells.py` reader — accept a cell as `ideas/<slug>.md` **or** dir-form `ideas/<slug>/`
  (body cell within, siblings = companion assets). `slugs_of_kind` / `glob` extend to
  "stems of files-or-dirs". Flat cells with no assets stay flat — no mass migration.
- `place/local.py` `place_skills()` — copy declared companion assets into
  `<claude>/skills/<name>/`, not just `SKILL.md`.
- `place/ssh.py` `place_skills()` — same, server-side (scp the assets).
- Define the **host base-path convention** for invoking a bundled asset: a deployed skill's
  dir is `~/.claude/skills/<name>/`; consumers invoke `node ~/.claude/skills/<name>/<asset>`.

**Design note.** Decide companion-asset selection: whole-dir copy vs an explicit asset
manifest in the cell front-matter. Lean: explicit declaration (front-matter `assets:` list)
so the cell names what it ships — keeps deploy auditable and avoids sweeping stray files.
Resolve during build.

**Exit criteria.**
- A fixture skill carrying a companion file deploys that file to both a local `.claude/` root
  and an ssh target; the asset is invocable at the documented host path.
- **Golden master:** the 11 existing (flat, asset-less) skills deploy byte-identical — `diff`
  the rendered + placed `SKILL.md` set before/after = ZERO.
- Full toolkit test suite green (incl. a new test for companion-asset deploy); `verify.py`
  PASS.
