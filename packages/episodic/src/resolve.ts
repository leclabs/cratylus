import { isAbsolute, join, normalize, resolve, sep } from 'node:path';

/**
 * Scope — *where* an EPISODIC record is true (ideas/memory.md, Routing axis 2).
 * Single-valued: one home per record. If a fact is genuinely true in both
 * tiers, the encoder routes it to the more durable one, never to both.
 *
 *  - `user`           — agent-global; travels with the agent across every host.
 *  - `project:<key>`  — project-scoped; stays with that project.
 */
export type Scope = 'user' | `project:${string}`;

/**
 * Host environment that turns a scope into a concrete base directory. The same
 * logical store resolves to different absolute paths per host
 * (`/Users/lex` vs `/Users/lcaraccioli`) — portability lives here, NOT in the
 * stored record, which holds only scope + scope-relative path.
 */
export interface HostEnv {
  /** The agent's global home, e.g. `~/.claude/agents/<name>`. Base for `user` scope. */
  agentHome(): string;
  /** The absolute root of project `<key>`. Base for `project:<key>` scope. */
  projectRoot(key: string): string;
}

const PROJECT_PREFIX = 'project:';

/** Parse a scope string into its discriminant + optional project key. */
export function parseScope(
  scope: string,
): { tier: 'user' } | { tier: 'project'; key: string } {
  if (scope === 'user') return { tier: 'user' };
  if (scope.startsWith(PROJECT_PREFIX)) {
    const key = scope.slice(PROJECT_PREFIX.length);
    if (key.length === 0)
      throw new Error(`Project scope missing key: "${scope}"`);
    return { tier: 'project', key };
  }
  throw new Error(
    `Unknown scope: "${scope}" (expected "user" or "project:<key>")`,
  );
}

/** Narrow an arbitrary string to a valid {@link Scope}, throwing if not. */
export function assertScope(scope: string): Scope {
  parseScope(scope); // throws on malformed
  return scope as Scope;
}

/**
 * Guard a scope-relative path: must be relative and must not escape its base via
 * `..`. Absolute paths are rejected outright — storing them would break
 * portability (the whole reason `home`/`fid` fields are forbidden).
 */
function assertSafeRelative(path: string): string {
  if (path.length === 0) throw new Error('Path must be non-empty');
  if (isAbsolute(path))
    throw new Error(`Path must be scope-relative, not absolute: "${path}"`);
  const normalized = normalize(path);
  if (normalized === '..' || normalized.startsWith(`..${sep}`)) {
    throw new Error(`Path must not escape its scope base: "${path}"`);
  }
  return normalized;
}

/**
 * Resolve `(scope, path)` to an absolute path on this host.
 *
 *   user           → agentHome()/path
 *   project:<key>  → projectRoot(key)/path
 *
 * The (scope, path) pair is the *portable* identity of a store file; this
 * function is its only one-host realization. Run on two hosts with different
 * home roots, the same (scope, path) yields the same logical store — that is the
 * portability gate (ideas/memory.md, Portability).
 */
export function resolveFile(env: HostEnv, scope: string, path: string): string {
  const safe = assertSafeRelative(path);
  const parsed = parseScope(scope);
  const base =
    parsed.tier === 'user' ? env.agentHome() : env.projectRoot(parsed.key);
  return resolve(join(base, safe));
}

/**
 * Default {@link HostEnv} backed by real host directories.
 *
 * @param agentHomeDir absolute path to the agent's global home
 *        (e.g. `${os.homedir()}/.claude/agents/<name>`).
 * @param projectRoots map of project key → absolute project root.
 */
export function createHostEnv(
  agentHomeDir: string,
  projectRoots: Readonly<Record<string, string>> = {},
): HostEnv {
  if (!isAbsolute(agentHomeDir))
    throw new Error(`agentHome must be absolute: "${agentHomeDir}"`);
  return {
    agentHome: () => agentHomeDir,
    projectRoot: (key: string) => {
      const root = projectRoots[key];
      if (root === undefined) throw new Error(`Unknown project key: "${key}"`);
      if (!isAbsolute(root))
        throw new Error(`projectRoot must be absolute: "${root}"`);
      return root;
    },
  };
}
