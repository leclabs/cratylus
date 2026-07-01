// Shared deploy-test scaffolding: build a render tree + a `.agent-factory.config`
// fixture in a temp dir, plus a fake ssh fleet (a CommandRunner that simulates
// remote hosts in-memory) so the ssh placer is exercised hermetically — no real
// network, no real ssh.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CommandResult, CommandRunner } from '../../src/deploy/index.js';

export function tmp(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** A minimal but representative render tree: two agents (mav, nico) and two
 *  skills (wake = SKILL-only, memory = dual-deploy with a bundle companion). */
export function buildRenderTree(root: string): {
  agentsDir: string;
  skillsDir: string;
} {
  const agentsDir = join(root, 'agents');
  const skillsDir = join(root, 'skills');
  mkdirSync(agentsDir, { recursive: true });
  for (const name of ['mav', 'nico']) {
    writeFileSync(
      join(agentsDir, `${name}.md`),
      `---\nname: ${name}\n---\n# ${name} def (generated SOUL)\n`,
      'utf-8',
    );
  }
  // wake: plain skill dir (SKILL.md only).
  const wake = join(skillsDir, 'wake');
  mkdirSync(wake, { recursive: true });
  writeFileSync(join(wake, 'SKILL.md'), '# wake\n', 'utf-8');
  // memory: dual-deploy dir (SKILL.md + a bundled tool companion).
  const memory = join(skillsDir, 'memory');
  mkdirSync(memory, { recursive: true });
  writeFileSync(join(memory, 'SKILL.md'), '# memory\n', 'utf-8');
  return { agentsDir, skillsDir };
}

/** A hooks render tree: `<root>/settings.json` (a `{hooks}` fragment with a
 *  Stop + SubagentStop command) + `<root>/hooks/stance-guardrail/<assets>`. */
export function buildHooksTree(root: string): { hooksDir: string } {
  const cmd = 'sh "$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh"';
  const settings = {
    hooks: {
      Stop: [{ hooks: [{ type: 'command', command: cmd, timeout: 60 }] }],
      SubagentStop: [
        { hooks: [{ type: 'command', command: cmd, timeout: 60 }] },
      ],
    },
  };
  writeFileSync(
    join(root, 'settings.json'),
    `${JSON.stringify(settings, null, 2)}\n`,
    'utf-8',
  );
  const hookDir = join(root, 'hooks', 'stance-guardrail');
  mkdirSync(hookDir, { recursive: true });
  for (const f of [
    'stance-guardrail.sh',
    'stance-judge.sh',
    'stance-judge-prompt.md',
  ]) {
    writeFileSync(join(hookDir, f), `# ${f}\n`, 'utf-8');
  }
  return { hooksDir: root };
}

/** A bundle source root with the built `episodic.mjs` present. */
export function buildBundleSrc(root: string, present = true): string {
  const dist = join(root, 'agent-memory', 'dist');
  mkdirSync(dist, { recursive: true });
  if (present) {
    writeFileSync(
      join(dist, 'episodic.mjs'),
      '// built episodic tool\n',
      'utf-8',
    );
  }
  return root;
}

/** The fixture `.agent-factory.config`: a fire(local) + upmav(lcaraccioli) + upgoose
 *  fleet, with upgoose EXCLUDED from --fleet. Mirrors the acceptance contract
 *  (`upmav=lcaraccioli`, `upgoose` excluded-from-fleet). Returns the repo-root
 *  path (the dir holding `.agent-factory.config`). `fireHome` (optional) sandboxes the
 *  local host's `.claude` parent so a fleet test never touches the real `$HOME`. */
export function writeConfig(root: string, fireHome?: string): string {
  mkdirSync(root, { recursive: true });
  const cfg = {
    schema: 1,
    reader: 'strong-llm-lean',
    fleet: { hosts: ['fire', 'upmav', 'upgoose'], exclude: ['upgoose'] },
    host: {
      fire: fireHome ? { local: true, home: fireHome } : { local: true },
      upmav: { user: 'lcaraccioli', hostname: 'upmav.lan', home: '~/.claude' },
      upgoose: { user: 'lcaraccioli', hostname: 'upgoose.lan' },
    },
  };
  writeFileSync(
    join(root, '.agent-factory.config'),
    JSON.stringify(cfg, null, 2),
    'utf-8',
  );
  return root;
}

// ── fake ssh fleet ─────────────────────────────────────────────────────────
// An in-memory fleet: each ssh/scp call is recorded; remote `.claude` trees are
// simulated as plain JS maps. Reachability and seed-if-absent (the `test -e`
// heredoc) are honored so the placer's branching is genuinely exercised.

export interface FakeHost {
  reachable: boolean;
  home: string; // absolute remote $HOME
  // Simulated remote filesystem: absolute path -> content.
  files: Map<string, string>;
}

export interface FakeFleet {
  hosts: Map<string, FakeHost>;
  calls: string[][];
}

export function makeFleet(spec: Record<string, Partial<FakeHost>>): FakeFleet {
  const hosts = new Map<string, FakeHost>();
  for (const [target, h] of Object.entries(spec)) {
    hosts.set(target, {
      reachable: h.reachable ?? true,
      home: h.home ?? '/home/remote',
      files: h.files ?? new Map<string, string>(),
    });
  }
  return { hosts, calls: [] };
}

/** Build a CommandRunner that drives the fake fleet. Understands the exact
 *  shell forms the ssh placer emits: reachability `true`, `printf %s "$HOME"`,
 *  `mkdir -p`, the seed-if-absent `if [ -e ... ] heredoc`, and `scp`. */
export function fakeRunner(fleet: FakeFleet): CommandRunner {
  return (cmd: string[]): CommandResult => {
    fleet.calls.push(cmd);
    const [bin, ...rest] = cmd;
    if (bin === 'ssh') {
      // target is the `user@host` arg (the remote command is the last arg; the
      // `-o KEY=VAL` pairs precede the target). Match on the `@` form.
      const target = rest.find((a) => a.includes('@')) as string;
      const host = fleet.hosts.get(target);
      const script = rest[rest.length - 1] as string;
      if (!host || !host.reachable) {
        return { rc: 255, out: 'ssh: connect: Connection refused' };
      }
      if (script === 'true') {
        return { rc: 0, out: '' };
      }
      if (script.includes('printf %s "$HOME"')) {
        return { rc: 0, out: host.home };
      }
      if (script.startsWith('mkdir -p')) {
        return { rc: 0, out: '' };
      }
      // seed-if-absent heredoc: `if [ -e <path> ]; then echo PRESENT; else cat > <path> <<'MIND_SEED_EOF'\n...\nMIND_SEED_EOF\n echo SEEDED; fi`.
      // The path is shell-quoted only when it contains a special char; safe
      // paths are emitted bare. Match both forms.
      const m = script.match(/if \[ -e (?:'([^']+)'|(\S+)) \]/);
      if (m) {
        const path = (m[1] ?? m[2]) as string;
        if (host.files.has(path)) {
          return { rc: 0, out: 'PRESENT' };
        }
        // Capture seeded content from the heredoc body.
        const body = script.match(
          /<<'MIND_SEED_EOF'\n([\s\S]*)\nMIND_SEED_EOF/,
        );
        host.files.set(path, body ? (body[1] as string) : '');
        return { rc: 0, out: 'SEEDED' };
      }
      return { rc: 0, out: '' };
    }
    if (bin === 'scp') {
      // scp -q <src> <user@host>:<remotePath>
      const dest = rest[rest.length - 1] as string;
      const colon = dest.indexOf(':');
      const target = dest.slice(0, colon);
      const remotePath = dest.slice(colon + 1);
      const host = fleet.hosts.get(target);
      if (!host || !host.reachable) {
        return { rc: 1, out: 'scp: connection failed' };
      }
      host.files.set(remotePath, '<copied>');
      return { rc: 0, out: '' };
    }
    return { rc: 0, out: '' };
  };
}
