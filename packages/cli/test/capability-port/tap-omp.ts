// Instrument omp's registration API, preserving the actual registration and
// registry entry. No fake API, no re-import of the adapter, no journal behavior.
export interface Definition {
  name: string;
  label: string;
  approval?: string | ((args: Record<string, unknown>) => string);
  execute(
    id: string,
    args: Record<string, unknown>,
    signal: AbortSignal,
    update: undefined,
    ctx: unknown,
  ): Promise<unknown>;
}
export interface RegisteredTool {
  definition: Definition;
  sourceInfo: { path: string };
}
interface RegistrationAPI {
  extension: { tools: Map<string, RegisteredTool> };
  registerTool(tool: Definition): void;
}
const registryKey = Symbol.for('cratylus.cut6.observed-omp-registry');
const registrationsKey = Symbol.for('cratylus.cut6.observed-omp-registrations');
// Omp may import a CLI extension and its transitive import under different URLs.
// This harness-owned symbol shares observations, never registrations or behavior.
const store = globalThis as typeof globalThis & {
  [registryKey]?: Map<string, RegisteredTool>;
  [registrationsKey]?: { name: string; path: string }[];
};
store[registryKey] ??= new Map<string, RegisteredTool>();
export const entries = store[registryKey];
store[registrationsKey] ??= [];
export const registrations = store[registrationsKey];
export default function tap(pi: RegistrationAPI) {
  const prototype = Object.getPrototypeOf(pi) as RegistrationAPI;
  const register = prototype.registerTool;
  prototype.registerTool = function (definition: Definition) {
    register.call(this, definition);
    const entry = this.extension.tools.get(definition.name);
    if (!entry) throw new Error('omp registration did not reach its registry');
    entries.set(definition.name, entry);
    registrations.push({ name: definition.name, path: entry.sourceInfo.path });
  };
}
