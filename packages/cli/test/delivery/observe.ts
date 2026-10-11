// This is loaded by real omp; discovery is real and the session exits before a model turn.
import { writeFileSync } from 'node:fs';
import { getActiveSkills } from '@oh-my-pi/pi-coding-agent/extensibility/skills';
import { discoverAgents } from '@oh-my-pi/pi-coding-agent/task/discovery';
export default function observe(pi: {
  getAllTools(): { name: string }[];
  on(
    event: string,
    fn: (event: unknown, ctx: { cwd: string }) => unknown,
  ): void;
}) {
  pi.on('session_start', async (_event, ctx) => {
    const { agents } = await discoverAgents(ctx.cwd);
    writeFileSync(
      process.env.DELIVERY_DISCOVERY!,
      JSON.stringify({
        agents: agents.map((a) => ({ name: a.name, filePath: a.filePath })),
        skills: getActiveSkills().map((s) => ({
          name: s.name,
          filePath: s.filePath,
        })),
        tools: pi.getAllTools().map((t) => t.name),
      }),
    );
    process.exit(0);
  });
  pi.on('before_agent_start', () => {
    throw new Error(
      'Delivery structural discovery must never start a model turn',
    );
  });
}
