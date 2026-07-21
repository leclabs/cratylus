import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dump } from 'js-yaml';
import pc from 'picocolors';
import { scaffoldAgentsConfig } from '../../config/index.js';
import { type Manifest, type Scope, defaultIRRoot } from '../../core/index.js';

export interface InitOpts {
  scope?: Scope;
  cwd?: string;
}

export async function runInit(opts: InitOpts = {}): Promise<number> {
  const scope = opts.scope ?? 'project';
  const cwd = opts.cwd ?? process.cwd();
  const root = defaultIRRoot(scope, cwd);

  if (existsSync(root)) {
    console.error(pc.red(`agent-forge: ${root} already exists`));
    return 1;
  }

  await mkdir(root, { recursive: true });
  for (const sub of ['rules', 'skills', 'commands', 'agents', 'hooks', 'mcp']) {
    await mkdir(join(root, sub), { recursive: true });
  }

  const manifest: Manifest = { agentForge: 1, scope, targets: [] };
  await writeFile(
    join(root, 'manifest.yaml'),
    dump(manifest, { lineWidth: 100, noRefs: true }),
    'utf8',
  );

  // For project scope, append .agent-forge/local to .gitignore if it exists.
  if (scope === 'project') {
    const gi = join(cwd, '.gitignore');
    if (existsSync(gi)) {
      const text = await readFile(gi, 'utf8');
      if (!text.includes('.agent-forge/local')) {
        await writeFile(
          gi,
          `${text + (text.endsWith('\n') ? '' : '\n')}.agent-forge/local/\n`,
          'utf8',
        );
      }
    }
  }

  console.log(pc.green('✓'), `initialized ${root}`);

  // Scaffold the config-is-code home (NORTH-STAR §5): `agents.config.ts` with the
  // zero-config default `extends: [anatomy]`. Project-scoped only — it is a
  // project-root artifact, not a per-user (`--scope user`) concern. Idempotent:
  // an existing config is left untouched. (P6's founding-CLI restructure folds
  // `found`→`init`-via-defaults; P4 adds the config scaffold non-breakingly.)
  if (scope === 'project') {
    const scaffold = await scaffoldAgentsConfig(cwd);
    console.log(
      scaffold.created ? pc.green('✓') : pc.gray('•'),
      scaffold.created
        ? `scaffolded ${scaffold.path} (extends: [anatomy])`
        : `${scaffold.path} already exists — left untouched`,
    );
  }
  return 0;
}
