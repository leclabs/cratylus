import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

// Evidence only: never changes, refuses, or rewrites the architect's task call.
export default function observe(pi: {
  on(
    event: 'tool_call',
    handler: (event: { toolName: string; input: unknown }) => void,
  ): void;
}) {
  pi.on('tool_call', (event) => {
    if (event.toolName !== 'task') return;
    const branch = execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
      cwd: process.env.EXECUTION_PROJECT!,
      encoding: 'utf8',
    }).trim();
    appendFileSync(
      process.env.EXECUTION_MESSAGES!,
      `${JSON.stringify({
        role: 'fixture-observation',
        kind: 'branch-at-handoff',
        branch,
        input: event.input,
      })}\n`,
    );
  });
}
