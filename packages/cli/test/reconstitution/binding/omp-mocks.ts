// Only omp's host services are mocked. The declarations, extension and CLI are installed artifacts.
import { vi } from 'vitest';

const omp = vi.hoisted(() => {
  const runtime: Record<string, unknown> = {};
  const handle = (id: string) => ({
    segments: id.split('.'),
    get: () => undefined,
    override: (_scope: unknown, value: unknown) => {
      runtime[id] = value;
    },
    clearOverride: () => {
      delete runtime[id];
    },
  });
  return {
    agents: [] as Record<string, unknown>[],
    args: {} as Record<string, unknown>,
    parse: undefined as
      | undefined
      | ((text: string) => {
          frontmatter: Record<string, unknown>;
          body: string;
        }),
    runtime,
    handle,
    scope: { overlayLayers: () => ({ overrides: runtime }) },
  };
});
vi.mock('@oh-my-pi/pi-coding-agent/task/discovery', () => ({
  discoverAgents: async () => ({ agents: omp.agents }),
}));
vi.mock('@oh-my-pi/pi-coding-agent/cli/args', () => ({
  parseArgs: () => omp.args,
}));
vi.mock('@oh-my-pi/pi-coding-agent/config/settings', () => ({
  findScopedSettings: () => omp.scope,
  settings: omp.scope,
}));
vi.mock('@oh-my-pi/pi-coding-agent/config/registry', () => ({
  lookup: omp.handle,
}));
vi.mock('@oh-my-pi/pi-coding-agent/config/model-settings', () => ({
  cfgModelRoles: omp.handle('modelRoles'),
}));
vi.mock('@oh-my-pi/pi-coding-agent/session/settings', () => ({
  cfgPersonality: omp.handle('personality'),
  cfgPrewalkEnabled: omp.handle('prewalk.enabled'),
}));
vi.mock('@oh-my-pi/pi-coding-agent/tools/settings', () => ({
  cfgReadSummarizeEnabled: omp.handle('read.summarize.enabled'),
}));
vi.mock('@oh-my-pi/pi-coding-agent/task/settings', () => ({
  cfgTaskAgentModelOverrides: { get: () => ({}) },
  cfgTaskAgentAdvisor: { get: () => ({}) },
  cfgTaskAgentPrewalk: { get: () => ({}) },
  cfgTaskPrewalk: { get: () => false },
}));
vi.mock('@oh-my-pi/pi-coding-agent/task/prewalk', () => ({
  resolveAgentPrewalkDefault: (a: Record<string, unknown>) => a.prewalk,
}));
vi.mock('@oh-my-pi/pi-coding-agent/config/model-resolver', () => ({
  DEFAULT_PREWALK_TARGET: '@smol',
  resolveAgentModelSelection: () => ({ patterns: ['fixture/base'] }),
  resolveModelOverrideWithAuthFallback: async () => ({
    model: { provider: 'fixture', id: 'base' },
    explicitThinkingLevel: false,
    authFallbackUsed: false,
  }),
  resolveAgentAdvisorRolePattern: (p: string) => p,
  resolveAgentAdvisorSelection: () => undefined,
  resolveAgentPrewalkPattern: () => undefined,
  resolveConfiguredModelPatterns: (p: string) => [p],
}));
vi.mock('@oh-my-pi/pi-coding-agent/task/spawn-policy', () => ({
  resolveSpawnPolicy: (spawns = '*') => {
    const allowed = spawns
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    return {
      enabled: allowed.length > 0,
      allowedAgents: spawns === '*' ? null : allowed,
      allowedErrorText:
        allowed.join(',') || 'none (spawns disabled for this agent)',
    };
  },
}));
vi.mock('@oh-my-pi/pi-coding-agent/extensibility/skills', () => ({
  getActiveSkills: () => [],
  buildSkillPromptMessage: async () => ({ message: '' }),
}));
vi.mock('@oh-my-pi/pi-utils', () => ({
  parseFrontmatter: (text: string) => omp.parse!(text),
}));
export { omp };
