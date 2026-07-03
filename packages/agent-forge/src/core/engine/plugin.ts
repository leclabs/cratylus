import type {
  Adapter,
  ResourceType,
  WriteOpts,
  WriteReport,
} from '../adapter/types.js';
import type { IR } from '../ir/types.js';

/** ResourceType → the IR collection key that carries it. */
export const RESOURCE_IR_KEY = {
  rules: 'rules',
  skills: 'skills',
  commands: 'commands',
  agents: 'agents',
  hooks: 'hooks',
  mcp: 'mcp_servers',
  permissions: 'permissions',
  env: 'env',
} as const satisfies Record<ResourceType, keyof Omit<IR, 'manifest'>>;

/** Resource types the adapter declares `plugin` support for. */
export function pluginResourceTypes(adapter: Adapter): ResourceType[] {
  return (
    Object.entries(adapter.capabilities.resources) as [ResourceType, string][]
  )
    .filter(([, support]) => support === 'plugin')
    .map(([type]) => type);
}

/** The IR minus the given resource types (manifest always retained). */
export function stripResources(ir: IR, types: ResourceType[]): IR {
  const out: IR = { ...ir };
  for (const type of types) {
    delete out[RESOURCE_IR_KEY[type]];
  }
  return out;
}

/**
 * Route every plugin-declared resource of `adapter` to its plugin emitter.
 * Returns the emitters' write reports plus the IR the adapter's `write`
 * should receive (plugin-declared resources stripped, so nothing is emitted
 * twice). A declared type with no emitter yields a loud `skipped` entry —
 * `validateAdapter` rejects that declaration at load, this is the runtime
 * backstop.
 */
export async function emitPluginResources(
  adapter: Adapter,
  ir: IR,
  scope: Parameters<Adapter['write']>[1],
  cwd: string,
  opts: WriteOpts,
): Promise<{ rest: IR; reports: WriteReport[] }> {
  const types = pluginResourceTypes(adapter);
  if (types.length === 0) return { rest: ir, reports: [] };

  const reports: WriteReport[] = [];
  for (const type of types) {
    const key = RESOURCE_IR_KEY[type];
    const present =
      ir[key] !== undefined &&
      (!Array.isArray(ir[key]) || (ir[key] as unknown[]).length > 0);
    if (!present) continue;
    const emitter = adapter.pluginEmitters?.[type];
    if (!emitter) {
      reports.push({
        written: [],
        skipped: [
          {
            path: key,
            reason: `plugin-declared '${type}' has no plugin emitter (adapter '${adapter.id}')`,
          },
        ],
        warnings: [
          `${type}: declared plugin but adapter '${adapter.id}' has no emitter — resource dropped loudly`,
        ],
      });
      continue;
    }
    reports.push(await emitter(ir, scope, cwd, opts));
  }
  return { rest: stripResources(ir, types), reports };
}
