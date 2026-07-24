// Re-export the auto-generated IR types as the public surface.
// Source of truth: packages/agent-forge/src/core/schema/*.schema.json
// Regenerate via: pnpm --filter @leclabs/agent-forge gen
export type {
  Agent,
  Command,
  EnvVars,
  IR,
  Manifest,
  McpServer,
  Permissions,
  RemoteMcpServer,
  Rule,
  Scope,
  Skill,
  StdioMcpServer,
} from './generated.js';
// The lifecycle-event vocabulary is NOT an IR-local type: it is harness-agnostic
// canon owned by `core/hook` (its own schema + generator). Re-exported here only
// so the legacy barrel keeps one definition rather than a structural twin.
export type { CanonicalEvent, Hook } from '../hook/index.js';
