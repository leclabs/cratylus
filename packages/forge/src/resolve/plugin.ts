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
// ─────────────────────────────────────────────────────────────────────────────

// THE CONTRACT MOVED to `@cratylus/schema` on 2026-08-05 and is RE-EXPORTED here,
// not redeclared — there is one definition and this is an alias.
//
// It had to move: `canon/src/index.ts` is the corpus ROOT, and it needed
// `defineAgentPlugin` to declare things that are the corpus's own — so the last
// breach of property 2 (NOTHING depends on projection) was the corpus reaching
// into the projector for its own authoring surface. `AgentPlugin` never depended
// on anything in forge: it imported one type from schema, and `defineAgentPlugin`
// is `(plugin) => plugin`. It lived here by history, not by need.
//
// The alias stays so forge's own resolver keeps addressing the contract through
// `resolve/`, which is where a reader of this package looks for it.

export {
  type AgentPlugin,
  type Layout,
  defineAgentPlugin,
} from '@cratylus/schema';
