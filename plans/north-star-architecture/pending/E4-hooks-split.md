# E4 — R4: hooks — generic lift → forge, specific cells stay CANON

**static:** `packages/agent-anatomy/src/toolkit/hooks.ts` (`hookIrOf`, `hookSources`) · `hook-cell.ts` ·
`packages/agent-anatomy/src/hooks/stance-guardrail*.ts` · `../NORTH-STAR.md §2 R4`.
**scope:** move the generic `hookIrOf` (HookCell→Hook lift, doctrine-free) into `agent-forge`; the specific
stance-guard CELLS stay in anatomy as runtime substance; the composition-root wires `hookSources`. (`hook-cell`/
`rule-cell` TYPES → forge; audit `rule-cell.ts` for corpus literals first.)
**accept:** `hookIrOf` lives in forge; the stance-guard cells remain in anatomy; the projected `settings.json`
hooks are byte-identical (`project --check`); the deployed PreToolUse/Stop guards still fire (hook tests);
typecheck green.
**dep:** E1.
