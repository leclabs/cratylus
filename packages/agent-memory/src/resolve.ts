import { isAbsolute, join, normalize, resolve, sep } from 'node:path';

/**
 * Scope — *where* an EPISODIC record is true (ideas/memory.md, Routing axis 2;
 * plans/scoped-memory SPEC §1: `user ⊃ project ⊃ plan`, key = repo basename).
 * Single-valued: one home per record. If a fact is genuinely true in several
 * tiers, the encoder routes it to the NARROWEST one (least-scope), never to all.
 *
 *  - `user`               — agent-global; travels with the agent across every host.
 *  - `project:<key>`      — project-scoped; stays with that project.
 *  - `plan:<key>/<plan>`  — plan-scoped; stays with `plans/<plan>/` in project `<key>`.
 *
 * The tag is reasoned by the AGENT at encode time (SPEC D3): the tool validates
 * the grammar and never infers scope from cwd.
 */
export type Scope = 'user' | `project:${string}` | `plan:${string}`;

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
const PLAN_PREFIX = 'plan:';

/** One `<key>` / `<plan>` segment: a repo-basename-shaped token, no slashes. */
const SEGMENT_RE = /^[A-Za-z0-9._-]+$/;

/** Parse a scope string into its discriminant + key (and plan, for `plan:`). */
export function parseScope(
  scope: string,
):
  | { tier: 'user' }
  | { tier: 'project'; key: string }
  | { tier: 'plan'; key: string; plan: string } {
  if (scope === 'user') return { tier: 'user' };
  if (scope.startsWith(PROJECT_PREFIX)) {
    const key = scope.slice(PROJECT_PREFIX.length);
    if (key.length === 0)
      throw new Error(`Project scope missing key: "${scope}"`);
    return { tier: 'project', key };
  }
  if (scope.startsWith(PLAN_PREFIX)) {
    const rest = scope.slice(PLAN_PREFIX.length);
    const parts = rest.split('/');
    const [key, plan] = parts;
    if (
      parts.length !== 2 ||
      key === undefined ||
      plan === undefined ||
      !SEGMENT_RE.test(key) ||
      !SEGMENT_RE.test(plan)
    ) {
      throw new Error(
        `Malformed plan scope: "${scope}" (expected "plan:<key>/<plan>", one slash, both segments [A-Za-z0-9._-]+)`,
      );
    }
    return { tier: 'plan', key, plan };
  }
  throw new Error(
    `Unknown scope: "${scope}" (expected "user", "project:<key>", or "plan:<key>/<plan>")`,
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
 *   user               → agentHome()/path
 *   project:<key>      → projectRoot(key)/path
 *   plan:<key>/<plan>  → projectRoot(key)/plans/<plan>/path
 *
 * The plan tier is the ROUTED-TARGET base (SPEC §2): a plan-scoped dream target
 * with path `AGENTS.md` lands in `plans/<plan>/AGENTS.md` under the project
 * key's tree. Raw capture never resolves through it (single-store, D2).
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
    parsed.tier === 'user'
      ? env.agentHome()
      : parsed.tier === 'project'
        ? env.projectRoot(parsed.key)
        : join(env.projectRoot(parsed.key), 'plans', parsed.plan);
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
