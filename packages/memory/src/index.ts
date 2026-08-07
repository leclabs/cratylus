// ─────────────────────────────────────────────────────────────────────────────
// @cratylus/memory — the memory runtime-capability PLUGIN (was the standalone
// `memory` tool). The `.` export surface:
//   - `runtimePlugin`  — the RuntimePlugin the runtime loader registers.
//   - `AgentMemory`    — the MemoryStrategy implementation (bind a home explicitly).
//   - `seedTemplates`  — the memory store seed templates forge imports.
//   - `main`/`runCli` — the argv dispatcher the `cratylus memory <verb>`
//                        surface delegates to; the tool ships NO `memory` bin.
// `seedTemplates` is also reachable at the `./seedTemplates` subpath.
// ─────────────────────────────────────────────────────────────────────────────

export { runtimePlugin } from './plugin.js';
export { AgentMemory, type AgentMemoryOptions } from './strategy.js';
export { seedTemplates } from './seeds.js';
export { main, runCli, VERSION, type CliResult } from './cli.js';
