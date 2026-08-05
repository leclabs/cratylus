import { cac } from 'cac';
import type { Scope as DeployScope } from '../deploy/index.js';
import { runAdd } from './commands/add.js';
import { runCatalog } from './commands/catalog.js';
import { runCompose } from './commands/compose.js';
import {
  type DeployKindArg,
  parseCompanions,
  runDeploy,
} from './commands/deploy.js';
import { runExplain } from './commands/explain.js';
import { runInit } from './commands/init.js';
import { runOptimize } from './commands/optimize.js';
import { runProject } from './commands/project.js';

const VERSION = '0.0.0';

const cli = cac('forge');

cli
  .command('init', 'Scaffold agents.config.ts from the default plugin')
  .action(async () => {
    process.exit(await runInit());
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
    'Place a projected render tree (agents/ + skills/) into the local .claude/ root',
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
  .option('--harness <name>', 'harness adapter (default: claude)')
  .option(
    '--home <dir>',
    "user-scope parent override for the harness's home (else ~/<home>)",
  )
  .option('--project <dir>', 'project root for --scope project (default: cwd)')
  .option('--only <names>', 'comma-separated names to deploy')
  .option('--dry-run', 'print actions, change nothing')
  .action(
    async (opts: {
      agentsDir?: string;
      skillsDir?: string;
      hooksDir?: string;
      assets?: string;
      kind: DeployKindArg;
      scope: DeployScope;
      harness?: string;
      home?: string;
      project?: string;
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
            `cratylus deploy: --kind all requires ${missing.join(', ')}`,
          );
          process.exit(1);
        }
      } else if (opts.kind === 'hooks') {
        if (!opts.hooksDir) {
          console.error(
            'cratylus deploy: --hooks-dir is required for --kind hooks',
          );
          process.exit(1);
        }
      } else if (!opts.agentsDir || !opts.skillsDir) {
        console.error(
          'cratylus deploy: --agents-dir and --skills-dir are required',
        );
        process.exit(1);
      }
      let companions: ReturnType<typeof parseCompanions>;
      try {
        companions = parseCompanions(opts.assets ?? null);
      } catch (e) {
        console.error(`cratylus deploy: ${(e as Error).message}`);
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
          scope: opts.scope,
          harness: opts.harness ?? null,
          home: opts.home ?? null,
          project: opts.project ?? null,
          only: opts.only ?? null,
          dryRun: opts.dryRun,
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
    "force the per-dimension corpus census (default: canon's src/dimensions)",
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

// An unknown verb must FAIL, loudly and by name. cac's default is to parse an
// unrecognized command into the (absent) global command and exit 0 silently —
// so `forge compile` would have looked like a success long after `compile`
// was deleted. depalimpsest-ir-intake S6 removed nine verbs; this guard is what
// makes their removal observable instead of silent.
const parsed = cli.parse(process.argv, { run: false });
if (!cli.matchedCommand && parsed.args.length > 0) {
  const known = cli.commands.map((c) => c.name).join(', ');
  console.error(`forge: unknown command '${parsed.args[0]}' (known: ${known})`);
  process.exit(1);
}
cli.runMatchedCommand();
