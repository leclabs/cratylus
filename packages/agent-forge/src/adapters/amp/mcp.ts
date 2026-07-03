import type { McpServer } from '../../core/index.js';

/** `"amp.mcpServers": {"n": {command,args,env} | {url,headers}}` [AM1]. */
export interface AmpMcpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  includeTools?: string[];
  url?: string;
  headers?: Record<string, string>;
}

/** IR → flat amp.mcpServers entry. Array-form `command` (opencode/Kilo
 * typed local) is normalized to Amp's documented bare-string + args shape,
 * never fabricated as an undocumented array field. */
export function mcpEntry(s: McpServer): AmpMcpEntry {
  if (s.transport === 'stdio') {
    const [command, ...argvRest] = Array.isArray(s.command)
      ? s.command
      : [s.command];
    const args = [...argvRest, ...(s.args ?? [])];
    const entry: AmpMcpEntry = { command };
    if (args.length) entry.args = args;
    if (s.env) entry.env = s.env;
    if (s.includeTools) entry.includeTools = s.includeTools;
    return entry;
  }
  const entry: AmpMcpEntry = { url: s.url };
  if (s.headers) entry.headers = s.headers;
  return entry;
}

/** amp.mcpServers entry → IR. The inverse of `mcpEntry`. */
export function parseMcpEntry(
  name: string,
  s: AmpMcpEntry,
): McpServer | undefined {
  if (s.url) {
    const server = { name, transport: 'http', url: s.url } as McpServer;
    if (s.headers)
      (server as { headers?: Record<string, string> }).headers = s.headers;
    return server;
  }
  if (s.command) {
    const server = {
      name,
      transport: 'stdio',
      command: s.command,
    } as McpServer;
    if (s.args) (server as { args?: string[] }).args = s.args;
    if (s.env) (server as { env?: Record<string, string> }).env = s.env;
    if (s.includeTools)
      (server as { includeTools?: string[] }).includeTools = s.includeTools;
    return server;
  }
  return undefined;
}
