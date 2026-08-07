import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { cac } from 'cac';
import { FORGE_BIN } from '../bin-name.js';
import { CONFIG_FILE } from '../config/scaffold.js';
import {
  DEPLOY_CHECK_EXIT,
  type Scope as DeployScope,
} from '../deploy/index.js';
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
import { runInstall } from './commands/install.js';
import { runOptimize } from './commands/optimize.js';
import { runProject } from './commands/project.js';

/**
 * This package's version, read from the manifest that DEFINES it.
 *
 * It was the literal `'0.0.0'`, and `0.1.0` shipped to npm with every CLI still reporting
 * `0.0.0` — confirmed by installing the published tarball on another host. A version is a
 * CLAIM ABOUT THE ARTIFACT, and it had no home: `changeset version` rewrites the manifest
 * and cannot rewrite a string in TypeScript, so the two were guaranteed to diverge at the
 * first release and to stay diverged forever.
 *
 * Read by package SELF-REFERENCE rather than a relative path, which is the form
 * `bin-name.ts` already uses and for the same reason: tsup inlines this module into
 * `dist/<entry>/index.js`, so `../package.json` would resolve from the wrong depth once
 * bundled. Node resolves a self-reference through the package's own `exports`.
 */
const VERSION: string = createRequire(import.meta.url)(
  '@cratylus/forge/package.json',
).version;

// BRANDED WITH THE NAME IT IS INSTALLED UNDER. This said `cac('forge')`, so every
// line of `--help` offered `$ forge <command>` — a program no host has, because
// the `bin` key installs `cratylus`. It was wrong the day it was written rather
// than wrong after a rename, which is the argument for deriving the name instead
// of choosing one: there was no second home to disagree with, only a memory.
export interface RunCliOptions {
  /** Corpus specifier `install` falls back to when the cwd has no config.
   *
   *  Passed by whoever composes this CLI. `forge` names no corpus of its own —
   *  it installs what it is handed and refuses when handed nothing. */
  readonly defaultCorpus?: string;
}

/** Run the build-time CLI.
 *
 *  AN ORDINARY EXPORTED FUNCTION, because this is an ordinary ESM module. It used
 *  to build its `cac` instance at module scope and parse `process.argv` on import,
 *  so the only way to configure it was to mutate globals before importing it —
 *  which is what produced an env-var handoff and an argv splice upstream. A
 *  function takes parameters; that was always the mechanism.
 *
 *  The package that owns the `bin` is the only one that needs an executable
 *  shape. Everything it proxies is imported and called, exactly like this. */
export async function runCli(
  argv: string[] = process.argv,
  cliOpts: RunCliOptions = {},
): Promise<void> {
  const cli = cac(FORGE_BIN);

  cli
    .command('init', `Scaffold ${CONFIG_FILE} from a plugin package`)
    .option(
      '--plugin <pkg>',
      'The plugin package to extend (default: the canon corpus)',
    )
    .action(async (opts: { plugin?: string }) => {
      process.exit(await runInit({ plugin: opts.plugin }));
    });

  cli
    .command(
      'add <plugin>',
      `Wire a plugin package into ${CONFIG_FILE} extends`,
    )
    .action(async (plugin: string) => {
      process.exit(await runAdd({ plugin }));
    });

  cli
    .command(
      'compose',
      `Load ${CONFIG_FILE}, resolve the plugin set, and print it (config-is-code)`,
    )
    .option('--config <path>', `config file (default: <cwd>/${CONFIG_FILE})`)
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
    .option('--config <path>', `config file (default: <cwd>/${CONFIG_FILE})`)
    .option('--out <dir>', 'render-tree root (default: <cwd>/.render)')
    .option('--harness <name>', 'harness adapter (default: claude)')
    .action(
      async (opts: { config?: string; out?: string; harness?: string }) => {
        process.exit(
          await runProject({
            config: opts.config,
            out: opts.out,
            harness: opts.harness,
          }),
        );
      },
    );

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
        opts: {
          plan?: string;
          out?: string;
          manifest?: string;
          prior?: string;
        },
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
      'install',
      'Install the default corpus into a harness on this machine (no project needed)',
    )
    .option('--harness <name>', 'harness to install into (default: detected)')
    .option(
      '--plugin <pkg>',
      'corpus package to install (default: the bundled one)',
    )
    .option('--dry-run', 'print what would change; write nothing')
    .action(
      async (opts: {
        harness?: string;
        plugin?: string;
        dryRun?: boolean;
      }) => {
        process.exit(
          await runInstall({
            harness: opts.harness,
            plugin: opts.plugin ?? cliOpts.defaultCorpus,
            dryRun: opts.dryRun,
            home: homedir(),
          }),
        );
      },
    );

  cli
    .command(
      'deploy',
      'Install a rendered corpus into a harness (agents, skills and hooks)',
    )
    .option(
      '--from <dir>',
      'render tree to deploy (default: .cratylus/<harness>, what `project` writes)',
    )
    .option(
      '--agents-dir <dir>',
      'override the agents/ dir inside the render tree',
    )
    .option(
      '--skills-dir <dir>',
      'override the skills/ dir inside the render tree',
    )
    .option(
      '--hooks-dir <dir>',
      'override the hooks root inside the render tree',
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
    .option(
      '--project <dir>',
      'project root for --scope project (default: cwd)',
    )
    .option(
      '--config <path>',
      `config file the corpus's event vocabulary is read from (default: <cwd>/${CONFIG_FILE})`,
    )
    .option('--only <names>', 'comma-separated names to deploy')
    .option('--dry-run', 'print actions, change nothing')
    .option(
      '--check',
      'report where the DEPLOYED tree diverges from the rendered one (stale / absent / foreign); changes nothing',
    )
    .action(
      async (opts: {
        from?: string;
        agentsDir?: string;
        skillsDir?: string;
        hooksDir?: string;
        assets?: string;
        kind: DeployKindArg;
        scope: DeployScope;
        harness?: string;
        home?: string;
        project?: string;
        config?: string;
        only?: string;
        dryRun?: boolean;
        check?: boolean;
      }) => {
        // A USAGE ERROR IS THE CHECK'S OWN FAILURE, NEVER THE HOST'S. Under
        // `--check` this process's exit code is a VERDICT that callers relay — the
        // SessionStart advisory turns it into a line an agent reads. Exiting `1`
        // from an argument check would tell that reader its deployment is stale on
        // the strength of a mistyped flag. Every refusal below is `noVerdict` when
        // a verdict was what was asked for.
        const usage = opts.check ? DEPLOY_CHECK_EXIT.noVerdict : 1;
        // THE RENDER ROOT IS THE DEFAULT INPUT, so the ordinary invocation is
        // `cratylus deploy` and nothing else. Three required path flags were a
        // default this CLI owed its users and did not pay: every caller — including
        // this repository's own package.json, four times over — had to spell the
        // same three paths, which is a private reimplementation of the command's
        // own defaults. `project` writes `.cratylus/<harness>`; `deploy` reads it.
        // The flags remain, now as overrides rather than as the way in.
        const harnessName = opts.harness ?? 'claude';
        // THE RENDER DIR IS NAMED AFTER THE TOOL, so it is DERIVED from the bin rather
        // than spelled — one authored home, which the bin-name census enforces and
        // caught here the moment this line spelled `.cratylus` outright.
        const from = opts.from ?? join(`.${FORGE_BIN}`, harnessName);
        const agentsDir = opts.agentsDir ?? join(from, 'agents');
        const skillsDir = opts.skillsDir ?? join(from, 'skills');
        const hooksDir = opts.hooksDir ?? from;
        // A MISSING RENDER TREE IS THE ONE REFUSAL LEFT, and it names its own cure.
        // Absent dirs used to surface as "--agents-dir is required", which told the
        // user to supply a flag when what they actually needed was to run `project`.
        //
        // IT GUARDS THE DEFAULTED PATH ONLY. A caller that named its dirs outright —
        // the drift comparator does, against a temp fixture — has no stake in whether
        // `.cratylus/<harness>` exists under ITS cwd, and refusing there broke ten
        // tests: the guard reported a missing tree at a path that caller never asked
        // about. A default may only be validated where it was actually used.
        const defaulted =
          !opts.from && !opts.agentsDir && !opts.skillsDir && !opts.hooksDir;
        if (defaulted && !existsSync(from)) {
          console.error(
            `${FORGE_BIN} deploy: no render tree at ${from} — run \`${FORGE_BIN} project\` first, or pass --from <dir>`,
          );
          process.exit(usage);
        }
        let companions: ReturnType<typeof parseCompanions>;
        try {
          companions = parseCompanions(opts.assets ?? null);
        } catch (e) {
          console.error(`${FORGE_BIN} deploy: ${(e as Error).message}`);
          process.exit(usage);
        }
        process.exit(
          await runDeploy({
            agentsDir,
            skillsDir,
            hooksDir,
            companions,
            kind: opts.kind,
            scope: opts.scope,
            harness: opts.harness ?? null,
            home: opts.home ?? null,
            project: opts.project ?? null,
            config: opts.config ?? null,
            only: opts.only ?? null,
            dryRun: opts.dryRun,
            check: opts.check,
          }),
        );
      },
    );

  cli
    .command(
      'explain [agent]',
      'Report each resolved fragment’s provenance: source plugin/patch + final value',
    )
    .option('--config <path>', `config file (default: <cwd>/${CONFIG_FILE})`)
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
    .option('--config <path>', `config file (default: <cwd>/${CONFIG_FILE})`)
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
  // was deleted. Excising the IR-intake lineage removed nine verbs at once
  // (`compile`, `import`, `lint`, `diff`, `watch`, `migrate`, `doctor`, `events`,
  // `import-audit`); this guard is what makes their removal observable instead of
  // silent.
  const parsed = cli.parse(argv, { run: false });
  if (!cli.matchedCommand && parsed.args.length > 0) {
    const known = cli.commands.map((c) => c.name).join(', ');
    console.error(
      `${FORGE_BIN}: unknown command '${parsed.args[0]}' (known: ${known})`,
    );
    process.exit(1);
  }
  cli.runMatchedCommand();
}
