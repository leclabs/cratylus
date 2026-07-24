// `agent-forge init` — scaffold a project from the default plugin.
//
// `init` scaffolds `agents.config.ts` — the config-is-code home whose
// zero-config default `extends: [canon]` (empty `patches`). The default is A
// PACKAGE (the agent-canon plugin), never a special-cased template: composing
// that config runs the canon default through the normal `resolve()`
// (NORTH-STAR §2). `agent-forge add <plugin>` wires more plugins in.
//
// The retired greenfield-founding CLI (`found`) is subsumed here: the project is
// scaffolded FROM the default plugin (resolved through `resolve()`), not from a
// baked-in founding template.
//
// depalimpsest-ir-intake S6: `init` used to ALSO bootstrap a `.agent-forge/` IR
// home (manifest.yaml + six resource dirs) and append `.agent-forge/local/` to
// .gitignore. That was the entry point of the excised IR-intake lineage — with
// no `import`, `compile`, or IR left, the directory has no producer and no
// consumer. The `--scope` option went with it: it selected the IR root and
// nothing else, so keeping it would be a parse-and-ignore flag.

import pc from 'picocolors';
import { scaffoldAgentsConfig } from '../../config/index.js';

export interface InitOpts {
  cwd?: string;
}

export async function runInit(opts: InitOpts = {}): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();

  // Scaffold the config-is-code home (NORTH-STAR §5): `agents.config.ts` with the
  // zero-config default `extends: [canon]` (the default IS the canon plugin,
  // resolved through `resolve()` — defaults-are-a-package, NORTH-STAR §2).
  // Idempotent: an existing config is left untouched.
  const scaffold = await scaffoldAgentsConfig(cwd);
  console.log(
    scaffold.created ? pc.green('✓') : pc.gray('•'),
    scaffold.created
      ? `scaffolded ${scaffold.path} (extends: [canon])`
      : `${scaffold.path} already exists — left untouched`,
  );
  return 0;
}
