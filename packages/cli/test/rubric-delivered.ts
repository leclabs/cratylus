import { bottomLine, descend, handBack } from '@cratylus/canon';

export interface HeldDrift {
  // Several guards can jointly refuse one attempt.
  guard: string | string[];
  attempt: 'call' | 'reply';
  tool?: string;
  input?: unknown;
  text?: string;
  reason: string;
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function textOf(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .flatMap((block) => {
      const item = object(block);
      return item?.type === 'text' && typeof item.text === 'string'
        ? [item.text]
        : [];
    })
    .join('\n');
}

// Non-exported generated refusal sentences live in forge/src/adapters/omp/render.ts:
// READBACK_REFUSAL, leadRefusal, builderRefusal, before_subagent_spawn and the
// task tool_call handler. The latter uses schema/src/contract.ts checkAssignment.
// Match only those leading sentences, not arbitrary command errors or mentions.
function refusingGuard(reason: string): string | undefined {
  if (reason.startsWith(descend.refusal)) return descend.id;
  if (reason.startsWith(handBack.refusal)) return handBack.id;
  if (reason.startsWith(bottomLine.refusal)) return bottomLine.id;
  if (
    reason.startsWith(
      'reconstitution: give the operator the readback (current design, open decisions, cuts in flight) in visible text before this act, then make this call again in the same turn.',
    )
  )
    return 'readback-gate';
  if (/^lead dispatch of cut .+ refused: /.test(reason)) return 'lead-dispatch';
  if (/^builder dispatch of cut .+ refused: /.test(reason))
    return 'builder-dispatch';
  if (/^\S+ assignment is (?:missing|ill-typed): /.test(reason))
    return 'typed-handoff';
  if (/^Cannot spawn '[^']+'. Allowed: /.test(reason)) return 'spawn-policy';
  return undefined;
}

/** 0091: project the delivered trace without mutating the retained subject. */
export function deliveredEvidence(messages: readonly unknown[]): {
  delivered: unknown[];
  heldDrift: HeldDrift[];
} {
  const removedMessages = new Set<number>();
  const removedBlocks = new Map<number, Set<number>>();
  const calls = new Map<
    string,
    { message: number; block: number; call: Record<string, unknown> }
  >();
  const heldDrift: HeldDrift[] = [];
  const removeBlock = (message: number, block: number) => {
    let blocks = removedBlocks.get(message);
    if (!blocks) {
      blocks = new Set();
      removedBlocks.set(message, blocks);
    }
    blocks.add(block);
  };
  for (const [index, value] of messages.entries()) {
    const message = object(value);
    if (!message) continue;
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const [block, value] of message.content.entries()) {
        const call = object(value);
        if (call?.type === 'toolCall' && typeof call.id === 'string')
          calls.set(call.id, { message: index, block, call });
      }
    }
    const callRefusal =
      message.role === 'toolResult' && message.isError === true;
    const replyRefusal =
      message.role === 'custom' &&
      message.customType === 'session-stop-continuation';
    if (!callRefusal && !replyRefusal) continue;
    const reason = textOf(message.content);
    if (!refusingGuard(reason)) continue;
    // The session joins simultaneous guard refusals into one continuation.
    const guards = [
      ...new Set(
        reason.split(/\n+/).flatMap((line) => {
          const guard = refusingGuard(line);
          return guard ? [guard] : [];
        }),
      ),
    ];
    const guard = guards.length === 1 ? guards[0]! : guards;
    if (callRefusal) {
      const id = message.toolCallId;
      const previous = typeof id === 'string' ? calls.get(id) : undefined;
      // A result without its attempted call cannot establish a refused attempt.
      if (!previous) continue;
      removeBlock(previous.message, previous.block);
      removedMessages.add(index);
      calls.delete(id as string);
      heldDrift.push({
        guard,
        attempt: 'call',
        tool:
          typeof previous.call.name === 'string'
            ? previous.call.name
            : undefined,
        input: previous.call.arguments,
        reason,
      });
    } else {
      const previous = object(messages[index - 1]);
      if (previous?.role !== 'assistant') continue;
      const text = textOf(previous.content);
      if (!text) continue;
      if (typeof previous.content === 'string') removedMessages.add(index - 1);
      else if (Array.isArray(previous.content)) {
        for (const [block, value] of previous.content.entries())
          if (object(value)?.type === 'text') removeBlock(index - 1, block);
      }
      removedMessages.add(index);
      heldDrift.push({ guard, attempt: 'reply', text, reason });
    }
  }
  const delivered = messages.flatMap((value, index) => {
    if (removedMessages.has(index)) return [];
    const blocks = removedBlocks.get(index);
    if (!blocks) return [value];
    const message = object(value)!;
    const content = (message.content as unknown[]).filter(
      (_, block) => !blocks.has(block),
    );
    return content.length ? [{ ...message, content }] : [];
  });
  return { delivered, heldDrift };
}

export interface HeldDriftCount {
  total: number;
  byGuard: Record<string, number>;
}

export function countHeldDrift(run: unknown): HeldDriftCount {
  const entries = object(run)?.heldDrift;
  const byGuard: Record<string, number> = {};
  let total = 0;
  if (Array.isArray(entries)) {
    for (const value of entries) {
      const guard = object(value)?.guard;
      const guards = typeof guard === 'string' ? [guard] : guard;
      if (!Array.isArray(guards) || guards.length === 0) continue;
      for (const name of new Set(guards))
        if (typeof name === 'string') byGuard[name] = (byGuard[name] ?? 0) + 1;
      total++;
    }
  }
  return { total, byGuard };
}

export function totalHeldDrift(
  counts: readonly HeldDriftCount[],
): HeldDriftCount {
  const byGuard: Record<string, number> = {};
  let total = 0;
  for (const count of counts) {
    total += count.total;
    for (const [guard, number] of Object.entries(count.byGuard))
      byGuard[guard] = (byGuard[guard] ?? 0) + number;
  }
  return { total, byGuard };
}
