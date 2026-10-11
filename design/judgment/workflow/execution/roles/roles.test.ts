// Offline: pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/execution/roles/vitest.config.ts
// Red demonstration: prefix EXECUTION_RED=1 and add -t 'red demonstration' (intentionally exits 1).
// No-model preflight: prefix EXECUTION_PREFLIGHT=1 and add -t preflight.
// Live: prefix EXECUTION_LIVE=1 and add -t live (five runs per case).
// Optional EXECUTION_RECORDINGS=/absolute/temp/path preserves evidence.
import { fileURLToPath } from 'node:url';
import { roleSuite } from '../../../../../packages/cli/test/execution-roles/suite.js';
roleSuite(fileURLToPath(new URL('.', import.meta.url)));
