// `cratylus install [--harness <name>]` — the zero-config path, for an operator who
// is not in a project at all.
//
// WHY THIS IS A DIFFERENT VERB FROM `deploy`. `project`/`deploy` serve a repository:
// a corpus is named in a config, rendered into a tree the repo owns, and placed. That
// is the right shape for a team pinning a corpus to a codebase, and the wrong shape
// for the far more common case — someone who wants their agents on this machine and
// has no repository in hand at all. Asking them to `npm init`, write a config, and
// learn a two-stage pipeline to obtain the DEFAULT answer is the friction this verb
// removes.
//
// The prior art is exact: `graphify install [--platform P]` copies its skill into the
// detected platform's config dir, with no project and no config file. Same shape here.
//
// WHAT MAKES IT SAFE TO DEFAULT A CORPUS HERE, when `project` must not. The corpus is
// not INVENTED by the projector — it arrives as `--plugin`, an ordinary flag. `forge`
// still knows no corpus: it installs what it was told to and refuses when it was told
// nothing. The hub package supplies the default because it is the only package
// permitted to know both halves.
//
// A CONFIG STILL WINS. If the cwd has one, `install` uses it — otherwise the operator
// who wrote a config would be silently ignored by the friendliest command on the
// surface, which is the sharpest way to lose their trust.

import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import pc from 'picocolors';
import { HARNESS_NAMES, adapterByName } from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import { loadConfig } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import {
  type ProjectablePlugin,
  discoverFragments,
  projectPluginSet,
  resolveFragmentBodies,
  writeRenderTree,
} from '../../project/index.js';
import type { AgentPlugin } from '../../resolve/index.js';
import { runDeploy } from './deploy.js';

export interface InstallCmdOpts {
  /** Harness adapter name; detected from the host when omitted. */
  harness?: string;
  /** A corpus package to resolve at run time — the operator's explicit `--plugin`.
   *  Naming a foreign package by string is the one case that genuinely requires a
   *  dynamic import; the DEFAULT never takes this path. */
  plugin?: string;
  /** The corpus this CLI was composed with, imported statically by its owner. */
  corpus?: AgentPlugin;
  dryRun?: boolean;
  cwd?: string;
}

/** Which harnesses this host actually has, by the home each adapter declares.
 *
 *  DETECTION IS OFFERED, NEVER ASSUMED. `project` may not guess a harness — a render
 *  tree that depends on which harness happens to be installed is not `REGENERABLE`,
 *  and that is a property about ARTIFACTS. `install` writes no artifact a build
 *  reproduces; it acts on THIS machine, where "which harnesses are here" is the
 *  question being asked rather than a variable leaking into an output. */
export function detectHarnesses(home: string): string[] {
  return HARNESS_NAMES.filter((name) =>
    existsSync(join(home, adapterByName(name).home)),
  );
}

export async function runInstall(
  opts: InstallCmdOpts & { home: string },
): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();

  // ── WHICH HARNESS ────────────────────────────────────────────────────────────
  let harness = opts.harness;
  if (harness === undefined) {
    const found = detectHarnesses(opts.home);
    if (found.length === 0) {
      process.stderr.write(
        `${pc.red('✗')} ${CLI_BIN} install: no harness found under ${opts.home} — ` +
          `looked for ${HARNESS_NAMES.map((n) => adapterByName(n).home).join(', ')}. ` +
          `Name one with --harness <${HARNESS_NAMES.join('|')}>.\n`,
      );
      return 1;
    }
    if (found.length > 1) {
      // AMBIGUITY IS SURFACED, NOT BROKEN BY A COIN FLIP. Two harnesses on one host
      // is a legitimate setup, and picking one silently would install an agent into
      // a harness the operator was not thinking about.
      process.stderr.write(
        `${pc.yellow('!')} ${CLI_BIN} install: found ${found.join(' and ')} — ` +
          `name one with --harness <${found.join('|')}>.\n`,
      );
      return 1;
    }
    harness = found[0] as string;
  }
  const adapter = adapterByName(harness);

  // ── WHICH CORPUS ─────────────────────────────────────────────────────────────
  const configPath = join(cwd, CONFIG_FILE);
  const specifier = opts.plugin;
  let plugins: readonly AgentPlugin[];
  let source: string;

  if (existsSync(configPath)) {
    const config = await loadConfig(configPath);
    plugins = config.extends;
    source = configPath;
  } else if (opts.corpus !== undefined) {
    plugins = [opts.corpus];
    source = 'the corpus this command was built with';
  } else if (specifier !== undefined && specifier !== '') {
    const mod = (await import(specifier)) as { default?: AgentPlugin };
    if (mod.default === undefined) {
      process.stderr.write(
        `${pc.red('✗')} ${CLI_BIN} install: '${specifier}' has no default export — a corpus package default-exports its plugin.\n`,
      );
      return 1;
    }
    plugins = [mod.default];
    source = specifier;
  } else {
    // The refusal a LIBRARY owes: no corpus was named, and inventing one is the one
    // thing this package may never do.
    process.stderr.write(
      `${pc.red('✗')} ${CLI_BIN} install: no corpus — write a ${CONFIG_FILE}, pass --plugin <package>, or mount this CLI from a package that names one.\n`,
    );
    return 1;
  }

  process.stdout.write(
    `${pc.gray(`corpus: ${source}`)}\n${pc.gray(`harness: ${harness} → ${join(opts.home, adapter.home)}`)}\n`,
  );

  // ── RENDER, THEN PLACE ───────────────────────────────────────────────────────
  // The tree is a TEMP artifact and is removed. `install` is not `project`: the
  // operator asked for agents on their machine, not for a render tree to keep, and
  // leaving one in their cwd would be this command inventing a project for someone
  // who told us they have none.
  const stage = mkdtempSync(join(tmpdir(), `${CLI_BIN}-install-`));
  try {
    const resolvedBodies = resolveFragmentBodies(
      await discoverFragments(plugins),
      [],
    );
    const report = await projectPluginSet({
      plugins,
      adapter,
      resolvedBodies,
      log: () => {},
    });
    writeRenderTree(stage, report.files);

    return await runDeploy({
      agentsDir: resolve(stage, 'agents'),
      skillsDir: resolve(stage, 'skills'),
      hooksDir: stage,
      companions: {},
      kind: 'all',
      scope: 'user',
      harness,
      home: opts.home,
      project: null,
      config: existsSync(configPath) ? configPath : null,
      only: null,
      // THE VOCABULARY TRAVELS WITH THE CORPUS. `install` has no config file by
      // definition, so deploy must be handed the events rather than sent to read
      // them back off disk — otherwise the zero-config path deploys agents and
      // skills onto a host whose runtime cannot validate an event name.
      events: [...new Set(plugins.flatMap((p) => p.events ?? []))],
      dryRun: opts.dryRun,
      check: false,
    });
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}
