// ─────────────────────────────────────────────────────────────────────────────
// The agent-plugin contract — the distribution unit of the canon.
//
// An AGENT-PLUGIN is an npm package that DECLARES WHICH DIRECTORIES supply the
// reusable **fragments** (dimension-values) and **presets** (agents / skills),
// so the forge resolver can scan them. It formalizes the discovery already done
// by the directory-scan (`catalog/enumerateCatalog` globs `<corpus>/<dim>/*.ts`;
// canon globs `agents/*.ts` / `skills/*.ts`) into "which dirs, from which
// package." The package's own `defineAgentPlugin(...)` DEFAULT export is the
// plugin; a consumer `extends` it by IMPORTING that object.
//
// ADDRESSING IS BY IMPORTED BINDING, NEVER A STRING ID (NORTH-STAR §3). A
// consumer wires a plugin in by passing the imported object (`extends: [canon]`),
// and a fragment references another via its imported JS binding — there is NO
// `<plugin>:<dim>/<anchor>` magic-string scheme (the pattern ESLint flat-config
// deliberately dropped). `name` is only the namespace SEGMENT for reporting /
// per-plugin σ* uniqueness, not an address others resolve against.
//
// This module is the CONTRACT only — doctrine-agnostic, no resolver logic. The
// ordered-fold resolver (extends / patches / replace·append·merge·force) lands
// beside it in `resolve/` as its own concern.
// ─────────────────────────────────────────────────────────────────────────────

import type { DimensionManifest } from '@leclabs/agent-schema';

/**
 * An agent-plugin: a package's declaration of which directories supply its
 * fragments and presets. Every dir field is a path STRING the loader scans
 * per-dimension exactly as the existing directory-scan does. Fields are optional
 * so a plugin may ship only fragments, only presets, or any mix.
 *
 * DIR RESOLUTION: an imported plugin OBJECT loses its package-root provenance, so
 * a plugin SELF-LOCATES its dirs to ABSOLUTE paths against its own
 * `import.meta.url` (see `agent-canon`'s default export) — the config-is-code
 * loader (`config/loader.ts`) uses those verbatim, and resolves a RELATIVE dir
 * against the config file's dir only as a local/dev fallback.
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
  /**
   * A doctrine-agnostic leading block stamped into every cell this plugin
   * contributes. It must travel WITH the plugin: a consumer projecting an extended
   * plugin has no access to the plugin's own repo context, so an axiom left behind
   * in the corpus's build script would silently vanish from consumer-projected
   * cells — exactly the ambient-dependence the doctrine forbids.
   */
  readonly preamble?: string;
  /** Dir of hook cell modules this plugin contributes (harness-substrate only). */
  readonly hooks?: string;
  /**
   * WHICH dimensions exist, and each one's metadata — the manifest INSTANCE, as
   * against the meta-model (that a dimension has an axis/kind/arity) that
   * `@leclabs/agent-schema` owns.
   *
   * It rides the plugin for the same reason `preamble` does: a consumer projecting
   * an extended plugin has no access to the plugin's repo, so a manifest left behind
   * there would make the design unprojectable by anyone but its author. A corpus
   * that must edit the projector to declare a dimension does not own its own design.
   *
   * Plugins compose, so the set's manifest is the per-dimension merge in `extends`
   * order (later wins, every override logged) — which is what lets a consumer ADD a
   * dimension without forking the plugin it extends. Nobody declaring one is a
   * REFUSAL, not a fallback: `mergeManifest` THROWS. There is no resident manifest
   * to stand in, and a plugin set with no dimensions would project every agent as a
   * plausible-looking empty SOUL — the one failure a byte diff cannot tell from a
   * corpus that shrank.
   */
  readonly manifest?: DimensionManifest;
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
