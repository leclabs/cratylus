// The CODEX consumer projection command — the second-harness counterpart of
// `project-cli.ts`, and now its MIRROR IMAGE: `projectPluginSet` + `writeRenderTree`,
// with the harness adapter selected BY NAME as the only difference between them.
// Agents → `agents/<name>.toml`, skills → `skills/<name>/SKILL.md`, plus the
// `AGENTS.md` instruction surface — all of it rendered by forge.
//
// This IS the T2.4 proof: a agent-canon agent authored ONCE reaches a second agent-forge
// harness for free — the only new code is which harness the walk selects by name.
//
// It used to reimplement the pipeline instead: its own dir scanning, its own module
// loading, its own `ResolvedSkill` assembly, its own shim emitter, three
// `writeFileSync` sites. That second implementation drifted exactly once and shipped
// SESSIONLESS runtime shims to every codex-projected skill for the life of the
// divergence. There is one projector now, and this CLI is one of its callers.
//
// Usage:  tsx src/toolkit/project-cli-codex.ts [--out <dir>]
//   default out:  packages/agent-canon/.render-ts-codex   (gitignored; separate from .render-ts)

import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@leclabs/agent-forge/adapters/registry';
import {
  projectPluginSet,
  writeRenderTree,
} from '@leclabs/agent-forge/project';
import canonPlugin from '../index.js';

// The harness projection port, selected strictly BY NAME — no concrete codex
// adapter module is imported here (the projection logic lives in forge).
const adapter = adapterByName('codex');

// THE WHOLE PLUGIN, hooks included. This site used to delete canon's hooks dir from
// the codex plugin set, on the claim "Codex declares NO hook surface". That claim
// was false — codex has `~/.codex/hooks.json` — and the deletion meant every codex
// agent ran with no stance guardrail, no memory nudge and no resume notice. Nothing
// reported it, because the omission was authored as if it were a considered fact.
//
// A build step must not decide what the design IS. The canon says what governs an
// agent; the adapter says how this harness expresses it; and where a harness truly
// cannot, the projector DEGRADES and warns. Subsetting the input here is none of
// those — it is the projection silently editing the canon.
const codexPlugin = canonPlugin;

const here = dirname(fileURLToPath(import.meta.url));
const anatomyRoot = join(here, '..', '..');

interface Args {
  out: string;
}

function parseArgs(argv: string[]): Args {
  let out = join(anatomyRoot, '.render-ts-codex');
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') {
      const v = argv[++i];
      if (!v) {
        throw new Error('--out requires a value');
      }
      out = v;
    } else {
      throw new Error(`unknown arg ${a}`);
    }
  }
  return { out };
}

async function projectCells(out: string): Promise<{
  agents: number;
  skills: number;
}> {
  // The SAME call `project-cli.ts` makes, over the same plugin, differing only in
  // the adapter. See that file for why `resolvedBodies` is deliberately not passed.
  const { files, agents, skills } = await projectPluginSet({
    plugins: [codexPlugin],
    adapter,
    log: (line) => process.stdout.write(`${line}\n`),
  });
  writeRenderTree(out, files);
  return { agents, skills };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  // Clean the out dir first — a removed/renamed cell must not leave a stale render.
  rmSync(args.out, { recursive: true, force: true });
  const { agents, skills } = await projectCells(args.out);
  process.stdout.write(
    `projected ${agents} agents + ${skills} skills + AGENTS.md to ${args.out}\n`,
  );
}
