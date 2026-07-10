// found-cli.ts — the anatomy-side FOUNDING PATH: found a polis in a target dir by
// injecting agent-anatomy's `polisFoundingTemplate` (the corpus founding doctrine)
// into the doctrine-agnostic `initSociety` ENGINE (`@leclabs/agent-forge/deploy`).
// This is the composition root that binds the polis DATA to the forge engine — the
// forge CLI (`agent-forge found`) stays doctrine-agnostic (engine default); THIS
// path is where the polis doctrine is injected.
//
// Usage:  tsx src/toolkit/found-cli.ts --target <dir> [--agents-dir <dir>]
//                                       [--skills-dir <dir>] [--subject <text>] [--force]
//   default render tree:  <anatomyRoot>/.render-ts/{agents,skills}  (from project-cli)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type RenderTree, initSociety } from '@leclabs/agent-forge/deploy';
import { polisFoundingTemplate } from './founding-template.js';

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

/** Found a polis: inject the polis founding template into the forge engine. */
export function foundPolis(args: Args): number {
  const tree: RenderTree = {
    agentsDir: args.agentsDir,
    skillsDir: args.skillsDir,
  };
  const r = initSociety({
    target: args.target,
    tree,
    template: polisFoundingTemplate,
    subject: args.subject,
    force: args.force,
    log: (line) => process.stdout.write(`${line}\n`),
    warn: (line) => process.stderr.write(`${line}\n`),
  });
  return r.rc;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(foundPolis(parseArgs(process.argv.slice(2))));
}
