---
'cratylus': minor
'@cratylus/forge': minor
'@cratylus/runtime': minor
---

`cratylus` is one program, and its help lists every command and every capability

`cratylus --help` lists `init`, `add`, `compose`, `project`, `optimize`, `install`, `uninstall`, `deploy`, `explain` and `catalog` with `eventTap`, `design`, `plan` and `note`, each with a one-line summary, and `cratylus <command> --help` lists a command's flags with their defaults and choices. `cratylus` with no command prints that help on stderr and exits 1. `--version` and `-v` print the version of the `cratylus` package.

A word the program does not know is refused on one stderr line, `cratylus <command>: <what went wrong>; <what to do>`, naming the word, the nearest match when one is close and the `--help` to read, with exit 1 and no stack trace: an unknown command (`cratylus frobnicate`), an unknown option (`install --harnes`, and `--versoin`, which used to exit 0 and print nothing), a value outside its choices, a missing required value, an argument too many. Under `deploy --check` a usage error exits with the check's no-verdict code, not drift. `deploy --kind`, `--scope` and `--harness` (and `--harness` of `project`, `install` and `uninstall`) are checked where they are parsed and name the allowed values, so `deploy --scope porject` no longer deploys to user scope; `optimize` requires `<source>` and `--plan` at parse time.

A capability's failure carries the same prefix as every other command's: `cratylus plan assay: …`, where it was `cratylus: plan assay: …`. The program's own failure, which names no command, stays `cratylus: <message>`.

A flag that would change nothing is refused on one line instead of being accepted and dropped: `deploy --scope project --home`, `deploy --from` with all three directory flags, a directory or `--assets` flag the chosen `--kind` never reads, and `--config`, `--verbose` and `--dry-run` with `--check`.

A reader that closes the pipe ends any command quietly with its exit code: `cratylus project --verbose | head -1` no longer dies with an unhandled EPIPE.

The refusal of a verb a capability does not declare has one home, `verbOf`, in the command line's wording: the verb, the capability's verbs and `cratylus <capability> --help`. Every dispatcher, `eventTap` included, throws that text when called as a library, byte for byte what the command line prints.

The commands are documented once, in the `cratylus` README, and a test holds that reference to the help: it fails when a command or verb the help lists is missing, named twice, or named without being listed. `docs/cli/USAGE.md`, a proposal for the command surface, is deleted, so the `cratylus` README is the one reference. The forge README keeps the library material and links there; the canon README's consumer setup installs `cratylus` and imports `defineConfig` from it.

`@cratylus/forge/cli` now exports `projectorCommands`, the projector's commands as Commander commands, in place of `runCli`; `@cratylus/runtime/main` exports `capabilityCommands` in place of `runCli`. `cac` and `picocolors` are no longer dependencies; `commander` is, of `cratylus` and `@cratylus/forge`.
