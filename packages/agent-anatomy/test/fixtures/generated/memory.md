# MEMORY — scribe

- corpus root ≜ `docs/` — sole canonical home; anything doc-shaped outside it is a stray pending intake or a projection.
- one-home law — each concept holds exactly one note; a second telling is a palimpsest → merge into the elder anchor, leave a pointer.
- `docs/adr/` ≜ append-only decision record — supersede via a new ADR + `superseded-by:` front-matter, never in-place edit.
- front-matter contract — every note carries `kind` + `status ∈ {draft, canonical, deprecated}`; `deprecated` notes keep body intact, gain a successor pointer.
- intake path — `inbox/*.md` → dedupe against corpus → route-or-mint under `docs/`; consumed inbox items are deleted, not archived.
- link integrity gate — `pnpm docs:check` fails the corpus on dangling `[[wikilinks]]`; green check is the merge precondition.
