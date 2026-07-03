/**
 * Dynamic-probe helper for not-yet-shipped adapters (E10 new-adapter stories).
 *
 * The specifier is kept out of TS module resolution (variable, not literal) so
 * `tsc` stays green while the module is absent; at runtime the import rejects,
 * which is exactly the tracked gap. The day the adapter lands the same import
 * resolves and the follow-up contract assertions execute.
 */

import type { Adapter } from '../../../src/core/index.js';

export async function importAdapter(id: string): Promise<Adapter> {
  const specifier = `../../../src/adapters/${id}/index.js`;
  const mod = (await import(/* @vite-ignore */ specifier)) as Record<
    string,
    unknown
  >;
  const adapter = Object.values(mod).find(
    (v): v is Adapter =>
      typeof v === 'object' && v !== null && 'id' in v && 'write' in v,
  );
  if (!adapter) throw new Error(`no Adapter export found in adapters/${id}`);
  return adapter;
}
