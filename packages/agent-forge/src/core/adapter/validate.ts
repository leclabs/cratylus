import type { Adapter, ResourceType } from './types.js';

/**
 * Adapter-load lint: structural checks on an adapter declaration that must
 * hold before the adapter is admitted to a roster. Returns human-readable
 * error strings; empty array = valid.
 *
 * Checks:
 * - every resource declared `plugin` has a matching `pluginEmitters` entry
 *   (a plugin declaration with no emitter would be a runtime surprise);
 * - every `pluginEmitters` entry corresponds to a resource declared `plugin`
 *   (an emitter the engine would never route to is dead weight).
 */
export function validateAdapter(adapter: Adapter): string[] {
  const errors: string[] = [];
  const resources = Object.entries(adapter.capabilities.resources) as [
    ResourceType,
    string,
  ][];
  for (const [type, support] of resources) {
    if (support === 'plugin' && adapter.pluginEmitters?.[type] === undefined) {
      errors.push(
        `adapter '${adapter.id}': resource '${type}' declared plugin but no pluginEmitters['${type}'] exists`,
      );
    }
  }
  for (const type of Object.keys(adapter.pluginEmitters ?? {})) {
    if (adapter.capabilities.resources[type as ResourceType] !== 'plugin') {
      errors.push(
        `adapter '${adapter.id}': pluginEmitters['${type}'] exists but resource '${type}' is not declared plugin`,
      );
    }
  }
  return errors;
}

/**
 * Load-time assertion over a roster: throws (naming every violation) if any
 * adapter fails `validateAdapter`. Called by the CLI when the roster is
 * assembled, so an invalid declaration is a lint error at adapter load — not
 * a runtime surprise.
 *
 * Also checks the roster's id/alias space is injective (E10.S5): two
 * adapters silently claiming the same id or alias would make one shadow the
 * other in every by-id lookup, undetectably.
 */
export function assertAdaptersValid(adapters: Adapter[]): void {
  const errors = adapters.flatMap((a) => validateAdapter(a));

  const ownerOf = new Map<string, string>(); // key -> owning adapter id
  for (const a of adapters) {
    const keys = [a.id, a.status.canonicalId, ...(a.status.aliases ?? [])];
    for (const key of keys) {
      if (key === undefined) continue;
      const owner = ownerOf.get(key);
      if (owner === undefined) {
        ownerOf.set(key, a.id);
      } else if (owner !== a.id) {
        errors.push(
          `adapter '${a.id}': id/alias '${key}' collides with adapter '${owner}'`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`adapter-load lint failed:\n  ${errors.join('\n  ')}`);
  }
}
