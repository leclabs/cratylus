// The observer runs inside the installed omp executable, not the CLI package.
// Describe only its read-only imports; the integration checks exercise the real modules.
declare module '@oh-my-pi/pi-coding-agent/config/settings' {
  export interface Settings {
    getModelRoles(): Readonly<Record<string, string | undefined>>;
  }
  export function findScopedSettings(): Settings | undefined;
}

declare module '@oh-my-pi/pi-coding-agent/config/registry' {
  import type { Settings } from '@oh-my-pi/pi-coding-agent/config/settings';

  export function lookup(
    id: 'read.summarize.enabled' | 'advisor.enabled' | 'prewalk.enabled',
  ): { get(settings: Settings): boolean } | undefined;
  export function lookup(
    id: 'personality',
  ): { get(settings: Settings): string } | undefined;
}

declare module '@oh-my-pi/pi-coding-agent/session/prewalk' {
  export function isPrewalkPlanNudge(message: {
    role: string;
    customType?: string;
  }): boolean;
}
