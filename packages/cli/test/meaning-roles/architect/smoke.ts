import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { type Scenario, assess } from '../../reconstitution/architect/check.js';
import { liveRun, recordingDirectory } from '../../reconstitution/architect/runner.js';

const here = dirname(fileURLToPath(import.meta.url));
const scenarios: Scenario[] = JSON.parse(readFileSync(join(here, 'scenarios.json'), 'utf8'));
// 0088: smoke each visible example once, independently; a failing smoke goes
// back to build, never straight into a batch. Select passing examples for the
// subsequent batch entry. Both stages retain subject and judge evidence.
export function smokeSuite() {
  describe.runIf(process.env.EXECUTION_LIVE === '1')('meaning-roles live smoke', () => {
    it.concurrent.each(scenarios)('$ref: installed architect smoke', async (scenario) => {
      const root = process.env.EXECUTION_RECORDINGS ??
        mkdtempSync(join(tmpdir(), 'meaning-roles-smoke-'));
      const recording = await liveRun(
        scenario,
        join(recordingDirectory(root, scenario), 'smoke'),
      );
      expect(recording.judgment?.status).toBe('judged');
      expect(Object.entries(assess(scenario, recording)).filter(([, pass]) => !pass))
        .toEqual([]);
    }, 10_000_000);
  });
}
