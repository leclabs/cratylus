// The observer runs inside the installed omp executable, not the CLI package.
// Describe only the read-only discovery fields it consumes; integration checks
// load and exercise the real host modules.
declare module '@oh-my-pi/pi-coding-agent/task/discovery' {
  export function discoverAgents(cwd: string): Promise<{
    agents: { name: string; filePath: string }[];
  }>;
}

declare module '@oh-my-pi/pi-coding-agent/extensibility/skills' {
  export function getActiveSkills(): { name: string; filePath: string }[];
}
