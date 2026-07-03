/**
 * AUTO-GENERATED. Do not edit by hand.
 * Source: packages/agent-forge/src/core/schema/*.schema.json
 * Regenerate: pnpm --filter @leclabs/agent-forge gen
 */
/* eslint-disable */

export type Scope = 'user' | 'project' | 'local';
export type CanonicalEvent =
  | 'session.start'
  | 'session.resume'
  | 'session.end'
  | 'prompt.submit'
  | 'turn.end'
  | 'turn.fail'
  | 'agent.idle'
  | 'model.request.pre'
  | 'model.response.post'
  | 'tool.use.pre'
  | 'tool.use.post'
  | 'tool.use.fail'
  | 'file.edit.post'
  | 'file.read.pre'
  | 'file.change.external'
  | 'shell.exec.pre'
  | 'shell.exec.post'
  | 'mcp.exec.pre'
  | 'mcp.exec.post'
  | 'subagent.start'
  | 'subagent.end'
  | 'permission.request'
  | 'permission.deny'
  | 'notification'
  | 'context.compact.pre'
  | 'context.compact.post'
  | 'config.changed'
  | 'instructions.loaded';
/**
 * An MCP server registration. Stdio servers use command+args; remote servers use url. Discriminated by transport.
 */
export type McpServer = StdioMcpServer | RemoteMcpServer;

/**
 * The complete agent-forge intermediate representation. Top-level container of manifest plus all resource collections.
 */
export interface IR {
  manifest: Manifest;
  rules?: Rule[];
  skills?: Skill[];
  commands?: Command[];
  agents?: Agent[];
  hooks?: Hook[];
  mcp_servers?: McpServer[];
  permissions?: Permissions;
  env?: EnvVars;
}
/**
 * agent-forge manifest. Entry point of an IR directory; declares schema version, scope, and target clients.
 */
export interface Manifest {
  /**
   * IR schema version. Always 1 in v1.
   */
  agentForge: 1;
  scope: Scope;
  /**
   * Adapter ids this manifest compiles to (e.g. claude, opencode, codex).
   */
  targets: string[];
  options?: {
    /**
     * Fail compile on any lossy translation.
     */
    strict?: boolean;
    drift_check?: 'warn' | 'error' | 'ignore';
    emit_warnings?: boolean;
  };
  /**
   * Per-adapter override knobs (paths, behavior). Adapter-defined.
   */
  overrides?: {
    [k: string]: {};
  };
}
/**
 * A rule fragment. Markdown body with optional frontmatter. Compiled to AGENTS.md/CLAUDE.md/.cursorrules etc.
 */
export interface Rule {
  /**
   * Stable identifier; usually the source filename without extension.
   */
  id: string;
  /**
   * Markdown content of the rule.
   */
  body: string;
  /**
   * If set, only emit to these adapter ids.
   */
  targets?: string[];
  /**
   * If set, do not emit to these adapter ids.
   */
  excludes?: string[];
  /**
   * Whether this rule is concatenated with siblings into one rules file (true) or kept as a separate file when the target supports it (false).
   */
  concat?: boolean;
  /**
   * Sort key for concatenation order. Lower values appear first.
   */
  order?: number;
  /**
   * Human-readable purpose; surfaced in dialect frontmatter (.mdc description, Windsurf/Continue description).
   */
  description?: string;
  /**
   * Canonical activation globs, adapter-mapped per dialect (.mdc globs, .instructions.md applyTo, .clinerules paths:).
   */
  globs?: string[];
  /**
   * When the rule applies — the convergent cross-dialect vocabulary (Windsurf trigger, Cline/Continue modes, Cursor rule types).
   */
  activation?: 'always' | 'auto' | 'glob' | 'manual';
  /**
   * Cursor-dialect always flag (.mdc alwaysApply); false with globs = glob activation.
   */
  alwaysApply?: boolean;
  /**
   * Subtree placement: compile into this directory's nested AGENTS.md instead of the root.
   */
  dir?: string;
}
/**
 * An Agent Skill — SKILL.md content plus optional adjacent files.
 */
export interface Skill {
  /**
   * Skill slug (kebab-case). Becomes the directory name in target client output.
   */
  name: string;
  /**
   * One-line description used by the agent to decide when to invoke the skill.
   */
  description: string;
  /**
   * SKILL.md markdown body.
   */
  body: string;
  /**
   * Tools the skill is permitted to invoke. May be dropped on adapters that lack the field.
   */
  allowed_tools?: string[];
  /**
   * Paths to additional files in the skill directory, relative to the skill root.
   */
  files?: string[];
  /**
   * SPDX license expression for the skill content (AgentSkills spec).
   */
  license?: string;
  /**
   * Environment/version constraint the skill requires (AgentSkills spec).
   */
  compatibility?: string;
  /**
   * Arbitrary string key/value annotations (AgentSkills spec / Copilot metadata).
   */
  metadata?: {
    [k: string]: string;
  };
  /**
   * Activation globs: auto-surface the skill when matching files are in play (Claude paths).
   */
  paths?: string[];
  /**
   * Whether the skill is exposed as a user-invocable /command (Copilot user-invocable).
   */
  user_invocable?: boolean;
  /**
   * Bar the model from auto-invoking the skill (Claude/Copilot disable-model-invocation).
   */
  disable_model_invocation?: boolean;
  targets?: string[];
  excludes?: string[];
}
/**
 * A slash command. Markdown body becomes the prompt; frontmatter declares args, model, tools.
 */
export interface Command {
  name: string;
  body: string;
  description?: string;
  /**
   * Hint shown to user about expected arguments.
   */
  argument_hint?: string;
  /**
   * Model override for this command.
   */
  model?: string;
  allowed_tools?: string[];
  targets?: string[];
  excludes?: string[];
}
/**
 * A subagent definition. System prompt body plus frontmatter declaring tools, model, color.
 */
export interface Agent {
  name: string;
  /**
   * System prompt for the subagent.
   */
  body: string;
  description?: string;
  model?: string;
  tools?: string[];
  color?: string;
  /**
   * Permission stance the agent runs under (Claude permissionMode: default/plan/acceptEdits/…). Adapter-mapped or warned.
   */
  permission_mode?: string;
  /**
   * Turn budget for a run (Claude maxTurns, Gemini max_turns).
   */
  max_turns?: number;
  /**
   * Sampling temperature (Gemini/opencode/Kilo).
   */
  temperature?: number;
  /**
   * Invocation surface the agent is offered on (Kilo/opencode mode).
   */
  mode?: 'primary' | 'subagent' | 'all';
  /**
   * Persistent-memory scope (Claude memory: user/project/local).
   */
  memory?: string;
  /**
   * Reasoning-effort hint (Claude effort).
   */
  effort?: string;
  targets?: string[];
  excludes?: string[];
}
/**
 * A lifecycle hook. Uses the canonical event taxonomy; per-adapter mapping translates to native event names at compile time.
 */
export interface Hook {
  /**
   * Stable identifier; usually the source filename without extension.
   */
  id?: string;
  /**
   * Canonical events that trigger this hook.
   *
   * @minItems 1
   */
  events: [CanonicalEvent, ...CanonicalEvent[]];
  /**
   * Glob (or literal, per adapter capability) matched against event subject — tool name for tool.use.*, file path for file.*, etc.
   */
  matcher?: string;
  /**
   * Shell command to execute when the hook fires.
   */
  command: string;
  /**
   * Timeout in seconds. Defaults to client default if omitted.
   */
  timeout?: number;
  targets?: string[];
  excludes?: string[];
}
export interface StdioMcpServer {
  name: string;
  transport: 'stdio';
  /**
   * Executable: a bare string (with args separate) or the argv-array form (opencode/Kilo typed local).
   */
  command: string | [string, ...string[]];
  args?: string[];
  env?: {
    [k: string]: string;
  };
  /**
   * Server registered but switched off (Cline).
   */
  disabled?: boolean;
  /**
   * Tool names pre-approved without prompting (Cline).
   */
  autoApprove?: string[];
  /**
   * Allowlist of tools exposed from this server (Gemini/Codex).
   */
  includeTools?: string[];
  /**
   * Denylist of tools hidden from this server (Gemini/Codex).
   */
  excludeTools?: string[];
  /**
   * Skip per-call confirmation for this server (Gemini).
   */
  trust?: boolean;
  /**
   * Request timeout in seconds (Gemini/Codex).
   */
  timeout?: number;
  targets?: string[];
  excludes?: string[];
}
export interface RemoteMcpServer {
  name: string;
  transport: 'sse' | 'http';
  url: string;
  headers?: {
    [k: string]: string;
  };
  /**
   * Static HTTP headers sent with every request (Codex remote).
   */
  http_headers?: {
    [k: string]: string;
  };
  /**
   * Env var whose value becomes the Authorization bearer token (Codex remote).
   */
  bearer_token_env_var?: string;
  /**
   * Structured auth config, e.g. { type: 'oauth' } (Cursor remote).
   */
  auth?: {
    type: string;
    [k: string]: unknown;
  };
  /**
   * Server registered but switched off (Cline).
   */
  disabled?: boolean;
  /**
   * Tool names pre-approved without prompting (Cline).
   */
  autoApprove?: string[];
  /**
   * Allowlist of tools exposed from this server (Gemini/Codex).
   */
  includeTools?: string[];
  /**
   * Denylist of tools hidden from this server (Gemini/Codex).
   */
  excludeTools?: string[];
  /**
   * Skip per-call confirmation for this server (Gemini).
   */
  trust?: boolean;
  /**
   * Request timeout in seconds (Gemini/Codex).
   */
  timeout?: number;
  targets?: string[];
  excludes?: string[];
}
/**
 * Allow / deny / ask lists. Patterns are tool matchers in client-native syntax (e.g. 'Bash(git status)', 'Read(*)').
 */
export interface Permissions {
  allow?: string[];
  deny?: string[];
  ask?: string[];
}
/**
 * Environment variables as a flat string map. Values may use ${env:NAME} interpolation resolved at compile time.
 */
export interface EnvVars {
  [k: string]: string;
}
