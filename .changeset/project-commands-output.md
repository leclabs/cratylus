---
"@cratylus/forge": minor
---

`init`, `add`, `compose`, `project`, `explain`, `catalog` and `optimize` speak in the same register as `install`, `uninstall` and `deploy`, and the project commands stop failing in ways a consumer cannot act on.

- `init` scaffolds a config that imports `defineConfig` from `cratylus`, not from `@cratylus/forge/config`, which a consumer does not have. The scaffold no longer says `forge`, and `init` prints what to install for the config to load: `npm i -D cratylus @cratylus/canon`.
- A config that imports a package that is not installed fails every command that loads it, `compose`, `project`, `explain` and `catalog` among them, with one stderr line that names the package and the install command. `project` used to die with a 19-line stack trace. A harness `project` does not know, and a config that extends nothing, are reported the same way.
- `project` writes to `.cratylus/<harness>` by default, the tree `deploy` reads, so `cratylus project` then `cratylus deploy` works. It was `.render`, which `deploy` refused. It prints one summary line and the next step; the `EMIT` line for every file is behind a new `--verbose`. When `--out` names another directory, the next step is `cratylus deploy --from <dir>`.
- `compose` loses `--dry-run`, which did nothing but hide a stale note, and the note. `compose`, `explain` and `catalog` print their results with no header and no blank lines, one fact to a line; `compose` prints one resolved fragment per line. `explain` no longer prints its forward-seam notes, and an `[agent]` filter that matches nothing is a warning on stderr.
- `catalog <agent> --corpus <dir>` fails, saying `<agent>` is not used with `--corpus`, instead of ignoring it. The same goes for an `<agent>` given where the corpus census is the fallback.
- `optimize` failures are one stderr line each, and its written files are listed only under a new `--verbose`. The commands name themselves `cratylus`, not `forge`, in everything they print. `add` advises `cratylus compose` rather than the removed `--dry-run`.
- No glyphs or colour in results. Colour marks only the prefix of a failure or warning, decided per stream.
