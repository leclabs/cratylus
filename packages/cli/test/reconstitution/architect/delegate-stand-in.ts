// Decision 0094: replace execution, not the subject's dispatch or its schema.
// Native tool_call hooks (including the passive handoff observer) still run.
export const acknowledgement =
  'Assignment accepted. I will return the outcome for the assigned concepts.';

interface TaskTool {
  name: string;
  description: string;
  parameters: unknown;
}
interface Dispatch {
  tasks: { agent: string; task: string; [key: string]: unknown }[];
  [key: string]: unknown;
}

export default function standIn(pi: {
  on(event: 'session_start', handler: () => void): void;
  getAllTools(): TaskTool[];
  registerTool(
    tool: TaskTool & {
      label: string;
      defaultInactive: true;
      execute(
        toolCallId: string,
        input: Dispatch,
      ): Promise<{
        content: { type: 'text'; text: string }[];
        details: { fixture: 'delegate-stand-in'; input: Dispatch };
      }>;
    },
  ): void;
}) {
  pi.on('session_start', () => {
    const task = pi.getAllTools().find((tool) => tool.name === 'task');
    if (!task) return; // A subject without task cannot dispatch a delegate.
    pi.registerTool({
      name: task.name,
      label: 'Task',
      defaultInactive: true, // Do not grant dispatch to a role without it.
      description: task.description,
      parameters: task.parameters,
      async execute(_toolCallId, input) {
        return {
          content: input.tasks.map(() => ({
            type: 'text',
            text: acknowledgement,
          })),
          details: { fixture: 'delegate-stand-in', input },
        };
      },
    });
  });
}
