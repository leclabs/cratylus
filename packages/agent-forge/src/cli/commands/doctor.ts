import { existsSync, lstatSync, readdirSync, readlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { load } from 'js-yaml';
import pc from 'picocolors';
import {
  type Adapter,
  type Manifest,
  STATE_FILENAME,
  STATE_VERSION,
  type Scope,
  defaultIRRoot,
  detectDrift,
  findIRRoot,
  formatErrors,
  validateManifest,
} from '../../core/index.js';

export interface DoctorOpts {
  scope?: Scope;
  cwd?: string;
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  label: string;
  detail?: string;
}

function fmt(r: CheckResult): string {
  const sym =
    r.status === 'pass'
      ? pc.green('✓')
      : r.status === 'warn'
        ? pc.yellow('⚠')
        : pc.red('✗');
  const detail = r.detail ? pc.gray(`  ${r.detail}`) : '';
  return `${sym} ${r.label}${detail}`;
}

export async function runDoctor(
  opts: DoctorOpts,
  adapters: Adapter[],
): Promise<number> {
  const scope = opts.scope ?? 'project';
  const cwd = opts.cwd ?? process.cwd();
  const root = findIRRoot(scope, cwd);
  const targetRoot = root ?? defaultIRRoot(scope, cwd);

  console.log(
    pc.bold('agent-forge doctor'),
    pc.gray(`(scope: ${scope}, cwd: ${cwd})`),
  );
  console.log('');

  let failures = 0;
  let warnings = 0;

  // 0. .claude/skills mirror-drift guard (E7.S4). .agents/skills/<name> is
  // the authored-once source; .claude/skills/<name> must resolve to the
  // identical skill — a verified symlink, or a byte-equal SKILL.md copy.
  // Needs no `.agent-forge/` IR home, so it runs ahead of that gate.
  const mirrorBase = scope === 'user' ? homedir() : cwd;
  const sourceSkillsDir = join(mirrorBase, '.agents', 'skills');
  const mirrorSkillsDir = join(mirrorBase, '.claude', 'skills');
  if (existsSync(mirrorSkillsDir)) {
    let mirrorNames: string[] = [];
    try {
      mirrorNames = readdirSync(mirrorSkillsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      mirrorNames = [];
    }
    for (const name of mirrorNames) {
      const mirrorDir = join(mirrorSkillsDir, name);
      const sourceFile = join(sourceSkillsDir, name, 'SKILL.md');
      if (!existsSync(sourceFile)) continue; // nothing to diverge from
      const stat = lstatSync(mirrorDir, { throwIfNoEntry: false });
      if (stat?.isSymbolicLink()) {
        const target = readlinkSync(mirrorDir);
        if (!target.includes(join('.agents', 'skills', name))) {
          console.log(
            fmt({
              status: 'fail',
              label: `.claude/skills/${name}: mirror symlink diverges from .agents/skills/${name}`,
              detail: `link target: ${target}`,
            }),
          );
          failures++;
        }
        continue;
      }
      const mirrorFile = join(mirrorDir, 'SKILL.md');
      if (!existsSync(mirrorFile)) continue;
      const [mirrorText, sourceText] = await Promise.all([
        readFile(mirrorFile, 'utf8'),
        readFile(sourceFile, 'utf8'),
      ]);
      if (mirrorText !== sourceText) {
        console.log(
          fmt({
            status: 'fail',
            label: `.claude/skills/${name}: mirror diverged from .agents/skills/${name} source`,
          }),
        );
        failures++;
      }
    }
  }

  // 1. .agent-forge/ presence
  if (root && existsSync(root)) {
    console.log(
      fmt({ status: 'pass', label: '.agent-forge/ exists', detail: root }),
    );
  } else {
    console.log(
      fmt({
        status: 'warn',
        label: `.agent-forge/ not found for scope '${scope}'`,
        detail: `would be created at ${targetRoot}; run \`agent-forge init\``,
      }),
    );
    warnings++;
    console.log('');
    console.log(`${pc.yellow('⚠')} Skipping further checks (no IR to inspect)`);
    return failures > 0 ? 1 : 0;
  }

  // 2. Manifest validity
  let manifest: Manifest | null = null;
  const manifestPath = join(root, 'manifest.yaml');
  if (!existsSync(manifestPath)) {
    console.log(fmt({ status: 'fail', label: 'manifest.yaml: missing' }));
    failures++;
  } else {
    try {
      const text = await readFile(manifestPath, 'utf8');
      const parsed = load(text);
      if (!validateManifest(parsed)) {
        const errs = formatErrors(validateManifest.errors);
        console.log(
          fmt({
            status: 'fail',
            label: 'manifest.yaml: schema-invalid',
            detail: errs.map((e) => `${e.path}: ${e.message}`).join('; '),
          }),
        );
        failures++;
      } else {
        manifest = parsed as Manifest;
        console.log(
          fmt({
            status: 'pass',
            label: 'manifest.yaml: valid',
            detail: `agent-forge v${manifest.agentForge}, scope ${manifest.scope}, ${manifest.targets.length} target(s)`,
          }),
        );
      }
    } catch (e) {
      console.log(
        fmt({
          status: 'fail',
          label: 'manifest.yaml: unparseable',
          detail: (e as Error).message,
        }),
      );
      failures++;
    }
  }

  // 3. Compile state
  const statePath = join(root, STATE_FILENAME);
  if (!existsSync(statePath)) {
    console.log(
      fmt({
        status: 'warn',
        label: 'compile state: absent',
        detail: 'no prior compile recorded',
      }),
    );
    warnings++;
  } else {
    try {
      const state = JSON.parse(await readFile(statePath, 'utf8')) as {
        version: number;
        adapters: Record<string, { timestamp: string }>;
      };
      if (state.version !== STATE_VERSION) {
        console.log(
          fmt({
            status: 'fail',
            label: 'compile state: version mismatch',
            detail: `expected ${STATE_VERSION}, got ${state.version}`,
          }),
        );
        failures++;
      } else {
        const ids = Object.keys(state.adapters);
        const lastCompile = ids
          .map((id) => state.adapters[id]?.timestamp)
          .filter((t): t is string => Boolean(t))
          .sort()
          .pop();
        console.log(
          fmt({
            status: 'pass',
            label: 'compile state: present',
            detail: `${ids.length} adapter(s) recorded${lastCompile ? `, last: ${lastCompile}` : ''}`,
          }),
        );
      }
    } catch (e) {
      console.log(
        fmt({
          status: 'fail',
          label: 'compile state: corrupt',
          detail: (e as Error).message,
        }),
      );
      failures++;
    }
  }

  // 4. Per-target detection + drift
  if (manifest && manifest.targets.length > 0) {
    console.log('');
    console.log(pc.bold('Target detection:'));
    for (const targetId of manifest.targets) {
      const adapter = adapters.find((a) => a.id === targetId);
      if (!adapter) {
        console.log(
          `  ${fmt({ status: 'fail', label: `${targetId}: adapter not installed` })}`,
        );
        failures++;
        continue;
      }
      try {
        const detected = await adapter.detect(scope, cwd);
        if (detected) {
          // Check drift if state has this adapter
          const drift = await detectDrift(root, adapter.id, cwd);
          if (drift.drifted.length > 0) {
            console.log(
              `  ${fmt({
                status: 'warn',
                label: `${targetId}: detected, ${drift.drifted.length} drifted file(s)`,
              })}`,
            );
            warnings++;
          } else {
            console.log(
              `  ${fmt({
                status: 'pass',
                label: `${targetId}: detected`,
                detail:
                  drift.cleanCount > 0
                    ? `${drift.cleanCount} file(s) clean`
                    : undefined,
              })}`,
            );
          }
        } else {
          console.log(
            `  ${fmt({
              status: 'warn',
              label: `${targetId}: no config detected (will be created on compile)`,
            })}`,
          );
          warnings++;
        }
      } catch (e) {
        console.log(
          `  ${fmt({ status: 'fail', label: `${targetId}: detect() failed`, detail: (e as Error).message })}`,
        );
        failures++;
      }
    }
  }

  // Summary
  console.log('');
  if (failures > 0) {
    console.log(pc.red(`${failures} failure(s), ${warnings} warning(s)`));
    return 1;
  }
  if (warnings > 0) {
    console.log(pc.yellow(`${warnings} warning(s)`));
  } else {
    console.log(pc.green('all checks passed'));
  }
  return 0;
}
