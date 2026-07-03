/**
 * E5.S1 — support mode `plugin` is a first-class capability value.
 *
 * Documented truth (plans/interop-hardening/stories/E5-plugin-adapters.md):
 * capability declarations admit `plugin` (or `{level, via: 'plugin'}`) per
 * resource; the engine routes such resources to the adapter's plugin emitter;
 * a resource declared `plugin` with no plugin emitter is a lint error at
 * adapter load, not a runtime surprise.
 *
 * Today the `Support` union is `'full' | 'partial' | 'none'`
 * (src/core/adapter/types.ts) and no plugin routing exists — both facets are
 * tracked. The probes are runtime-concrete: they enumerate the declared
 * capability values of all shipped adapters and the public engine/core export
 * surfaces, so the day a `plugin` value or a plugin-emitter route appears the
 * suite goes red and forces graduation.
 */

import { expect } from 'vitest';
import { ALL_ADAPTERS, story } from '../helpers.js';

story.tracked(
  'E5.S1',
  'capability declarations admit plugin and the engine routes plugin resources to a plugin emitter',
  async () => {
    // Probe 1 — the support-value space actually declared by the 10 shipped
    // adapters. Documented: `plugin` is a first-class member of that space.
    const declared = new Set<string>();
    for (const adapter of ALL_ADAPTERS) {
      for (const value of Object.values(adapter.capabilities.resources)) {
        declared.add(String(value));
      }
    }
    expect(
      [...declared].sort(),
      `support values declared across ${ALL_ADAPTERS.length} adapters must admit 'plugin'; found only: ${[...declared].sort().join(', ')}`,
    ).toContain('plugin');

    // Probe 2 — an engine-side plugin route: some exported member of the
    // engine whose name carries 'plugin' (the emitter dispatch surface).
    const engine = await import('../../../src/core/engine/index.js');
    const members = Object.keys(engine);
    expect(
      members.filter((m) => /plugin/i.test(m)),
      `engine exports probed for a plugin-emitter route; searched: ${members.join(', ')}`,
    ).not.toEqual([]);
  },
);

story.tracked(
  'E5.S1',
  'a resource declared plugin with no plugin emitter is a lint error at adapter load',
  async () => {
    // Probe — a load-time adapter validator on the public core surface: an
    // export whose name references adapters AND lint/validate/load/register.
    // Once present, the documented behavior is: an adapter declaring e.g.
    // `resources.skills = 'plugin'` while exposing no plugin emitter is
    // rejected at load — never a runtime surprise.
    const core = await import('../../../src/core/index.js');
    const members = Object.keys(core);
    const validators = members.filter(
      (m) => /adapter/i.test(m) && /lint|validate|load|register/i.test(m),
    );
    expect(
      validators,
      `core exports probed for an adapter-load lint surface (name matching /adapter/ and /lint|validate|load|register/); searched: ${members.join(', ')}`,
    ).not.toEqual([]);
  },
);
