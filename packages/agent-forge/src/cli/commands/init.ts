import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dump } from 'js-yaml';
import pc from 'picocolors';
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
    console.error(pc.red(`koine: ${root} already exists`));
    return 1;
  }

  await mkdir(root, { recursive: true });
  for (const sub of ['rules', 'skills', 'commands', 'agents', 'hooks', 'mcp']) {
    await mkdir(join(root, sub), { recursive: true });
  }

  const manifest: Manifest = { koine: 1, scope, targets: [] };
  await writeFile(
    join(root, 'manifest.yaml'),
    dump(manifest, { lineWidth: 100, noRefs: true }),
    'utf8',
  );

  // For project scope, append .koine/local to .gitignore if it exists.
  if (scope === 'project') {
    const gi = join(cwd, '.gitignore');
    if (existsSync(gi)) {
      const text = await readFile(gi, 'utf8');
      if (!text.includes('.koine/local')) {
        await writeFile(
          gi,
          `${text + (text.endsWith('\n') ? '' : '\n')}.koine/local/\n`,
          'utf8',
        );
      }
    }
  }

  console.log(pc.green('✓'), `initialized ${root}`);
  return 0;
}
