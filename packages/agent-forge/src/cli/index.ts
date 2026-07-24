import { cac } from 'cac';
import { aiderAdapter } from '../adapters/aider/index.js';
import { ampAdapter } from '../adapters/amp/index.js';
import { claudeAdapter } from '../adapters/claude/index.js';
import { clineAdapter } from '../adapters/cline/index.js';
import { codexAdapter } from '../adapters/codex/index.js';
import { continueAdapter } from '../adapters/continue/index.js';
import { copilotAdapter } from '../adapters/copilot/index.js';
import { crushAdapter } from '../adapters/crush/index.js';
import { cursorAdapter } from '../adapters/cursor/index.js';
import { devinAdapter } from '../adapters/devin/index.js';
import { geminiAdapter } from '../adapters/gemini/index.js';
import { kiloAdapter } from '../adapters/kilo/index.js';
import { opencodeAdapter } from '../adapters/opencode/index.js';
import { piAdapter } from '../adapters/pi/index.js';
import { standardsAdapter } from '../adapters/standards/index.js';
import { zedAdapter } from '../adapters/zed/index.js';
import {
  type Adapter,
  type Scope,
  assertAdaptersValid,
} from '../core/index.js';
import type { Scope as DeployScope } from '../deploy/index.js';
import { runAdd } from './commands/add.js';
import { runCatalog } from './commands/catalog.js';
import { runCompile } from './commands/compile.js';
import { runCompose } from './commands/compose.js';
import {
  type DeployKindArg,
  parseCompanions,
  runDeploy,
} from './commands/deploy.js';
import { runDiff } from './commands/diff.js';
import { runDoctor } from './commands/doctor.js';
import { runEventsList } from './commands/events.js';
import { runExplain } from './commands/explain.js';
import { runImport } from './commands/import.js';
import { runInit } from './commands/init.js';
import { runLint } from './commands/lint.js';
import { runMigrate } from './commands/migrate.js';
import { runOptimize } from './commands/optimize.js';
import { runProject } from './commands/project.js';
import { runWatch } from './commands/watch.js';

const VERSION = '0.0.0';

const adapters: Adapter[] = [
  claudeAdapter,
  opencodeAdapter,
  codexAdapter,
  geminiAdapter,
  copilotAdapter,
  cursorAdapter,
  clineAdapter,
  crushAdapter,
  aiderAdapter,
  continueAdapter,
  zedAdapter,
  devinAdapter,
  ampAdapter,
  kiloAdapter,
  piAdapter,
  standardsAdapter,
];

// Adapter-load lint: an invalid declaration (e.g. a resource declared
// `plugin` with no plugin emitter) fails here, not as a runtime surprise.
assertAdaptersValid(adapters);

const cli = cac('agent-forge');

cli
  .command(
    'init',
    'Bootstrap a new .agent-forge/ directory + scaffold agents.config.ts',
  )
  .option('--scope <scope>', 'user | project | local', { default: 'project' })
  .action(async (opts: { scope: Scope }) => {
    process.exit(await runInit({ scope: opts.scope }));
  });

cli
  .command(
    'add <plugin>',
    'Wire a plugin package into agents.config.ts extends',
  )
  .action(async (plugin: string) => {
    process.exit(await runAdd({ plugin }));
  });

cli
  .command(
    'compose',
    'Load agents.config.ts, resolve the plugin set, and print it (config-is-code)',
  )
  .option('--config <path>', 'config file (default: <cwd>/agents.config.ts)')
  .option('--dry-run', 'print the resolved set; write nothing')
  .action(async (opts: { config?: string; dryRun?: boolean }) => {
    process.exit(
      await runCompose({ config: opts.config, dryRun: opts.dryRun }),
    );
  });

cli
  .command(
    'project',
    'Materialize the resolved plugin set into a render tree (compose → render tree)',
  )
  .option('--config <path>', 'config file (default: <cwd>/agents.config.ts)')
  .option('--out <dir>', 'render-tree root (default: <cwd>/.render)')
  .option('--harness <name>', 'harness adapter (default: claude)')
  .action(async (opts: { config?: string; out?: string; harness?: string }) => {
    process.exit(
      await runProject({
        config: opts.config,
        out: opts.out,
        harness: opts.harness,
      }),
    );
  });

cli
  .command('import <client>', 'Lift a client config into the IR')
  .option('--scope <scope>', '', { default: 'project' })
  .option('--from <path>', 'Read from this directory instead of cwd')
  .option('--merge', 'Merge into existing IR (preserve ours on conflict)')
  .action(
    async (
      client: string,
      opts: { scope: Scope; from?: string; merge?: boolean },
    ) => {
      process.exit(
        await runImport(
          { client, scope: opts.scope, from: opts.from, merge: opts.merge },
          adapters,
        ),
      );
    },
  );

cli
  .command('compile [...clients]', 'Compile IR to one or more clients')
  .option('--scope <scope>', '', { default: 'project' })
  .option('--dry-run', 'Skip writes; show what would change')
  .option('--strict', 'Abort on any warning or skipped resource')
  .option('--explain', 'Verbose substitution and skip explanations')
  .option(
    '--as-claude-bundle <name>',
    'Bundle the claude target as a distributable plugin (.claude-plugin/ tree) instead of the ordinary .claude/ tree',
  )
  .action(
    async (
      clients: string[],
      opts: {
        scope: Scope;
        dryRun?: boolean;
        strict?: boolean;
        explain?: boolean;
        asClaudeBundle?: string;
      },
    ) => {
      process.exit(
        await runCompile(
          {
            clients,
            scope: opts.scope,
            dryRun: opts.dryRun,
            strict: opts.strict,
            explain: opts.explain,
            asClaudeBundle: opts.asClaudeBundle,
          },
          adapters,
        ),
      );
    },
  );

cli
  .command(
    'diff [...clients]',
    'Show what would change on next compile, plus drift',
  )
  .option('--scope <scope>', '', { default: 'project' })
  .action(async (clients: string[], opts: { scope: Scope }) => {
    process.exit(await runDiff({ clients, scope: opts.scope }, adapters));
  });

cli
  .command('lint', 'Validate the IR against schema and adapter capabilities')
  .option('--scope <scope>', '', { default: 'project' })
  .option('--strict', 'Treat capability warnings as errors')
  .action(async (opts: { scope: Scope; strict?: boolean }) => {
    process.exit(
      await runLint({ scope: opts.scope, strict: opts.strict }, adapters),
    );
  });

cli
  .command('adapters', 'List installed adapters and their capabilities')
  .action(() => {
    const RESOURCE_TYPES = [
      'rules',
      'skills',
      'commands',
      'agents',
      'hooks',
      'mcp',
      'permissions',
      'env',
    ] as const;
    const sym = (s: string) =>
      s === 'full' ? '✓' : s === 'partial' ? '🟡' : s === 'plugin' ? '🔌' : '—';
    // Roster fact, not folklore (E10.S5): a renamed adapter displays its
    // field-canonical id with the legacy id(s) noted as aliases, never the
    // reverse — naming follows the RETURN-sheet field state.
    const statusCell = (a: (typeof adapters)[number]) =>
      a.status.kind === 'sunset'
        ? `sunset→${a.status.successor}`
        : a.status.kind === 'renamed'
          ? `renamed${a.status.aliases?.length ? ` (aka ${a.status.aliases.join(',')})` : ''}`
          : 'current';
    const head = `ID${' '.repeat(8)}${RESOURCE_TYPES.map((t) => t.slice(0, 4).padEnd(5)).join('')} HOOKS  SCOPES  STATUS`;
    console.log(head);
    for (const a of adapters) {
      const cells = RESOURCE_TYPES.map((t) =>
        sym(a.capabilities.resources[t]).padEnd(5),
      ).join('');
      const hookCount = a.capabilities.hooks.supported.length;
      const scopes = a.capabilities.scopes.join(',');
      const displayId = a.status.canonicalId ?? a.id;
      console.log(
        `${displayId.padEnd(10)}${cells} ${String(hookCount).padStart(2)}/28  ${scopes.padEnd(20)}${statusCell(a)}`,
      );
    }
    process.exit(0);
  });

cli
  .command('events', 'List canonical events and per-client mappings')
  .option('--client <id>', 'Show mapping for a specific adapter')
  .action(async (opts: { client?: string }) => {
    process.exit(await runEventsList({ client: opts.client }, adapters));
  });

cli
  .command('doctor', 'Diagnose installation, manifest, and target detection')
  .option('--scope <scope>', '', { default: 'project' })
  .action(async (opts: { scope: Scope }) => {
    process.exit(await runDoctor({ scope: opts.scope }, adapters));
  });

cli
  .command('watch [...clients]', 'Auto-recompile on IR changes')
  .option('--scope <scope>', '', { default: 'project' })
  .option('--debounce <ms>', '', { default: 300 })
  .action(
    async (clients: string[], opts: { scope: Scope; debounce: number }) => {
      process.exit(
        await runWatch(
          { clients, scope: opts.scope, debounce: Number(opts.debounce) },
          adapters,
        ),
      );
    },
  );

cli
  .command('migrate', 'Migrate the IR schema between versions')
  .option('--from <n>', 'Source schema version (defaults to manifest)')
  .option('--to <n>', 'Target schema version (defaults to latest)')
  .option('--scope <scope>', '', { default: 'project' })
  .action(async (opts: { from?: string; to?: string; scope: Scope }) => {
    process.exit(
      await runMigrate({
        from: opts.from !== undefined ? Number(opts.from) : undefined,
        to: opts.to !== undefined ? Number(opts.to) : undefined,
        scope: opts.scope,
      }),
    );
  });

cli
  .command(
    'optimize <source>',
    'Gate an LLM-authored exemplify plan: write R=LLM artifacts + the R3 routing manifest',
  )
  .option(
    '--plan <file>',
    'the semantic plan (concepts + artifacts) authored by the operating agent — required',
  )
  .option('--out <dir>', 'artifact output dir', { default: 'optimized' })
  .option(
    '--manifest <path>',
    'manifest path (default .manifests/<source>.json)',
  )
  .option(
    '--prior <path>',
    'prior accepted manifest — matching digests route as reuse',
  )
  .action(
    async (
      source: string,
      opts: { plan?: string; out?: string; manifest?: string; prior?: string },
    ) => {
      process.exit(
        await runOptimize({
          source,
          plan: opts.plan,
          out: opts.out,
          manifest: opts.manifest,
          prior: opts.prior,
        }),
      );
    },
  );

cli
  .command(
    'deploy',
    'Ship a projected render tree (agents/ + skills/) to a host .claude/ root',
  )
  .option('--agents-dir <dir>', 'Render tree agents/ dir (the projected defs)')
  .option(
    '--skills-dir <dir>',
    'Render tree skills/ dir (the projected skill dirs)',
  )
  .option(
    '--hooks-dir <dir>',
    'Render tree hooks root (settings.json + hooks/<id>/); required for --kind hooks',
  )
  .option(
    '--assets <decls>',
    'skill committed companions: <skill>=<spec>[,…] (warn if absent)',
  )
  .option('--kind <kind>', 'agent | skill | hooks | all', { default: 'all' })
  .option('--scope <scope>', 'user | project', { default: 'user' })
  .option(
    '--host <host>',
    "host key in .agent-factory.config; omit/'local' to deploy in place",
  )
  .option('--user <user>', 'ssh user override (else config host.<name>.user)')
  .option(
    '--home <dir>',
    'user-scope .claude parent override (else config home, else ~/.claude)',
  )
  .option('--project <dir>', 'project root for --scope project (default: cwd)')
  .option(
    '--fleet',
    'deploy every fleet.hosts minus fleet.exclude (needs config)',
  )
  .option(
    '--exclude <hosts>',
    'comma-separated host(s) to add to the fleet exclude',
  )
  .option(
    '--only <names>',
    'single-host: names to deploy; --fleet: hosts to restrict to',
  )
  .option('--dry-run', 'print actions, change nothing')
  .option(
    '--no-runtime-install',
    'skip the per-host runtime install (default: bundle + flat co-install agent-runtime + capabilities)',
  )
  .option(
    '--runtime-prefix <dir>',
    'install prefix for the runtime bundle (default: the host npm global prefix, already on PATH)',
  )
  .action(
    async (opts: {
      agentsDir?: string;
      skillsDir?: string;
      hooksDir?: string;
      assets?: string;
      kind: DeployKindArg;
      scope: Scope;
      host?: string;
      user?: string;
      home?: string;
      project?: string;
      fleet?: boolean;
      exclude?: string;
      only?: string;
      dryRun?: boolean;
      runtimeInstall?: boolean;
      runtimePrefix?: string;
    }) => {
      // `hooks` ships from a single hooks render root; agent/skill ship from the
      // agents/ + skills/ dirs; `all` ships every kind in one invocation and so
      // needs ALL three dirs. Validate the kind-appropriate inputs.
      if (opts.kind === 'all') {
        const missing = [
          !opts.agentsDir && '--agents-dir',
          !opts.skillsDir && '--skills-dir',
          !opts.hooksDir && '--hooks-dir',
        ].filter(Boolean);
        if (missing.length > 0) {
          console.error(
            `agent-forge deploy: --kind all requires ${missing.join(', ')}`,
          );
          process.exit(1);
        }
      } else if (opts.kind === 'hooks') {
        if (!opts.hooksDir) {
          console.error(
            'agent-forge deploy: --hooks-dir is required for --kind hooks',
          );
          process.exit(1);
        }
      } else if (!opts.agentsDir || !opts.skillsDir) {
        console.error(
          'agent-forge deploy: --agents-dir and --skills-dir are required',
        );
        process.exit(1);
      }
      let companions: ReturnType<typeof parseCompanions>;
      try {
        companions = parseCompanions(opts.assets ?? null);
      } catch (e) {
        console.error(`agent-forge deploy: ${(e as Error).message}`);
        process.exit(1);
      }
      process.exit(
        await runDeploy({
          // For --kind hooks the dirs are unused; pass placeholders.
          agentsDir: opts.agentsDir ?? '',
          skillsDir: opts.skillsDir ?? '',
          hooksDir: opts.hooksDir,
          companions,
          kind: opts.kind,
          scope: opts.scope as DeployScope,
          host: opts.host ?? null,
          user: opts.user ?? null,
          home: opts.home ?? null,
          project: opts.project ?? null,
          fleet: opts.fleet,
          exclude: opts.exclude ?? null,
          only: opts.only ?? null,
          dryRun: opts.dryRun,
          // cac maps `--no-runtime-install` to `runtimeInstall === false`.
          noRuntimeInstall: opts.runtimeInstall === false,
          runtimePrefix: opts.runtimePrefix ?? null,
        }),
      );
    },
  );

cli
  .command(
    'explain [agent]',
    'Report each resolved fragment’s provenance: source plugin/patch + final value',
  )
  .option('--config <path>', 'config file (default: <cwd>/agents.config.ts)')
  .option('--json', 'emit the machine contract as JSON instead of the report')
  .action(
    async (
      agent: string | undefined,
      opts: { config?: string; json?: boolean },
    ) => {
      process.exit(
        await runExplain({ agent, config: opts.config, json: opts.json }),
      );
    },
  );

cli
  .command(
    'catalog [agent]',
    'Discover extendable fragment IDs across all extended plugins (or a corpus census)',
  )
  .option('--config <path>', 'config file (default: <cwd>/agents.config.ts)')
  .option(
    '--corpus <dir>',
    "force the per-dimension corpus census (default: agent-canon's src/dimensions)",
  )
  .option('--json', 'emit the machine contract as JSON instead of a table')
  .action(
    async (
      agent: string | undefined,
      opts: { config?: string; corpus?: string; json?: boolean },
    ) => {
      process.exit(
        await runCatalog({
          agent,
          config: opts.config,
          corpus: opts.corpus,
          json: opts.json,
        }),
      );
    },
  );

cli.help();
cli.version(VERSION);
cli.parse();
