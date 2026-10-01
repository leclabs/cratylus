// `cratylus catalog [agent] [--config <path>] [--corpus <dir>] [--json]` — the
// FIRST-CLASS discovery command. Two views over the extendable
// option-space, so a first-timer needs no source-archaeology:
//
//  · CROSS-PLUGIN (default when an `cratylus.config.ts` is present): list the
//    extendable fragment IDs across ALL extended plugins, grouped by plugin. This
//    is the generalized multi-plugin catalog — the ids a consumer targets in a
//    `patch`, read straight off the loaded plugins (`LoadedPlugin.contributions`,
//    via `config/loader.ts` → `enumeratePluginFragmentCatalogs`). No source-archaeology.
//  · CORPUS (`--corpus <dir>`, or the zero-config default in this monorepo): the
//    single-corpus per-dimension census — enumerate a corpus's `<dimension>/*.ts`
//    value bodies joined with the dimension metadata (`enumerateCatalog`). Kept
//    verbatim as the doctrine-agnostic option-space view.
//
// forge owns the mechanism (it types whatever dimensions it is handed); the
// corpus/plugins supply the data — BOTH halves of it, the value modules and the
// catalog they file under. Mode selection: `--corpus` forces the corpus
// view; else a present config drives the cross-plugin view; else the default
// canon corpus is the fallback (zero-arg keeps working in this monorepo).

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { type DimensionManifest, mergeManifest } from '@cratylus/schema';
import { CLI_BIN } from '../../bin-name.js';
import { type CatalogEntry, enumerateCatalog } from '../../catalog/index.js';
import { loadConfig, loadPlugins, requirePlugins } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import { fail, say } from '../style.js';

export interface CatalogCmdOpts {
  /** Optional filter: keep only fragment ids containing this token (cross-plugin view). */
  agent?: string;
  /** Path to the config; defaults to `<cwd>/cratylus.config.ts` (cross-plugin view). */
  config?: string;
  /** Corpus `dimensions/` dir — forces the per-dimension corpus census view. */
  corpus?: string;
  /** Emit the machine contract as JSON instead of the human table. */
  json?: boolean;
  cwd?: string;
}

/** One plugin's extendable fragment ids (the cross-plugin discovery contract). */
interface PluginCatalog {
  readonly name: string;
  readonly fragments: readonly string[];
}

/**
 * Resolve the default corpus dimensions dir: canon's `src/dimensions`, located relative
 * to this package (works from both `src/` under tsx and `dist/` at runtime).
 * Returns undefined if no such sibling exists (then `--corpus`/config is required).
 */
function defaultCorpus(): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url));
  // here = <forge>/dist/cli  or  <forge>/src/cli  →  up to <packages>, into canon.
  const candidate = resolve(
    here,
    '..',
    '..',
    '..',
    'canon',
    'src',
    'dimensions',
  );
  return existsSync(candidate) ? candidate : undefined;
}

/** The corpus census as lines, grouped by dimension. */
function renderTable(entries: CatalogEntry[]): string[] {
  const lines: string[] = [];
  for (const e of entries) {
    lines.push(
      `${e.dimension} [${e.axis}, ${e.repertoire}, ${e.arity}] (${e.values.length})`,
    );
    if (e.values.length === 0) lines.push('  (no value modules)');
    for (const v of e.values) {
      const oneLine = v.replace(/\s+/g, ' ').trim();
      lines.push(
        `  ${oneLine.length > 80 ? `${oneLine.slice(0, 79)}…` : oneLine}`,
      );
    }
  }
  return lines;
}

/** The cross-plugin extendable fragment ids as lines, grouped by plugin. */
function renderCrossPlugin(plugins: readonly PluginCatalog[]): string[] {
  const lines: string[] = [];
  for (const p of plugins) {
    lines.push(`${p.name} (${p.fragments.length})`);
    if (p.fragments.length === 0) lines.push('  (no fragments)');
    for (const id of p.fragments) lines.push(`  ${id}`);
  }
  return lines;
}

/** The CROSS-PLUGIN view: enumerate extendable fragment ids across all extended plugins. */
async function runCrossPlugin(
  configPath: string,
  opts: CatalogCmdOpts,
): Promise<number> {
  const config = await loadConfig(configPath);
  requirePlugins(config, configPath);
  const loaded = await loadPlugins(config.extends, dirname(configPath));
  const filter = opts.agent?.toLowerCase();
  const plugins: PluginCatalog[] = loaded.map((p) => ({
    name: p.name,
    fragments: p.contributions
      .map((c) => c.target.id)
      .filter((id) => !filter || id.toLowerCase().includes(filter))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  }));

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({ extends: plugins.map((p) => p.name), plugins }, null, 2)}\n`,
    );
    return 0;
  }
  for (const line of renderCrossPlugin(plugins)) say(line);
  return 0;
}

/**
 * The dimension CATALOG the corpus census joins against — the corpus's own, never
 * the projector's, because the projector has none.
 *
 * A corpus's `dimensions/` dir is a plugin's `fragments` dir, so the catalog is on
 * that plugin: read it off the extended plugins when a config names them, and
 * otherwise off the corpus package's own entry module (the sibling of its
 * `dimensions/` dir — the same self-location `defaultCorpus` already assumes).
 */
async function corpusManifest(
  corpus: string,
  configPath: string,
): Promise<DimensionManifest> {
  if (existsSync(configPath)) {
    const config = await loadConfig(configPath);
    requirePlugins(config, configPath);
    return mergeManifest(config.extends ?? []);
  }
  for (const entry of ['index.ts', 'index.js']) {
    const mod = join(corpus, '..', entry);
    if (!existsSync(mod)) continue;
    const loaded = (await import(pathToFileURL(mod).href)) as {
      default?: { name?: string; manifest?: DimensionManifest };
    };
    // `?.manifest`, not just `loaded.default`. A corpus package that exports a
    // plugin but forgot the catalog is the MOST LIKELY zero-config mistake, and
    // admitting it here handed the user `mergeManifest`'s refusal instead of this
    // one. That message is correct for core — it names the plugins and the
    // `manifest` remedy — but it cannot mention `--config`, because a CLI flag has
    // no business in a function four call sites share. So the likeliest mistake
    // drew the least useful of the two refusals. Falling through keeps the
    // CLI-shaped remedy at the CLI, where it is knowable.
    if (loaded.default?.manifest)
      return mergeManifest([{ name: corpus, ...loaded.default }]);
  }
  throw new Error(
    `no dimension catalog for corpus ${corpus} — declare one on the corpus plugin's \`manifest\`, or point --config at a config that extends it`,
  );
}

/** The CORPUS view: enumerate one corpus's per-dimension value census. */
async function runCorpus(
  corpus: string,
  configPath: string,
  opts: CatalogCmdOpts,
): Promise<number> {
  if (!existsSync(corpus)) {
    fail(
      'catalog',
      `corpus dimensions dir not found: ${corpus}; check the --corpus path`,
    );
    return 1;
  }
  const entries = await enumerateCatalog(
    corpus,
    await corpusManifest(corpus, configPath),
  );
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(entries, null, 2)}\n`);
    return 0;
  }
  for (const line of renderTable(entries)) say(line);
  return 0;
}

export async function runCatalog(opts: CatalogCmdOpts): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = opts.config
    ? resolve(opts.config)
    : join(cwd, CONFIG_FILE);

  // `--corpus` forces the per-dimension corpus census (doctrine-agnostic view). The
  // census lists every dimension, so an <agent> filter has nothing to narrow: refuse
  // it rather than print a census that looks filtered and is not.
  if (opts.corpus) {
    if (opts.agent !== undefined) {
      fail(
        'catalog',
        `<agent> is not used with --corpus (got '${opts.agent}'); drop one of them`,
      );
      return 1;
    }
    try {
      return await runCorpus(resolve(opts.corpus), configPath, opts);
    } catch (e) {
      fail('catalog', (e as Error).message);
      return 1;
    }
  }

  // Else prefer the CROSS-PLUGIN view when a config is present (the first-class
  // discovery: extendable fragment ids across every extended plugin).
  if (existsSync(configPath)) {
    try {
      return await runCrossPlugin(configPath, opts);
    } catch (e) {
      fail('catalog', (e as Error).message);
      return 1;
    }
  }

  // Else fall back to the default canon corpus (zero-arg keeps working) — the same
  // census, so the same refusal of an <agent> it would ignore.
  if (opts.agent !== undefined) {
    fail(
      'catalog',
      `no ${CONFIG_FILE} at ${configPath}, so the corpus census is shown and <agent> ('${opts.agent}') does not filter it; run \`${CLI_BIN} init\` or drop <agent>`,
    );
    return 1;
  }
  const fallback = defaultCorpus();
  if (!fallback) {
    fail(
      'catalog',
      `no ${CONFIG_FILE}, no --corpus, and no default canon/src/dimensions found; run \`${CLI_BIN} init\` or pass --corpus <dir>`,
    );
    return 1;
  }
  try {
    return await runCorpus(fallback, configPath, opts);
  } catch (e) {
    fail('catalog', (e as Error).message);
    return 1;
  }
}
