// ─────────────────────────────────────────────────────────────────────────────
// The agent-plugin contract — the distribution unit of the canon.
//
// An AGENT-PLUGIN is an npm package that DECLARES WHICH DIRECTORIES supply the
// reusable **fragments** (dimension-values) and **presets** (agents / skills),
// so the forge resolver can scan them. It formalizes the discovery already done
// by the directory-scan (`catalog/enumerateCatalog` globs `<corpus>/<dim>/*.ts`;
// anatomy globs `agents/*.ts` / `skills/*.ts`) into "which dirs, from which
// package." The package's own `defineAgentPlugin(...)` DEFAULT export is the
// plugin; a consumer `extends` it by IMPORTING that object.
//
// ADDRESSING IS BY IMPORTED BINDING, NEVER A STRING ID (NORTH-STAR §3). A
// consumer wires a plugin in by passing the imported object (`extends: [anatomy]`),
// and a fragment references another via its imported JS binding — there is NO
// `<plugin>:<dim>/<anchor>` magic-string scheme (the pattern ESLint flat-config
// deliberately dropped). `name` is only the namespace SEGMENT for reporting /
// per-plugin σ* uniqueness, not an address others resolve against.
//
// This module is the CONTRACT only — doctrine-agnostic, no resolver logic. The
// ordered-fold resolver (extends / patches / replace·append·merge·force) lands
// beside it in `resolve/` as its own concern.
// ─────────────────────────────────────────────────────────────────────────────

import type { Adapter } from '../core/adapter/types.js';

/**
 * An agent-plugin: a package's declaration of which directories supply its
 * fragments and presets, plus any harness adapters it ships. Every dir field is
 * a path STRING relative to the plugin package root — the resolver scans it
 * per-dimension exactly as the existing directory-scan does. Fields are optional
 * so a plugin may ship only fragments, only presets, only adapters, or any mix.
 */
export interface AgentPlugin {
  /** The namespace segment — reporting + per-plugin σ* uniqueness. NOT an address. */
  readonly name: string;
  /** Fragment (dimension-value) dir, package-relative — scanned `<dir>/<dim>/*.ts`. */
  readonly fragments?: string;
  /** Preset AGENT dir, package-relative — scanned `<dir>/*.ts`. */
  readonly agents?: string;
  /** Preset SKILL dir, package-relative — scanned `<dir>/*.ts`. */
  readonly skills?: string;
  /** Harness adapters this plugin ships (registered into the emitter registry). */
  readonly adapters?: readonly Adapter[];
}

/**
 * Declare an agent-plugin. Identity factory: returns its argument unchanged so a
 * consumer addresses the plugin (and P3 addresses its fragments) by the IMPORTED
 * BINDING, never a string id. Named `defineAgentPlugin` (not `definePlugin`) to
 * dodge the webpack `DefinePlugin` prior; lineage is Nuxt's `defineNuxtConfig`.
 */
export function defineAgentPlugin(plugin: AgentPlugin): AgentPlugin {
  return plugin;
}
