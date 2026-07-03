/**
 * Runtime probe for the exemplify/optimize pipeline entrypoint (epic E6).
 *
 * The exemplify pipeline (conceptualize → signify → materialize, gated on
 * accept — `~/.claude/skills/exemplify/SKILL.md`) is documented as reachable
 * from agent-forge, but no entrypoint ships in this package today. Every E6
 * tracked test opens with this probe so the failure enumerates exactly what
 * was searched, and so the day ANY entrypoint lands the tracked tests go red
 * and force graduation to real pipeline assertions.
 */

/** Exported-member name pattern an exemplify/optimize entrypoint would bear. */
const ENTRY_RE =
  /exemplif|optimi[sz]e|conceptuali[sz]e|signify|materiali[sz]e/i;

/** Candidate module homes outside the public core/engine surfaces. */
const CANDIDATE_HOMES = [
  '../../../src/exemplify/index.js',
  '../../../src/optimize/index.js',
  '../../../src/core/exemplify/index.js',
];

export interface PipelineProbe {
  /** Everything the probe examined (surfaces + candidate module homes). */
  searched: string[];
  /** Entrypoint hits — empty means: no exemplify/optimize in the package. */
  found: string[];
}

export async function probePipeline(): Promise<PipelineProbe> {
  const searched: string[] = [];
  const found: string[] = [];

  const core = (await import('../../../src/core/index.js')) as Record<
    string,
    unknown
  >;
  const engine = (await import('../../../src/core/engine/index.js')) as Record<
    string,
    unknown
  >;
  for (const [home, mod] of [
    ['src/core (public surface)', core],
    ['src/core/engine', engine],
  ] as const) {
    for (const member of Object.keys(mod)) {
      searched.push(`${home}#${member}`);
      if (ENTRY_RE.test(member)) found.push(`${home}#${member}`);
    }
  }

  for (const home of CANDIDATE_HOMES) {
    const spec: string = home; // widened: resolved at runtime, not by tsc
    try {
      const mod = (await import(spec)) as Record<string, unknown>;
      searched.push(`${home}#{${Object.keys(mod).join(',')}}`);
      found.push(...Object.keys(mod).map((k) => `${home}#${k}`));
    } catch {
      searched.push(`${home} (module absent)`);
    }
  }

  return { searched, found };
}

/** The failure message a probing tracked test raises: the full search set. */
export function probeMessage(probe: PipelineProbe): string {
  return `no exemplify/optimize entrypoint in package (pattern ${String(
    ENTRY_RE,
  )}); searched ${probe.searched.length} locations: ${probe.searched.join(' · ')}`;
}
