// scaffold-cli.ts — the anatomy-side SCAFFOLD PATH: scaffold a project in a target
// dir by injecting agent-canon's `anatomyProjectTemplate` (the corpus project
// doctrine) into the doctrine-agnostic `scaffoldProject` ENGINE
// (`@leclabs/agent-forge/deploy`). This is the composition root that binds the
// anatomy project DATA to the forge engine — the engine stays doctrine-agnostic;
// THIS path is where the anatomy project doctrine is injected.
//
// Usage:  tsx src/toolkit/scaffold-cli.ts --target <dir> [--agents-dir <dir>]
//                                          [--skills-dir <dir>] [--subject <text>] [--force]
//   default render tree:  <anatomyRoot>/.render-ts/{agents,skills}  (from `pnpm canon:project`)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type RenderTree, scaffoldProject } from '@leclabs/agent-forge/deploy';
import { anatomyProjectTemplate } from './project-template.js';

const here = dirname(fileURLToPath(import.meta.url));
const anatomyRoot = join(here, '..', '..');
const renderRoot = join(anatomyRoot, '.render-ts');

interface Args {
  target: string;
  agentsDir: string;
  skillsDir: string;
  subject?: string;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  let target: string | undefined;
  let agentsDir = join(renderRoot, 'agents');
  let skillsDir = join(renderRoot, 'skills');
  let subject: string | undefined;
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target') {
      target = argv[++i];
    } else if (a === '--agents-dir') {
      agentsDir = argv[++i] ?? agentsDir;
    } else if (a === '--skills-dir') {
      skillsDir = argv[++i] ?? skillsDir;
    } else if (a === '--subject') {
      subject = argv[++i];
    } else if (a === '--force') {
      force = true;
    } else {
      throw new Error(`unknown arg ${a}`);
    }
  }
  if (!target) {
    throw new Error('--target <dir> is required');
  }
  return { target, agentsDir, skillsDir, subject, force };
}

/** Scaffold an anatomy project: inject the anatomy project template into the engine. */
export function scaffoldAnatomyProject(args: Args): number {
  const tree: RenderTree = {
    agentsDir: args.agentsDir,
    skillsDir: args.skillsDir,
  };
  const r = scaffoldProject({
    target: args.target,
    tree,
    template: anatomyProjectTemplate,
    subject: args.subject,
    force: args.force,
    log: (line) => process.stdout.write(`${line}\n`),
    warn: (line) => process.stderr.write(`${line}\n`),
  });
  return r.rc;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(scaffoldAnatomyProject(parseArgs(process.argv.slice(2))));
}
