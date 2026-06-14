# koine-core — agent conventions

`@leclabs/koine-core`: the canonical **IR**, the **engine**, runtime validators, serializers, and the
**Adapter contract**. No dependency on any sibling package — `adapters` and `cli` depend on it, not the
reverse. A community adapter author needs only this package.

The public surface is re-exported from `src/index.ts`: `ir/` (types, schemas, validator),
`engine/`, `serialize/`, `adapter/types`.

## Schema is the source of truth

The IR's TypeScript types in **`src/ir/generated.ts` are generated** from the JSON Schema in
`schema/*.schema.json` via `pnpm gen` (`scripts/generate-types.ts`). **Never hand-edit `generated.ts`** —
change the schema and regenerate. The eight resource schemas (`rule`, `skill`, `command`, `agent`, `hook`,
`mcp-server`, `permissions`, `env`) plus `ir` and `manifest` are the canonical config surface; runtime
validation (`validateIR`, `validateHook`, …) checks values against them and `formatErrors` renders the
failures.

## The engine (`src/engine/`)

The orchestration layer adapters plug into — pure functions over the filesystem:

- `paths.ts` — resolves the `.koine/` home per scope (`IR_DIRNAME = '.koine'`; user → `~/.koine/`,
  project → walk up to nearest `.koine/`, local → `<root>/.koine/local/`).
- `io.ts` — `readIR` / `writeIR` (load + persist the authored IR).
- `merge.ts` — `mergeIR` (combine partial IRs, e.g. on `import --merge`, ours-wins on conflict).
- `compile.ts` — `compile(ir, adapters, scope, cwd, opts)`: drive each adapter's `write`, aggregate the
  `WriteReport`s, honor `dryRun` / `strict` / `explain`.
- `drift.ts` — `recordCompileState` / `detectDrift` / `hashFile`: detect hand-edits to emitted files since
  last compile (state recorded under `.koine/`).
- `migrate.ts` — `migrate` / `registerMigration` / `listMigrations`: versioned IR schema migrations.
- `frontmatter.ts` — `parseFrontmatter` / `serializeFrontmatter` (YAML frontmatter ↔ object).

## Serializers (`src/serialize/`)

Markdown+frontmatter round-trip for the document-shaped resources: `parse*`/`serialize*` for `rule`,
`skill`, `command`, `agent`, `hook`. **Round-trip fidelity is the contract** — `parse(serialize(x))`
must equal `x`; the serializer tests guard it.

## The Adapter contract (`src/adapter/types.ts`)

```ts
interface Adapter {
  id: string;
  capabilities: AdapterCapabilities; // declared per-resource + per-event support
  eventMap?: EventMap;
  detect(scope, cwd): Promise<boolean>;
  read(scope, cwd): Promise<Partial<IR>>;
  write(ir, scope, cwd, opts): Promise<WriteReport>;
}
```

Adapters are **pure**: same input → same output, all state in the filesystem. Support is declared, never
inferred (`full`/`partial`/`none` per resource; per-event for hooks); losses flow back through
`WriteReport.{warnings,skipped}`. The canonical `CanonicalEvent` taxonomy (28 events) is the pivot every
`eventMap` maps to/from.
