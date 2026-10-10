// Observation only: never selects an agent, changes a model, prompt or tools.
// Loaded after the installed extension so event.systemPrompt is the chained
// prompt that will reach the provider, not session_start's base prompt.
import { appendFileSync } from 'node:fs';
// omp scopes this lookup to the extension's owning session, including children.
import { lookup } from '@oh-my-pi/pi-coding-agent/config/registry';
import { findScopedSettings } from '@oh-my-pi/pi-coding-agent/config/settings';
import { isPrewalkPlanNudge } from '@oh-my-pi/pi-coding-agent/session/prewalk';
interface Message {
  role: string;
  customType?: string;
}
interface Context {
  agent: { kind: string };
  model: unknown;
  getSystemPrompt(): string[];
  sessionManager: { getEntries(): unknown[]; buildSessionContext(): unknown };
}
interface API {
  getThinkingLevel(): string;
  getActiveTools(): string[];
  getAllTools(): { name: string; parameters: unknown }[];
  on(
    event: 'before_agent_start',
    handler: (event: { systemPrompt: string[] }, ctx: Context) => void,
  ): void;
  on(
    event: 'session_start',
    handler: (event: unknown, ctx: Context) => void,
  ): void;
  on(
    event: 'context',
    handler: (event: { messages: Message[] }, ctx: Context) => void,
  ): void;
}
export default function observe(pi: API) {
  function record(
    phase: string,
    prompt: string[],
    ctx: Context,
    messages?: Message[],
  ) {
    const settings = findScopedSettings()!;
    appendFileSync(
      process.env.AGENT_LAUNCH_OBSERVATIONS!,
      `${JSON.stringify({
        phase,
        kind: ctx.agent.kind,
        prompt,
        model: ctx.model,
        effort: pi.getThinkingLevel(),
        tools: pi.getActiveTools(),
        schemas: pi
          .getAllTools()
          .filter((tool) => pi.getActiveTools().includes(tool.name)),
        entries: ctx.sessionManager.getEntries(),
        context: ctx.sessionManager.buildSessionContext(),
        messages,
        prewalkArmed: messages?.some(isPrewalkPlanNudge) ?? false,
        settings: {
          readSummarize: lookup('read.summarize.enabled')!.get(settings),
          advisor: lookup('advisor.enabled')!.get(settings),
          advisorModel: settings.getModelRoles().advisor,
          prewalk: lookup('prewalk.enabled')!.get(settings),
          personality: lookup('personality')!.get(settings),
        },
      })}\n`,
    );
  }
  pi.on('session_start', (_event, ctx) =>
    record('start', ctx.getSystemPrompt(), ctx),
  );
  pi.on('before_agent_start', (event, ctx) => {
    record('turn', event.systemPrompt, ctx);
    if (process.env.AGENT_LAUNCH_INSPECT === '1') process.exit(0);
  });
  pi.on('context', (event, ctx) =>
    record('context', ctx.getSystemPrompt(), ctx, event.messages),
  );
}
