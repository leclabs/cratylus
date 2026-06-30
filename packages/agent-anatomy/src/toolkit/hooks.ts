// koine Hook resources sourced by mind — the projection-machinery home for the
// harness hooks (Mav's lane: build/tooling/delivery, NOT the culture corpus in
// `src/{agents,skills,organs}`). Lives in `src/toolkit/` beside the projector
// that consumes it (`project-cli.ts`), because a Hook is koine CONFIG IR, not a
// culture cell.
//
// koine PROJECTS these into `.claude/settings.json` (claude adapter:
// `turn.end` → Stop, `subagent.end` → SubagentStop) and koine DEPLOY ships each
// hook's worker scripts beside the settings entry as hook assets under the host
// `~/.claude/hooks/<id>/`. This module is the single source of truth for WHERE a
// hook fires and WHAT it runs.
//
// PLACEMENT (resolved, @nico T6.3): a koine Hook is infra config, not a culture
// exemplar, so it lives in `src/toolkit/` (build-wiring beside `project-cli.ts`),
// NOT a first-class corpus `src/hooks/` kind. The worker scripts are co-located
// in `src/toolkit/guardrail/` (the old shell `toolkit/` dir was consolidated here).

import type { Hook } from '@leclabs/agent-forge';

// ── stance guardrail (principal-stance P4 — the harness half) ───────────────

/** Deployed worker location under a host `.claude/` (the koine deploy target).
 *  `$HOME` is shell-expanded by the harness when it runs the hook command, so
 *  the hook resolves regardless of the harness cwd at fire time. */
const STANCE_WORKER =
  '$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh';

/**
 * Stop + SubagentStop hook that structurally refuses a turn collapsing out of
 * the intent-driven-expert stance. The worker stays OFF BY DEFAULT — it
 * re-checks a per-repo git-config opt-in (`polis.stanceGuard`) at fire time — so
 * registering it in settings.json on every host is inert until a repo opts in.
 * Timeout 60s (an LLM-judge call).
 */
export const stanceGuardrailHook: Hook = {
  id: 'stance-guardrail',
  events: ['turn.end', 'subagent.end'],
  command: `sh "${STANCE_WORKER}"`,
  timeout: 60,
};

/** The worker scripts koine deploy ships beside the hook entry, named relative
 *  to the guardrail source dir (`packages/mind/src/toolkit/guardrail/`). */
export const stanceGuardrailAssets: readonly string[] = [
  'stance-guardrail.sh',
  'stance-judge.sh',
  'stance-judge-prompt.md',
];

// ── the hook manifest the projector walks ───────────────────────────────────

/** One source-of-truth entry per harness hook: the koine `Hook` IR + the
 *  worker assets + the toolkit source dir they live in (relative to mindRoot).
 *  The projector serializes `hook` into settings.json and stages `assets` into
 *  the render tree under `hooks/<hook.id>/`. */
export interface HookSource {
  readonly hook: Hook;
  readonly assets: readonly string[];
  /** Source dir of the assets, relative to the mind package root. */
  readonly assetDir: string;
}

export const hookSources: readonly HookSource[] = [
  {
    hook: stanceGuardrailHook,
    assets: stanceGuardrailAssets,
    assetDir: 'src/toolkit/guardrail',
  },
];
