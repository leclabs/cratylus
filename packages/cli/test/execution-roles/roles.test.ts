// Offline: pnpm --filter cratylus exec vitest run test/execution-roles/roles.test.ts
// Red demonstration: prefix EXECUTION_RED=1 and add -t 'red demonstration' (intentionally exits 1).
// No-model preflight: prefix EXECUTION_PREFLIGHT=1 and add -t preflight.
// Live: prefix EXECUTION_LIVE=1 and add -t live. Five subject runs per example;
// semantic rubrics use separate live-only judge sessions. No live run is automatic.
// Optional EXECUTION_RECORDINGS=/absolute/temp/path retains launch and assessment evidence.
// This header documents the frozen checks; scenarios and controls are on disk beside it.
import { fileURLToPath } from 'node:url';
import { roleSuite } from './suite.js';
roleSuite(fileURLToPath(new URL('.', import.meta.url)));
