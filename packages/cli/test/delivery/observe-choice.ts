// Runs inside real omp. No provider turn: resolve the selected declaration and let
// the interactive harness paint its own status line before terminating.
import { writeFileSync } from 'node:fs';
export default function observe(pi: {
  on(
    event: string,
    fn: (event: unknown, ctx: { model: unknown }) => unknown,
  ): void;
}) {
  pi.on('session_start', (_event, ctx) => {
    writeFileSync(
      process.env.DELIVERY_CHOICE_OBSERVATION!,
      JSON.stringify({ model: ctx.model }),
    );
    setTimeout(() => process.exit(0), 600);
  });
  pi.on('before_agent_start', () => {
    throw new Error('Structural choice observation must not call a model');
  });
}
