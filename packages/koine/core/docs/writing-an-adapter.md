# Writing an koine adapter

This guide walks through building a community adapter using the **Aider adapter** (~70 lines) as the worked example. Aider has the smallest config surface of any supported client (rules only), so it's the minimum-viable adapter shape.

By the end you'll have a published `@yourname/koine-adapter-myclient` package that the koine CLI can target via `koine compile myclient`.

---

## Prerequisites

```bash
npm install @leclabs/koine-core
```

Optionally `vitest` for testing and `tsup` for building.

## The contract

Every adapter implements:

```ts
interface Adapter {
  id: string;
  capabilities: AdapterCapabilities;
  eventMap?: EventMap;
  detect(scope: Scope, cwd: string): Promise<boolean>;
  read(scope: Scope, cwd: string): Promise<Partial<IR>>;
  write(ir: IR, scope: Scope, cwd: string, opts: WriteOpts): Promise<WriteReport>;
}
```

Adapters are pure: same input → same output. State lives in the filesystem.

## Step 1 — declare capabilities

Tell koine what your client supports:

```ts
const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',         // 'full' | 'partial' | 'none'
    skills: 'none',
    commands: 'none',
    agents: 'none',
    hooks: 'none',
    mcp: 'none',
    permissions: 'none',
    env: 'none',
  },
  hooks: {
    supported: [],         // CanonicalEvent[] this client can emit
    matchers: 'none',      // 'glob' | 'literal' | 'none'
    payload: 'native',     // 'claude-json' | 'native' | 'shim'
  },
  scopes: ['user', 'project'],
};
```

The CLI's `koine adapters` and `koine lint` use this to surface lossy translations to users.

## Step 2 — paths

A small helper that resolves where the client's config lives per scope:

```ts
function rulesPath(scope: Scope, cwd: string): string {
  if (scope === 'user') return join(process.env.HOME ?? '/', 'AGENTS.md');
  return join(cwd, 'AGENTS.md');
}
```

Aider just has one location; richer adapters will export a `paths()` returning a struct.

## Step 3 — `detect()`

Return `true` if the client's config is present at the given scope:

```ts
async detect(scope: Scope, cwd: string): Promise<boolean> {
  return existsSync(rulesPath(scope, cwd));
}
```

Used by `koine doctor` to report which targets are configured.

## Step 4 — `read()`

Lift the client's native config into a `Partial<IR>`:

```ts
async read(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const path = rulesPath(scope, cwd);
  if (!existsSync(path)) return {};
  return { rules: [parseRule(await readFile(path, 'utf8'), 'main')] };
}
```

`parseRule` is exported from `@leclabs/koine-core` — use the shared serializers for resources that share the markdown+frontmatter shape (rules, skills, commands, agents). For YAML-shaped resources (hooks, MCP), use `parseHook` / handcraft.

The CLI's `import` command calls this and writes the IR via the engine.

## Step 5 — `write()`

The inverse — emit the IR to the client's native location and return a `WriteReport`:

```ts
async write(ir: IR, scope: Scope, cwd: string, opts: WriteOpts = {}): Promise<WriteReport> {
  const path = rulesPath(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  if (ir.rules?.length) {
    const body = ir.rules.map((r) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, `${body}\n`, 'utf8');
    }
    written.push(path);
  }

  // Surface lossy translations explicitly
  for (const [field, label] of [['skills', 'skills'], ['hooks', 'hooks']] as const) {
    const items = ir[field];
    if (items?.length) {
      warnings.push(`${label}: not supported (${items.length} skipped)`);
      for (const i of items) skipped.push({ path: `${label}/${i.name ?? '?'}`, reason: 'unsupported' });
    }
  }

  return { written, skipped, warnings };
}
```

**Honor `opts.dryRun`** — when true, return what _would_ be written but don't touch the filesystem. The engine uses this for `koine compile --dry-run` and `koine diff`.

**Be explicit about what you skip.** The `--explain` flag groups warnings/skips by reason — give meaningful reason strings.

## Step 6 — wire it together

```ts
export const myAdapter: Adapter = {
  id: 'myclient',
  capabilities,
  // eventMap: canonicalToMyClient,  // if you have hooks
  detect,
  read,
  write,
};
```

That's it. ~70 lines for a rules-only adapter.

## Adding hook support

If your client has lifecycle hooks, add an `eventMap`:

```ts
const canonicalToMyClient: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'OnSessionStart',
  'tool.use.pre': 'BeforeTool',
  'tool.use.post': 'AfterTool',
  // ...
};
```

koine's CLI surfaces this via `koine events --client myclient`. Events not in the map → warning + skip on write.

For hook _bodies_, koine hooks are shell commands. If your client wants JS plugins or another representation, generate a thin shim that shells out to the configured `command` (see the OpenCode adapter for reference).

## Testing

Use vitest with the round-trip pattern:

```ts
import { myAdapter } from '../src/index.js';

it('round-trips rules', async () => {
  const ir = { manifest: { koine: 1, scope: 'project', targets: ['myclient'] }, rules: [...] };
  await myAdapter.write(ir, 'project', tmpDir, {});
  const re = await myAdapter.read('project', tmpDir);
  expect(re.rules).toEqual(ir.rules);
});
```

## Publishing

```bash
npm publish --access public
```

Users install with `npm i @yourname/koine-adapter-myclient` and pass it to the CLI via a custom adapter loader, or to the `compile` engine directly.

## Reference adapters

Look at the official adapters in `packages/adapters/src/` for patterns:

- **aider** (~70 lines) — rules only, the minimum viable
- **claude** (~150 lines) — full coverage of all 8 resource types, the reference implementation
- **opencode** — shows JS shim plugin generation for hooks
- **codex** — shows TOML config generation
- **gemini** — shows alternate event-naming convention

## Questions?

Open an issue on [leclabs/polis](https://github.com/leclabs/polis).
