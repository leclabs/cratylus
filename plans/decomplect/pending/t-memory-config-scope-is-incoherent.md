# The memory node-config is fleet-global in content and cwd-local in resolution

> Found 2026-08-05 during the dotfile derivation. A real bug, not a naming question — filed
> separately so the rename is not held hostage to it.

## Two defects, one file

**1. Resolution cannot reach the content.** `memory.scopeMarkers` govern walks _anywhere_ and
`host.<name>.homedir` is a fleet fact — but resolution is `existsSync(CONFIG_FILE)` against the bare
cwd, with **no `~` fallback**. Run the tool from any other directory and the markers silently vanish;
nothing reports it. `audit.test.ts:294` already exercises a `$HOME`-located config that
`resolveConfigPath` **cannot find**.

**2. Two scopes in one file.** `audit.ts:354-360` reads a _third_ meaning: the file's **presence**
asserts _"this directory is a repo, and its key is the basename."_ Presence-as-repo-marker and
content-as-fleet-facts are different concerns sharing one artifact — and that conflation is what made
_"whose config is it?"_ feel undecidable in the first place.

## Also here

`audit.ts:358` cites `docs/cratylus-config-schema.md`, which **does not exist** — a second confirmed
instance of the uncovered source-comment-path property the census recorded.

## Acceptance

- Resolution reaches every location the content claims to govern, or the content is narrowed to what
  cwd-local resolution can honestly serve. **State which before changing either.**
- Presence-as-marker and content-as-facts are separated, or the file documents that it is both.
- The dead citation resolves or goes.
- A test convicts the silent-vanish case: markers configured in `$HOME`, tool run elsewhere.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** host-and-config · **wave** 1
- **depends on** `t-config-dotfile-was-shipped-underived`
- **writes** `packages/memory/src/audit.ts`
- **compiles against** `packages/memory/src/node.ts`
- **evidence** `packages/memory/src/audit.ts` · `packages/memory/src/node.ts`
- **dispatchable** no ruling owed
