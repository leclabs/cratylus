// ─────────────────────────────────────────────────────────────────────────────
// The runtime DISPATCHER — route `<capability> <verb> [args]` to a bound port method.
//
// Generalizes agent-memory's verb-dispatch `switch` (cli.ts) over REGISTERED
// plugins: instead of a fixed switch, the capability selects a bound port from the
// {@link RuntimeHost} and the verb selects a method ON that port by name. The
// kernel is capability-AGNOSTIC — it treats a port as an opaque bag of verb
// handlers; per-verb argv marshalling for a real capability is that capability
// package's concern, not the kernel's. The dispatcher is PURE (returns a
// {@link DispatchResult}, does no process IO — the bin maps it to stdio/exit) so it
// is unit-testable.
//
// UNKNOWN FAILS LOUD: an unknown capability or verb returns a non-zero code with a
// clear message listing what IS available — never a silent no-op. A verb that
// throws is a code-1 execution failure, distinct from a code-2 not-found.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type CapabilityBinding,
  type CapabilityPort,
  type RuntimeHost,
  UnknownCapabilityError,
} from './loader.js';

/**
 * The parsed argv tail handed to a verb: positionals + flags. The kernel's
 * generic call shape — a capability's port method interprets it (or ignores it).
 */
export interface VerbArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

/** A verb, viewed generically by the kernel: a method that consumes {@link VerbArgs}. */
export type VerbHandler = (args: VerbArgs) => unknown;

/** The pure outcome of a dispatch — the bin maps it to stdout/stderr + exit code. */
export interface DispatchResult {
  code: number;
  out: string;
  err: string;
}

/** Minimal argv parser: `--flag value`, `--flag=value`, boolean `--flag`, positionals. */
export function parseArgs(argv: readonly string[]): VerbArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i] as string;
    if (!tok.startsWith('--')) {
      positionals.push(tok);
      continue;
    }
    const body = tok.slice(2);
    const eq = body.indexOf('=');
    if (eq !== -1) {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[body] = next;
      i++;
    } else {
      flags[body] = true;
    }
  }
  return { positionals, flags };
}

/** The verb NAMES callable on a port — function-valued members, own + prototype
 *  (a class-instance strategy carries its methods on the prototype), sorted. */
export function verbsOf(port: CapabilityPort): string[] {
  const names = new Set<string>();
  for (
    let obj: object | null = port;
    obj != null && obj !== Object.prototype;
    obj = Object.getPrototypeOf(obj)
  ) {
    for (const key of Object.getOwnPropertyNames(obj)) {
      if (key === 'constructor') continue;
      if (
        typeof (port as unknown as Record<string, unknown>)[key] === 'function'
      ) {
        names.add(key);
      }
    }
  }
  return [...names].sort();
}

/** Resolve a verb name to its handler on a port, or `undefined` if not a method. */
function verbHandler(
  port: CapabilityPort,
  verb: string,
): VerbHandler | undefined {
  const member = (port as unknown as Record<string, unknown>)[verb];
  return typeof member === 'function' ? (member as VerbHandler) : undefined;
}

/** Render a verb result for stdout: nothing for `undefined`, raw string as-is,
 *  else pretty JSON. Every non-empty line is newline-terminated. */
function serialize(result: unknown): string {
  if (result === undefined) return '';
  if (typeof result === 'string')
    return result.endsWith('\n') ? result : `${result}\n`;
  return `${JSON.stringify(result, null, 2)}\n`;
}

const message = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

/**
 * Dispatch one `<capability> <verb> [args]` invocation against a host. Resolves the
 * capability to a bound port, the verb to a method on it, parses the argv tail, and
 * invokes — awaiting a possibly-async result and serializing it. Unknown capability
 * or verb ⇒ code 2 + a LOUD message listing the available set; a throwing verb ⇒
 * code 1. Never silently no-ops.
 */
export async function dispatch(
  host: RuntimeHost,
  argv: readonly string[],
): Promise<DispatchResult> {
  const [capability, verb, ...rest] = argv;

  if (capability === undefined) {
    const have = host.capabilities().join(', ') || '(none)';
    return {
      code: 2,
      out: '',
      err: `runtime: missing <capability> <verb>; capabilities bound here: ${have}\n`,
    };
  }

  let binding: CapabilityBinding;
  try {
    binding = host.resolve(capability);
  } catch (err) {
    if (err instanceof UnknownCapabilityError) {
      return { code: 2, out: '', err: `runtime: ${err.message}\n` };
    }
    throw err;
  }

  if (verb === undefined) {
    return {
      code: 2,
      out: '',
      err: `runtime: missing <verb> for capability '${capability}'; verbs: ${verbsOf(binding.port).join(', ')}\n`,
    };
  }

  const handler = verbHandler(binding.port, verb);
  if (handler === undefined) {
    return {
      code: 2,
      out: '',
      err: `runtime: unknown verb '${verb}' for capability '${capability}'; verbs: ${verbsOf(binding.port).join(', ')}\n`,
    };
  }

  try {
    const result = await handler.call(binding.port, parseArgs(rest));
    return { code: 0, out: serialize(result), err: '' };
  } catch (err) {
    return {
      code: 1,
      out: '',
      err: `runtime: ${capability} ${verb} failed: ${message(err)}\n`,
    };
  }
}
