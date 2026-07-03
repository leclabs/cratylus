import type { CanonicalEvent, IR, Scope } from '../ir/types.js';

export type ResourceType =
  | 'rules'
  | 'skills'
  | 'commands'
  | 'agents'
  | 'hooks'
  | 'mcp'
  | 'permissions'
  | 'env';

/**
 * Per-resource support level. `plugin` means the resource is delivered
 * through the harness's plugin architecture rather than a native config
 * surface; the engine routes such resources to the adapter's matching
 * `pluginEmitters` entry (declaring `plugin` with no emitter is an
 * adapter-load lint error — see `validateAdapter`).
 */
export type Support = 'full' | 'partial' | 'none' | 'plugin';

export interface AdapterCapabilities {
  resources: Record<ResourceType, Support>;
  hooks: {
    supported: CanonicalEvent[];
    matchers: 'glob' | 'regex' | 'literal' | 'none';
    payload: 'claude-json' | 'native' | 'shim';
  };
  scopes: Scope[];
}

/**
 * Roster fact, not folklore (E10.S5): does this id track the field's
 * current target, a renamed successor, or a sunset harness? Ground truth:
 * harness-landscape-research.RETURN.md §0.
 */
export type AdapterStatusKind = 'current' | 'renamed' | 'sunset';

export interface AdapterStatus {
  kind: AdapterStatusKind;
  /**
   * Set only when this adapter's `.id` is itself the deprecated name (e.g.
   * the `gemini` adapter's id stays `gemini` for source/test compat, but the
   * field's canonical id is `antigravity`) — the id resolution/display
   * should prefer. Omit when `.id` is already canonical.
   */
  canonicalId?: string;
  /**
   * Extra ids that resolve to this identical adapter object — legacy names
   * (`gemini`, `windsurf`) and/or `canonicalId` itself. Order-independent.
   */
  aliases?: string[];
  /** For `sunset`: the id whose adapter now serves this harness's users. */
  successor?: string;
}

export interface WriteOpts {
  dryRun?: boolean;
  strict?: boolean;
  explain?: boolean;
}

export interface WriteReport {
  written: string[];
  skipped: { path: string; reason: string }[];
  warnings: string[];
}

/**
 * Adapter-published mapping from canonical event names to the adapter's native
 * event names. Absence of a key (or a null value) means the canonical event has
 * no native equivalent — emitting it triggers a warning + skip on write.
 */
export type EventMap = Partial<Record<CanonicalEvent, string | null>>;

/**
 * Emitter for a resource type declared `plugin`: writes the plugin artifact
 * that delivers the resource through the harness's plugin architecture.
 * Receives the full IR; consumes only its declared resource type.
 */
export type PluginEmitter = (
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts,
) => Promise<WriteReport>;

/**
 * The contract every agent-forge adapter implements. Adapters are pure: given the
 * same input, they produce the same output. State lives in the filesystem.
 */
export interface Adapter {
  id: string;
  /** Roster fact: current/renamed/sunset + alias resolution (E10.S5). */
  status: AdapterStatus;
  capabilities: AdapterCapabilities;
  /**
   * Canonical → native event mapping. Adapters without hook support may omit.
   * Surfaced via `agent-forge events list --client <id>`.
   */
  eventMap?: EventMap;
  /**
   * Per-resource plugin emitters, one per resource type declared `plugin` in
   * `capabilities.resources`. The engine routes plugin-declared resources
   * here; when compiled through the engine, `write` receives the IR with
   * those resources stripped (direct `write` calls still see the full IR).
   */
  pluginEmitters?: Partial<Record<ResourceType, PluginEmitter>>;
  detect(scope: Scope, cwd: string): Promise<boolean>;
  read(scope: Scope, cwd: string): Promise<Partial<IR>>;
  write(
    ir: IR,
    scope: Scope,
    cwd: string,
    opts: WriteOpts,
  ): Promise<WriteReport>;
}
