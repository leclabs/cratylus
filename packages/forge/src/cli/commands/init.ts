// `forge init` — scaffold a project from the default plugin.
//
// `init` scaffolds `agents.config.ts` — the config-is-code home whose
// zero-config default `extends: [canon]` (empty `patches`). The default is A
// PACKAGE (the canon plugin), never a special-cased template: composing
// that config runs the canon default through the normal `resolve()`
// (NORTH-STAR §2). `forge add <plugin>` wires more plugins in.
//
// The retired greenfield-founding CLI (`found`) is subsumed here: the project is
// scaffolded FROM the default plugin (resolved through `resolve()`), not from a
// baked-in founding template.
//
// `init` used to ALSO bootstrap a `.forge/` IR home (manifest.yaml + six
// resource dirs) and append `.forge/local/` to .gitignore. That was the entry
// point of the IR-intake lineage, which has since been deleted — with no
// `import`, `compile`, or IR left, the directory has no producer and no
// consumer. The `--scope` option went with it: it selected the IR root and
// nothing else, so keeping it would be a parse-and-ignore flag.
//
// `--plugin` (added 2026-08-05) is NOT that flag returning.
// `--scope` named an IR root that no longer exists; this names the PLUGIN PACKAGE
// the scaffold extends, which is read and load-bearing. The projector must not
// decide which corpus a project extends — that is projection fusing with meaning
// (ARCHITECTURE, property 3: the corpus reaches forge as DATA).

import pc from 'picocolors';
import { scaffoldAgentsConfig } from '../../config/index.js';

export interface InitOpts {
  cwd?: string;
  /** The plugin package the scaffold extends. Defaults to `DEFAULT_PLUGIN_PACKAGE`. */
  plugin?: string;
}

export async function runInit(opts: InitOpts = {}): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();

  // Scaffold the config-is-code home (NORTH-STAR §5): `agents.config.ts` with the
  // zero-config default `extends: [canon]` (the default IS the canon plugin,
  // resolved through `resolve()` — defaults-are-a-package, NORTH-STAR §2).
  // Idempotent: an existing config is left untouched.
  const scaffold = await scaffoldAgentsConfig(cwd, { plugin: opts.plugin });
  console.log(
    scaffold.created ? pc.green('✓') : pc.gray('•'),
    scaffold.created
      ? `scaffolded ${scaffold.path} (extends: ${scaffold.plugin})`
      : `${scaffold.path} already exists — left untouched`,
  );
  return 0;
}
