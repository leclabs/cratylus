// `koine found <target>` — found a mind-society in a target dir (the deploy
// layer's `init` capability, named `found` at the CLI to avoid colliding with
// `koine init`, which bootstraps a `.koine/` IR dir). Projects the full render
// tree into <target>/.claude/{agents,skills} + lays the founding AGENTS.md +
// plans scaffold; clobber-guarded; does NOT seed sidecars.
//
// Faithful CLI port of `toolkit/init.py main()`.

import pc from 'picocolors';
import { type RenderTree, initSociety } from '../../deploy/index.js';

export interface FoundCmdOpts {
  target: string;
  agentsDir: string;
  skillsDir: string;
  subject?: string;
  force?: boolean;
}

export async function runFound(opts: FoundCmdOpts): Promise<number> {
  const tree: RenderTree = {
    agentsDir: opts.agentsDir,
    skillsDir: opts.skillsDir,
  };
  const r = initSociety({
    target: opts.target,
    tree,
    subject: opts.subject,
    force: opts.force,
    log: (line) => console.log(line),
    warn: (line) => console.error(pc.red(line)),
  });
  return r.rc;
}
