import canon from '@cratylus/canon';
import { defineConfig } from '@cratylus/forge/config';

// cratylus's OWN cratylus.config.ts — this repository is a consumer of the
// commands it ships. `cratylus project --harness <name>` is the build-time
// entry (ARCHITECTURE.md, "Two consumer entries, because there are two DAGs");
// the private `toolkit/project-cli*.ts` reimplementations it replaces differed
// from each other by one adapter string, and the codex copy had already drifted
// once and shipped SESSIONLESS runtime shims to every codex-projected skill.
//
// THE WHOLE PLUGIN, per harness — hooks included, never subset. A build step
// that decides what the design IS is the projection silently editing the canon.
// The harness is chosen with `--harness`, which is the only thing that ever
// differed between the two deleted files.
//
// `patches: []` is the honest state: this corpus authors no consumer patch. It
// is the plugin, not a consumer of one.
export default defineConfig({
  extends: [canon],
  patches: [],
});
