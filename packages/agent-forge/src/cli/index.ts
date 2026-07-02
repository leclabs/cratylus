import { cac } from 'cac';
import { aiderAdapter } from '../adapters/aider/index.js';
import { claudeAdapter } from '../adapters/claude/index.js';
import { clineAdapter } from '../adapters/cline/index.js';
import { codexAdapter } from '../adapters/codex/index.js';
import { continueAdapter } from '../adapters/continue/index.js';
import { copilotAdapter } from '../adapters/copilot/index.js';
import { crushAdapter } from '../adapters/crush/index.js';
import { cursorAdapter } from '../adapters/cursor/index.js';
import { geminiAdapter } from '../adapters/gemini/index.js';
import { opencodeAdapter } from '../adapters/opencode/index.js';
import type { Adapter, Scope } from '../core/index.js';
import type { Scope as DeployScope } from '../deploy/index.js';
import { runCatalog } from './commands/catalog.js';
import { runCompile } from './commands/compile.js';
import {
  type DeployKindArg,
  parseCompanions,
  runDeploy,
} from './commands/deploy.js';
import { runDiff } from './commands/diff.js';
import { runDoctor } from './commands/doctor.js';
import { runEventsList } from './commands/events.js';
import { runFound } from './commands/found.js';
import { runImport } from './commands/import.js';
import { runInit } from './commands/init.js';
import { runLint } from './commands/lint.js';
import { runMigrate } from './commands/migrate.js';
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
];

const cli = cac('agent-forge');

cli
  .command('init', 'Bootstrap a new .agent-forge/ directory')
  .option('--scope <scope>', 'user | project | local', { default: 'project' })
  .action(async (opts: { scope: Scope }) => {
    process.exit(await runInit({ scope: opts.scope }));
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
  .action(
    async (
      clients: string[],
      opts: {
        scope: Scope;
        dryRun?: boolean;
        strict?: boolean;
        explain?: boolean;
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
      s === 'full' ? '✓' : s === 'partial' ? '🟡' : '—';
    const head = `ID${' '.repeat(8)}${RESOURCE_TYPES.map((t) => t.slice(0, 4).padEnd(5)).join('')} HOOKS  SCOPES`;
    console.log(head);
    for (const a of adapters) {
      const cells = RESOURCE_TYPES.map((t) =>
        sym(a.capabilities.resources[t]).padEnd(5),
      ).join('');
      const hookCount = a.capabilities.hooks.supported.length;
      const scopes = a.capabilities.scopes.join(',');
      console.log(
        `${a.id.padEnd(10)}${cells} ${String(hookCount).padStart(2)}/28  ${scopes}`,
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
    '--bundle-base-root <dir>',
    'Root that skill `bundle:` specs resolve against',
  )
  .option(
    '--bundle <decls>',
    'skill build-artifact companions: <skill>=<spec>[,…] (hard-error if unbuilt)',
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
  .action(
    async (opts: {
      agentsDir?: string;
      skillsDir?: string;
      hooksDir?: string;
      bundleBaseRoot?: string;
      bundle?: string;
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
        companions = parseCompanions(opts.bundle ?? null, opts.assets ?? null);
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
          bundleBaseRoot: opts.bundleBaseRoot,
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
        }),
      );
    },
  );

cli
  .command(
    'found <target>',
    'Found a mind-society in <target> (project culture + scaffold)',
  )
  .option('--agents-dir <dir>', 'Render tree agents/ dir (the projected defs)')
  .option(
    '--skills-dir <dir>',
    'Render tree skills/ dir (the projected skill dirs)',
  )
  .option('--subject <text>', 'one-line statement of what this society is for')
  .option(
    '--force',
    'overwrite an existing founding AGENTS.md (default: refuse)',
  )
  .action(
    async (
      target: string,
      opts: {
        agentsDir?: string;
        skillsDir?: string;
        subject?: string;
        force?: boolean;
      },
    ) => {
      if (!opts.agentsDir || !opts.skillsDir) {
        console.error(
          'agent-forge found: --agents-dir and --skills-dir are required',
        );
        process.exit(1);
      }
      process.exit(
        await runFound({
          target,
          agentsDir: opts.agentsDir,
          skillsDir: opts.skillsDir,
          subject: opts.subject,
          force: opts.force,
        }),
      );
    },
  );

cli
  .command(
    'catalog',
    'Enumerate the organ-value catalog of a corpus (discover the option-space)',
  )
  .option(
    '--corpus <dir>',
    "corpus organs/ dir (default: agent-anatomy's src/organs when present)",
  )
  .option('--json', 'emit the machine contract as JSON instead of a table')
  .action(async (opts: { corpus?: string; json?: boolean }) => {
    process.exit(await runCatalog({ corpus: opts.corpus, json: opts.json }));
  });

cli.help();
cli.version(VERSION);
cli.parse();
