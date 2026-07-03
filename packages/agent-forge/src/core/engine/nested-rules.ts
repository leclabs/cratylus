import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Rule } from '../ir/types.js';

/** Rules partitioned by subtree placement (E7.S2 [S1][S9]). */
export interface ScopedRulesSplit {
  /** No `dir` — pass through to each adapter's normal rules surface. */
  root: Rule[];
  /** `dir` → the rules scoped to that subtree, order-sorted. */
  scoped: Map<string, Rule[]>;
}

/**
 * Partition an IR's rules into root-scope vs `dir`-scoped groups. Each
 * `dir` group is sorted by `order` (stable; unordered rules keep array
 * position after ordered ones) so a multi-rule nested file concatenates
 * deterministically.
 */
export function splitScopedRules(rules: Rule[] | undefined): ScopedRulesSplit {
  const root: Rule[] = [];
  const scoped = new Map<string, Rule[]>();
  for (const rule of rules ?? []) {
    if (rule.dir) {
      const arr = scoped.get(rule.dir);
      if (arr) arr.push(rule);
      else scoped.set(rule.dir, [rule]);
    } else {
      root.push(rule);
    }
  }
  for (const arr of scoped.values()) {
    arr.sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  }
  return { root, scoped };
}

/**
 * Write each `dir`-scoped rule group to `<cwd>/<dir>/AGENTS.md` — a
 * self-sufficient file (concatenated rule bodies only, no frontmatter, no
 * anaphora to the root) so it stands alone under BOTH closest-wins
 * replacement [S1] and Codex root-to-cwd concatenation [S9]. Adapter-agnostic:
 * this is the shared/neutral standards surface (E7.S2), written once per
 * compile regardless of which dialect targets are present — never delegated
 * to a specific adapter's dialect writer.
 */
export async function writeNestedRuleFiles(
  scoped: Map<string, Rule[]>,
  cwd: string,
  dryRun?: boolean,
): Promise<string[]> {
  const written: string[] = [];
  for (const [dir, rules] of scoped) {
    const dirPath = join(cwd, dir);
    const file = join(dirPath, 'AGENTS.md');
    const body = rules.map((r) => r.body).join('\n\n');
    if (!dryRun) {
      await mkdir(dirPath, { recursive: true });
      await writeFile(file, `${body}\n`, 'utf8');
    }
    written.push(file);
  }
  return written;
}
