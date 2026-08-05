/**
 * AUTO-GENERATED. Do not edit by hand.
 * Source: packages/schema/src/hook/hook.schema.json
 * Regenerate: pnpm --filter @cratylus/schema gen
 */
/* eslint-disable */

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
