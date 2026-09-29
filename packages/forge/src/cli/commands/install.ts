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
import { createInterface } from 'node:readline/promises';
import pc from 'picocolors';
import {
  HARNESS_NAMES,
  type HarnessAdapter,
  type RoleRouting,
  adapterByName,
} from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import { loadConfig } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import {
  addModelRoles,
  describePersonaCommands,
  ensureBadgeStatusLine,
  ensureStatusSegment,
  modelRoleLine,
  personaLauncherOf,
  placePersonaCommands,
  planPersonaCommands,
  treeNames,
} from '../../deploy/index.js';
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
  /** Link a command named after each installed persona into `~/.local/bin` without
   *  asking (`--link-persona-commands`). Without it, an interactive install asks first and
   *  a non-interactive one places none and says how to. */
  linkPersonaCommands?: boolean;
  /** Wrap the host's own Claude Code status line in the persona badge instead of only
   *  offering to (`--wrap-status-line`). Without it, a status line the host already
   *  has is left exactly as it is. */
  wrapStatusLine?: boolean;
  /** Asked before linking, when `linkPersonaCommands` is absent. Default: a yes/no prompt
   *  on a terminal, and `false` where stdin or stdout is not one. */
  confirm?: (question: string) => Promise<boolean>;
  /** `PATH`, for the on-PATH report. Default: the process's. */
  pathEnv?: string;
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

    const rc = await runDeploy({
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
      // THE PLUGIN SET TRAVELS WITH THE CALL. `install` has no config file by definition,
      // so deploy must be handed the plugin set rather than sent to read it back off
      // disk — otherwise the zero-config path deploys agents and skills onto a host
      // whose runtime cannot validate an event name or read the configuration its
      // capabilities need.
      plugins,
      dryRun: opts.dryRun,
      check: false,
    });
    // The routes the definitions just placed name roles; the host maps a role to a
    // model. Deploy is unchanged — this is install's own step, and a deploy that
    // failed places no routes to back.
    if (rc === 0) {
      seedModelRoles(
        adapter,
        report.heldRoles,
        opts.home,
        opts.dryRun ?? false,
      );
      const personas = treeNames(
        'agent',
        {
          agentsDir: resolve(stage, 'agents'),
          skillsDir: resolve(stage, 'skills'),
        },
        adapter.agentExt,
      );
      // Then the badge, which is what the operator sees of those personas: the host's
      // own status line, made to show it.
      showPersonaBadge(adapter, personas, opts);
      // Then the persona commands: install's own step too, after the launcher they
      // link to has been placed.
      await linkPersonaCommands(adapter, personas, opts);
    }
    return rc;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

/**
 * Say what commands named after the installed personas would be placed in the user's
 * bin dir, and place them when asked — by `--link-persona-commands`, or by the operator at a
 * terminal. Anywhere else nothing is placed and the report says how to.
 *
 * The launcher a command links to is the harness's, and every OTHER harness's is
 * passed along so a name already taken by one is reported as held by it.
 */
async function linkPersonaCommands(
  adapter: HarnessAdapter,
  personas: readonly string[],
  opts: InstallCmdOpts & { home: string },
): Promise<void> {
  const self = personaLauncherOf(opts.home, adapter);
  if (self === undefined || personas.length === 0) return;
  const common = {
    home: opts.home,
    harnessDir: join(opts.home, adapter.home),
    self,
    personas,
    peers: HARNESS_NAMES.filter((n) => n !== adapter.name).flatMap((n) => {
      const peer = personaLauncherOf(opts.home, adapterByName(n));
      return peer ? [peer] : [];
    }),
    ...(opts.pathEnv !== undefined ? { pathEnv: opts.pathEnv } : {}),
  };
  const dry = opts.dryRun ?? false;
  const say = (lines: readonly string[]): void => {
    for (const line of lines) process.stdout.write(`${line}\n`);
  };

  if (opts.linkPersonaCommands) {
    say(describePersonaCommands(placePersonaCommands({ ...common, dry }), dry));
    return;
  }
  const plan = planPersonaCommands(common);
  say(describePersonaCommands(plan, true));
  const count = (state: 'place' | 'adopt') =>
    plan.links.filter((l) => l.state === state).length;
  const link = count('place');
  const adopt = count('adopt');
  if (link + adopt === 0) return;
  const commands = (n: number) => `${n} persona command${n === 1 ? '' : 's'}`;
  // What YES does, in the two ways it acts: a free name is linked, and a hand-made
  // link to this launcher is only recorded — so the two are counted apart.
  const question =
    link === 0
      ? `Adopt ${commands(adopt)} already linked in ${plan.binDir}?`
      : `Link ${commands(link)} into ${plan.binDir}${adopt > 0 ? `, and adopt ${adopt} already linked there` : ''}?`;
  const confirm = opts.confirm ?? askOnTerminal;
  if (!dry && (await confirm(question))) {
    say(describePersonaCommands(placePersonaCommands(common), false));
    return;
  }
  say(['  none placed — pass --link-persona-commands to link them']);
}

/** A yes/no question on the terminal; `false` — no answer given — where stdin or
 *  stdout is not one, which is what keeps a piped or scripted install from
 *  placing anything it was not told to. */
async function askOnTerminal(question: string): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return /^y(es)?$/i.test((await rl.question(`${question} [y/N] `)).trim());
  } finally {
    rl.close();
  }
}

/** The host config file omp reads its settings from, and so the one to edit: the
 *  FIRST that exists, because omp ignores the rest; a host with none gets the first,
 *  and never a file that would shadow one it already has. */
function hostConfigPath(
  adapter: HarnessAdapter,
  routing: RoleRouting,
  home: string,
): string {
  const candidates = routing.configRels.map((rel) =>
    join(home, adapter.home, rel),
  );
  return candidates.find((p) => existsSync(p)) ?? (candidates[0] as string);
}

/**
 * Make the host's status line show the persona badge the projection just placed, and
 * say what was done. Nothing is placed when no persona was installed, so there is no
 * badge to show.
 *
 * The two harnesses' status lines differ in kind. Claude Code's is ONE command
 * (`adapter.statusLine` declares the worker that fills it): set where the host has
 * none, and never replaced where it has one — only offered a wrap, done under
 * `--wrap-status-line`. omp's is a list of segments, which shows an extension's
 * status only where it lists `status`: install adds it to the config file omp reads.
 * Either failure to edit is reported and the install itself still succeeds.
 */
function showPersonaBadge(
  adapter: HarnessAdapter,
  personas: readonly string[],
  opts: InstallCmdOpts & { home: string },
): void {
  if (personas.length === 0) return;
  const dry = opts.dryRun ?? false;
  const say = (line: string): void => {
    process.stdout.write(`${line}\n`);
  };
  const refused = (path: string, why: string, leftAs: string): void => {
    process.stderr.write(
      `${pc.yellow('!')} ${CLI_BIN} install: did not edit ${path} — ${why}. ${leftAs}\n`,
    );
  };

  const worker = adapter.statusLine;
  if (worker !== undefined) {
    const path = join(opts.home, adapter.home, adapter.hooksFile);
    const result = ensureBadgeStatusLine(path, worker.command, {
      dry,
      wrap: opts.wrapStatusLine ?? false,
    });
    const tag = `statusLine${dry ? ' (dry-run)' : ''}: ${path}`;
    switch (result.state) {
      case 'set':
        say(
          `  ${tag} — ${dry ? 'would set' : 'set'} to the persona badge (${worker.command})`,
        );
        return;
      case 'wrapped':
        say(
          `  ${tag} — ${dry ? 'would wrap' : 'wrapped'} the host's status line command in the persona badge`,
        );
        return;
      case 'kept':
        say(`  statusLine: ${path} — already shows the persona badge`);
        return;
      case 'offer':
        say(
          `  statusLine: ${path} — the host's own status line, left as it is; pass --wrap-status-line to show the persona badge in front of its output`,
        );
        return;
      case 'refused':
        refused(
          path,
          result.refused as string,
          'The persona badge is not on the status line.',
        );
        return;
    }
  }

  // The one harness whose status line takes segments. Its config file is the one its
  // role routing already names, because that is the file omp reads settings from.
  if (adapter.name === 'omp' && adapter.roleRouting !== undefined) {
    const path = hostConfigPath(adapter, adapter.roleRouting, opts.home);
    const result = ensureStatusSegment(path, { dry });
    if (result.state === 'refused') {
      refused(
        path,
        result.refused as string,
        'The persona badge renders beneath the status line, not in it.',
      );
      return;
    }
    if (result.state === 'present') {
      say(`  statusLine.leftSegments: ${path} — \`status\` already listed`);
      return;
    }
    say(
      `  statusLine.leftSegments${dry ? ' (dry-run)' : ''}: ${path} — ${dry ? 'would add' : 'added'} ${result.written.join(', ')}`,
    );
  }
}

/**
 * Give every held role the host has not mapped an entry aliasing the harness's
 * nearest built-in role, and say what was added. An entry the host already has is
 * never changed; a `modelRoles` that cannot be safely extended is reported and
 * left as it is — the install itself still succeeds.
 */
function seedModelRoles(
  adapter: HarnessAdapter,
  heldRoles: readonly string[],
  home: string,
  dry: boolean,
): void {
  const routing = adapter.roleRouting;
  if (routing === undefined || heldRoles.length === 0) return;
  const path = hostConfigPath(adapter, routing, home);
  const result = addModelRoles(
    path,
    heldRoles.map((role) => ({ role, value: `@${routing.nearest(role)}` })),
    { dry },
  );
  if (result.refused !== undefined) {
    process.stderr.write(
      `${pc.yellow('!')} ${CLI_BIN} install: did not edit ${path} — ${result.refused}. Held roles ${heldRoles.join(', ')} fall back to \`${routing.defaultRole}\`.\n`,
    );
    return;
  }
  if (result.added.length === 0) {
    process.stdout.write(`  modelRoles: ${path} — no entry was missing\n`);
    return;
  }
  process.stdout.write(
    `  modelRoles${result.wrote ? '' : ' (dry-run)'}: ${path} — ${result.wrote ? 'added' : 'would add'}\n`,
  );
  for (const entry of result.added) {
    process.stdout.write(`    ${modelRoleLine(entry, '')}\n`);
  }
}
