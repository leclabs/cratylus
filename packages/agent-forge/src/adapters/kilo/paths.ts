import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Scope } from '../../core/index.js';

/**
 * Kilo config-surface paths. Ground truth: harness-landscape-research
 * RETURN §2 "Roo Code / Kilo" ([KL1]-[KL7]). Kilo is the 2026 rebuild of
 * Kilo Code on an opencode-derived runtime — its directory shape mirrors
 * opencode's ([OC1]-[OC8]) more closely than Roo's own legacy layout.
 *
 * - `configFile`: the ONE documented config home, `kilo.jsonc` — precedence
 *   defaults → global → project → `.kilo/kilo.jsonc` → env [KL1]. `.kilo/
 *   kilo.jsonc` wins over the project-root `kilo.jsonc` when both exist; an
 *   existing root file is followed on read (same discipline as crush's
 *   `.crush.json`/`crush.json` pair), new emission defaults to `.kilo/`.
 * - `legacyRulesDir` (project only): `.kilocode/rules/` — the pre-rename
 *   product's rules home, auto-migrated per [KL1]; recognized on READ ONLY,
 *   never written (the legacy tree is foreign territory).
 */
export interface KiloPaths {
  kiloDir: string;
  rulesDir: string;
  commandsDir: string;
  skillsDir: string;
  agentsDir: string;
  pluginsDir: string;
  hooksShimFile: string;
  hooksManifestFile: string;
  /** The `.kilo/kilo.jsonc` config home (or `~/.config/kilo/kilo.jsonc` at user scope). */
  configFile: string;
  /** Project-root `kilo.jsonc` fallback — read-only precedence, followed if it alone exists. */
  rootConfigFile?: string;
  /** `.kilocode/rules/` — legacy read-only import surface (project scope only). */
  legacyRulesDir?: string;
}

export function paths(scope: Scope, cwd: string): KiloPaths {
  if (scope === 'user') {
    const kiloDir = join(homedir(), '.config', 'kilo');
    const pluginsDir = join(kiloDir, 'plugins');
    return {
      kiloDir,
      rulesDir: join(kiloDir, 'rules'),
      commandsDir: join(kiloDir, 'commands'),
      skillsDir: join(kiloDir, 'skills'),
      agentsDir: join(kiloDir, 'agents'),
      pluginsDir,
      hooksShimFile: join(pluginsDir, 'agent-forge-hooks.ts'),
      hooksManifestFile: join(pluginsDir, 'agent-forge-hooks.yaml'),
      configFile: join(kiloDir, 'kilo.jsonc'),
    };
  }
  const kiloDir = join(cwd, '.kilo');
  const pluginsDir = join(kiloDir, 'plugins');
  return {
    kiloDir,
    rulesDir: join(kiloDir, 'rules'),
    commandsDir: join(kiloDir, 'commands'),
    skillsDir: join(kiloDir, 'skills'),
    agentsDir: join(kiloDir, 'agents'),
    pluginsDir,
    hooksShimFile: join(pluginsDir, 'agent-forge-hooks.ts'),
    hooksManifestFile: join(pluginsDir, 'agent-forge-hooks.yaml'),
    configFile: join(kiloDir, 'kilo.jsonc'),
    rootConfigFile: join(cwd, 'kilo.jsonc'),
    legacyRulesDir: join(cwd, '.kilocode', 'rules'),
  };
}
